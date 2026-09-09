"""
LangGraph agent definition for the travel planner.

Graph structure:
                          
    classify_intent
         │
    ┌────┼──────────┬──────────────┐
    │    │          │              │
    ▼    ▼          ▼              ▼
  general  more_info  new_trip    refine
    │       │          │           │
    │       │          ▼           │
    │       │      extract         │
    │       │          │           │
    │       │          ▼           │
    │       │        plan          │
    │       │          │           │
    ▼       ▼          ▼           ▼
              END (response sent)
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from backend.state import PlannerState
from backend.nodes import (
    classify_intent,
    handle_general_chat,
    extract_preferences,
    build_itinerary,
    refine_itinerary,
)


def route_by_intent(state: PlannerState) -> str:
    """Route to the appropriate node based on classified intent."""
    intent = state.get("intent", "general")
    return intent


def build_graph(checkpointer=None):
    """Build and compile the travel planner LangGraph agent."""

    graph = StateGraph(PlannerState)

    # --- Add nodes ---
    graph.add_node("classify_intent", classify_intent)
    graph.add_node("general_chat", handle_general_chat)
    graph.add_node("extract_preferences", extract_preferences)
    graph.add_node("build_itinerary", build_itinerary)
    graph.add_node("refine_itinerary", refine_itinerary)

    # --- Entry point ---
    graph.set_entry_point("classify_intent")

    # --- Conditional routing from classifier ---
    graph.add_conditional_edges(
        "classify_intent",
        route_by_intent,
        {
            "general": "general_chat",
            "more_info_needed": "general_chat",
            "new_trip": "extract_preferences",
            "refine": "refine_itinerary",
        },
    )

    # --- Linear edges ---
    graph.add_edge("general_chat", END)
    graph.add_edge("extract_preferences", "build_itinerary")
    graph.add_edge("build_itinerary", END)
    graph.add_edge("refine_itinerary", END)

    # --- Compile ---
    if checkpointer is None:
        checkpointer = MemorySaver()

    return graph.compile(checkpointer=checkpointer)


# Default agent instance
agent = build_graph()
