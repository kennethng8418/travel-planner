"""
Extract node — parses structured travel preferences from the conversation.

Uses a fast model with structured output to pull destination, dates,
budget, interests, etc. from the user's natural language messages.
"""

import json
from langchain_core.messages import SystemMessage
from backend.state import PlannerState
from backend.llm import fast_llm


EXTRACT_PROMPT = """Analyze the full conversation and extract travel preferences.
Return ONLY valid JSON with this structure (omit fields you can't determine):

{
    "destination": "city or country",
    "duration_days": 5,
    "budget": "budget | mid-range | luxury",
    "interests": ["food", "culture", "nature", "nightlife", "history", "adventure"],
    "travel_dates": "March 2025",
    "num_travelers": 2,
    "special_requests": "any specific requests"
}

Return ONLY the JSON object, no markdown, no explanation."""


async def extract_preferences(state: PlannerState) -> dict:
    """Extract structured preferences from conversation history."""

    response = await fast_llm.ainvoke([
        SystemMessage(content=EXTRACT_PROMPT),
        *state["messages"],
    ])

    try:
        # Strip any markdown fencing the model might add
        raw = response.content.strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        preferences = json.loads(raw)
    except json.JSONDecodeError:
        preferences = {"destination": "unknown"}

    # Merge with existing preferences (user might add info incrementally)
    existing = state.get("preferences", {})
    merged = {**existing, **{k: v for k, v in preferences.items() if v}}

    return {
        "preferences": merged,
        "status": f"Extracted preferences: {merged.get('destination', 'unknown')}",
    }
