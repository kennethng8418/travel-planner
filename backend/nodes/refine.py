"""
Refine node — modifies an existing itinerary based on user feedback.

This is the iterative loop — users say "add more food spots" or
"swap day 2 and 3" and this node makes targeted changes while
preserving the rest of the plan.
"""

import json
from langchain_core.messages import AIMessage, SystemMessage
from backend.state import PlannerState
from backend.llm import strong_llm


REFINE_PROMPT = """You are a travel itinerary editor. The user wants to modify their existing plan.

CURRENT ITINERARY:
{itinerary}

USER PREFERENCES:
{preferences}

USER'S CHANGE REQUEST (from conversation):
Look at the user's latest message(s) for what they want changed.

RULES:
- Make only the requested changes — preserve everything else
- Keep the same JSON structure
- Maintain realistic timing and geographic grouping
- If swapping days, renumber appropriately

Return the COMPLETE updated itinerary as a JSON array (same format as input).
Return ONLY the JSON array. No markdown, no explanation."""


async def refine_itinerary(state: PlannerState) -> dict:
    """Refine the existing itinerary based on user feedback."""
    current = state.get("itinerary", [])
    prefs = state.get("preferences", {})

    prompt = REFINE_PROMPT.format(
        itinerary=json.dumps(current, indent=2),
        preferences=json.dumps(prefs, indent=2),
    )

    response = await strong_llm.ainvoke([
        SystemMessage(content=prompt),
        *state["messages"][-5:],  # Last few messages for context
    ])

    try:
        raw = response.content.strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        updated = json.loads(raw)
    except json.JSONDecodeError:
        # If parsing fails, keep existing and explain
        return {
            "messages": [AIMessage(
                content="I had trouble updating the itinerary. Could you describe "
                        "the change you'd like in a different way?"
            )],
        }

    # Build change summary
    summary_lines = ["Here's your updated itinerary:\n"]
    for day in updated:
        summary_lines.append(f"**Day {day['day']}: {day['title']}**")
        for act in day.get("activities", []):
            summary_lines.append(f"  {act['time']} — {act['name']}: {act['description']}")
        if day.get("notes"):
            summary_lines.append(f"  💡 {day['notes']}")
        summary_lines.append("")

    summary_lines.append("Anything else you'd like to change?")
    summary = "\n".join(summary_lines)

    return {
        "itinerary": updated,
        "messages": [AIMessage(content=summary)],
        "status": "Itinerary updated",
    }
