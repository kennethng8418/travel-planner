# Travel Planner — LangGraph + FastAPI

An AI-powered travel itinerary planner built with LangGraph and served via FastAPI.

## Architecture

```
User Message
     │
     ▼
classify_intent (Haiku — fast, cheap)
     │
     ├── general / more_info ──► general_chat (Sonnet) ──► Response
     │
     ├── new_trip ──► extract_preferences (Haiku)
     │                       │
     │                       ▼
     │                build_itinerary (Sonnet) ──► Response + Itinerary JSON
     │
     └── refine ──► refine_itinerary (Sonnet) ──► Response + Updated Itinerary
```

### Models
- **Claude Haiku** — intent classification, preference extraction (fast, cheap)
- **Claude Sonnet** — itinerary generation, refinement, general chat (strong reasoning)

## Setup

### Backend

```bash
cd travel-planner
pip install -r requirements.txt

# Set your API key
cp .env.example .env
# Edit .env with your Anthropic API key

python app.py
```

API runs at `http://localhost:8000`.

### Frontend (Next.js)

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

UI runs at `http://localhost:3000` and talks to the backend via WebSocket (`/ws/chat`).
Set `NEXT_PUBLIC_API_URL` if the API is not on localhost:8000.

## API Endpoints

### POST /chat
Simple request/response. Good for testing.

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Plan a 3-day trip to Tokyo, I love food and temples"}'
```

### WS /ws/chat
WebSocket with token streaming. Protocol:
1. Send session ID (or `"new"`) as first message
2. Send user messages as plain text
3. Receive JSON events: `status`, `token`, `result`, `error`

### GET /session/{session_id}
Retrieve conversation history and current itinerary.

### GET /health
Health check.

## Project Structure

```
travel-planner/
├── app.py                     # FastAPI endpoints
├── requirements.txt
├── .env.example
├── frontend/                  # Next.js UI (App Router, Tailwind)
│   └── src/
│       ├── app/               # Routes and layout
│       ├── components/        # Chat + itinerary UI
│       └── hooks/             # WebSocket client
├── backend/
│   ├── state.py               # PlannerState schema
│   ├── llm.py                 # Model configuration
│   ├── graph.py               # LangGraph agent definition
│   ├── nodes/
│   │   ├── chat.py            # Intent classification + general chat
│   │   ├── extract.py         # Preference extraction
│   │   ├── plan.py            # Itinerary generation
│   │   └── refine.py          # Itinerary refinement
│   └── tools/                 # Future: Google Places, weather API, etc.
```

## Next Steps

- [ ] Add Google Places API enrichment node
- [ ] Add weather API integration
- [ ] Swap MemorySaver for PostgresSaver (persistence across restarts)
- [ ] Add rate limiting and auth
- [x] Next.js frontend (streaming chat + itinerary panel)
