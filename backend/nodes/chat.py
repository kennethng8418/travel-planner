"""
Chat node — the entry point for every user message.

Responsibilities:
  1. Classify the user's intent (new trip, refine existing, or general chat)
  2. For general questions, respond directly
  3. For trip-related intents, pass through to downstream nodes
"""

from langchain_core.messages import AIMessage, SystemMessage
from backend.state import PlannerState
from backend.llm import fast_llm, strong_llm


ROUTER_PROMPT = """You are a travel planner assistant router. Classify the user's latest message 
into exactly ONE of these intents:

- "new_trip": The user wants to plan a new trip or start fresh.
  Examples: "Plan me a trip to Japan", "I want to go to Paris for 5 days"

- "refine": The user wants to change, adjust, or get more details about an existing itinerary.
  Examples: "Swap day 2 and 3", "Add more food spots", "Make it more budget-friendly"

- "more_info_needed": The user is discussing a trip but hasn't given enough info to plan yet.
  Examples: "I want to travel somewhere warm", "Help me plan a vacation" (no destination/dates)

- "general": Anything else — greetings, travel advice, questions not about a specific trip.
  Examples: "Hi", "What's the best time to visit Europe?", "Thanks!"

Respond with ONLY the intent label, nothing else."""


async def classify_intent(state: PlannerState) -> dict:
    """Classify the user's message to determine graph routing."""
    messages = state["messages"]
    last_message = messages[-1].content

    # Check if we already have an itinerary (affects routing)
    has_itinerary = bool(state.get("itinerary"))

    context = f"Has existing itinerary: {has_itinerary}\nUser message: {last_message}"

    response = await fast_llm.ainvoke([
        SystemMessage(content=ROUTER_PROMPT),
        {"role": "user", "content": context},
    ])

    intent = response.content.strip().lower().strip('"')

    # Validate intent
    valid_intents = {"new_trip", "refine", "more_info_needed", "general"}
    if intent not in valid_intents:
        intent = "general"

    return {"intent": intent, "status": f"Classified intent: {intent}"}


GENERAL_CHAT_PROMPT = """You are a friendly, knowledgeable travel planning assistant.
You help people plan amazing trips. You're conversational and enthusiastic about travel.

If the user hasn't asked about a specific trip yet, engage them warmly and ask what 
kind of trip they're dreaming about.

If they need more information to plan a trip, ask helpful clarifying questions about:
- Destination preferences
- Travel dates and duration  
- Budget range
- Interests (food, culture, nature, nightlife, etc.)
- Number of travelers

Keep responses concise and engaging. Don't overwhelm with questions — ask 1-2 at a time."""


async def handle_general_chat(state: PlannerState) -> dict:
    """Handle general conversation and info-gathering."""
    response = await strong_llm.ainvoke([
        SystemMessage(content=GENERAL_CHAT_PROMPT),
        *state["messages"],
    ])

    return {"messages": [response]}
