"""
Plan node — generates a structured day-by-day itinerary.

This is the core creative node. Uses the strong model to build
a detailed, well-paced itinerary based on extracted preferences.
"""

import json
from langchain_core.messages import AIMessage, SystemMessage
from backend.state import PlannerState
from backend.llm import strong_llm


PLAN_PROMPT = """You are an expert travel itinerary planner. Create a detailed day-by-day 
itinerary based on the user's preferences.

PREFERENCES:
{preferences}

RULES:
- Create exactly {days} days of activities
- Each day should have 3-5 activities with realistic timing
- Account for travel time between locations
- Mix activities based on user interests
- Include meal recommendations
- Consider opening hours and best times to visit
- Balance busy and relaxed days
- Group geographically close activities together

Return ONLY valid JSON in this format:
[
    {{
        "day": 1,
        "title": "Exploring [Neighborhood/Theme]",
        "activities": [
            {{
                "time": "09:00",
                "name": "Place or Activity Name",
                "description": "Brief description and tips",
                "type": "sightseeing | food | culture | nature | shopping | transport"
            }}
        ],
        "notes": "Any day-level tips (weather, transit passes, etc.)"
    }}
]

Return ONLY the JSON array. No markdown, no explanation."""


async def build_itinerary(state: PlannerState) -> dict:
    """Generate a complete itinerary from extracted preferences."""
    prefs = state.get("preferences", {})
    days = prefs.get("duration_days", 3)

    prefs_text = json.dumps(prefs, indent=2)
    prompt = PLAN_PROMPT.format(preferences=prefs_text, days=days)

    response = await strong_llm.ainvoke([
        SystemMessage(content=prompt),
        {"role": "user", "content": "Generate the itinerary now."},
    ])

    try:
        raw = response.content.strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        itinerary = json.loads(raw)
    except json.JSONDecodeError:
        itinerary = [{"day": 1, "title": "Error generating plan", "activities": [], "notes": ""}]

    # Build a readable summary message for the user
    summary_lines = [f"Here's your {days}-day itinerary for {prefs.get('destination', 'your trip')}!\n"]
    for day in itinerary:
        summary_lines.append(f"**Day {day['day']}: {day['title']}**")
        for act in day.get("activities", []):
            summary_lines.append(f"  {act['time']} — {act['name']}: {act['description']}")
        if day.get("notes"):
            summary_lines.append(f"  💡 {day['notes']}")
        summary_lines.append("")

    summary_lines.append("Would you like to adjust anything? I can swap days, add activities, "
                         "change the pace, or focus on specific interests.")

    summary = "\n".join(summary_lines)

    return {
        "itinerary": itinerary,
        "messages": [AIMessage(content=summary)],
        "status": "Itinerary generated",
    }
