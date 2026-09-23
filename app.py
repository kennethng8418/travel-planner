"""
FastAPI application for the Travel Planner.

Endpoints:
  POST /chat          — simple request/response (good for testing)
  WS   /ws/chat       — WebSocket with token streaming (for real-time UI)
  GET  /health        — health check
  GET  /session/{id}  — retrieve conversation history for a session
"""

import uuid
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.messages import HumanMessage

from backend.graph import build_graph


# Graph nodes whose LLM output is written for the user and safe to stream token-by-token.
STREAMABLE_NODES = {"general_chat"}


# ── App setup ──────────────────────────────────────────────────
app = FastAPI(
    title="Travel Planner API",
    description="AI-powered travel itinerary planner using LangGraph",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single agent instance — MemorySaver handles per-session state
agent = build_graph()


# ── Models ─────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    response: str
    intent: str | None = None
    itinerary: list | None = None


# ── REST endpoint ──────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Simple request/response chat endpoint.
    Good for testing and non-streaming clients.
    """
    session_id = request.session_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": session_id}}

    # Run the graph
    result = await agent.ainvoke(
        {"messages": [HumanMessage(content=request.message)]},
        config=config,
    )

    # Extract the last AI message
    ai_messages = [m for m in result["messages"] if m.type == "ai"]
    response_text = ai_messages[-1].content if ai_messages else "I couldn't process that."

    return ChatResponse(
        session_id=session_id,
        response=response_text,
        intent=result.get("intent"),
        itinerary=result.get("itinerary"),
    )


# ── WebSocket endpoint (streaming) ────────────────────────────
@app.websocket("/ws/chat")
async def websocket_chat(ws: WebSocket):
    """
    WebSocket endpoint with streaming support.

    Protocol:
      1. Client sends first message as session_id (or "new" for a fresh session)
      2. Client sends user messages as plain text
      3. Server sends JSON events:
         - {"type": "status",  "content": "..."}  — node transitions
         - {"type": "token",   "content": "..."}  — streamed LLM tokens
         - {"type": "result",  "content": "...", "intent": "...", "itinerary": [...]}
         - {"type": "error",   "content": "..."}
    """
    await ws.accept()

    try:
        # First message = session ID
        raw = await ws.receive_text()
        session_id = raw if raw != "new" else str(uuid.uuid4())

        await ws.send_json({"type": "status", "content": f"Session: {session_id}"})

        while True:
            user_msg = await ws.receive_text()
            config = {"configurable": {"thread_id": session_id}}

            full_response = ""

            async for event in agent.astream_events(
                {"messages": [HumanMessage(content=user_msg)]},
                config=config,
                version="v2",
            ):
                kind = event["event"]

                # Stream tokens only from nodes whose LLM output is user-facing prose.
                # Other nodes (classifier, extractor, planner, refiner) emit labels/JSON;
                # their readable summaries arrive via the final "result" event.
                if kind == "on_chat_model_stream":
                    node = event.get("metadata", {}).get("langgraph_node")
                    if node not in STREAMABLE_NODES:
                        continue
                    chunk = event["data"].get("chunk")
                    if chunk and hasattr(chunk, "content") and isinstance(chunk.content, str) and chunk.content:
                        full_response += chunk.content
                        await ws.send_json({
                            "type": "token",
                            "content": chunk.content,
                        })

                # Report node transitions as status updates
                elif kind == "on_chain_start":
                    node_name = event.get("name", "")
                    status_map = {
                        "classify_intent": "Understanding your request...",
                        "extract_preferences": "Extracting travel preferences...",
                        "build_itinerary": "Building your itinerary...",
                        "refine_itinerary": "Updating your plan...",
                        "general_chat": "Thinking...",
                    }
                    if node_name in status_map:
                        await ws.send_json({
                            "type": "status",
                            "content": status_map[node_name],
                        })

            # Send final result with structured data while keeping machine JSON off the client.
            try:
                snapshot = agent.get_state(config)
                current_state = snapshot.values
                itinerary = current_state.get("itinerary")
                intent = current_state.get("intent")
                ai_messages = [m for m in current_state.get("messages", []) if getattr(m, "type", None) == "ai"]
                if ai_messages:
                    final_response = ai_messages[-1].content
                else:
                    final_response = full_response
            except Exception:
                itinerary = None
                intent = None
                final_response = full_response

            await ws.send_json({
                "type": "result",
                "content": final_response,
                "intent": intent,
                "itinerary": itinerary,
            })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "content": str(e)})
        except Exception:
            pass


# ── Session history endpoint ───────────────────────────────────
@app.get("/session/{session_id}")
async def get_session(session_id: str):
    """Retrieve conversation history and state for a session."""
    config = {"configurable": {"thread_id": session_id}}

    try:
        snapshot = agent.get_state(config)
        state = snapshot.values
        messages = [
            {"role": m.type, "content": m.content}
            for m in state.get("messages", [])
        ]
        return {
            "session_id": session_id,
            "messages": messages,
            "preferences": state.get("preferences"),
            "itinerary": state.get("itinerary"),
        }
    except Exception:
        return {"session_id": session_id, "messages": [], "error": "Session not found"}


# ── Health check ───────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "agent": "travel-planner", "version": "0.1.0"}


# ── Run ────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
