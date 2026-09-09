"""
Shared state schema for the travel planner LangGraph agent.

Every node in the graph reads from and writes to this state.
LangGraph merges updates automatically — each node only needs
to return the keys it changed.
"""

from typing import TypedDict, Optional, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class TravelPreferences(TypedDict, total=False):
    destination: str
    duration_days: int
    budget: str  # "budget", "mid-range", "luxury"
    interests: list[str]
    travel_dates: str
    num_travelers: int
    special_requests: str


class ItineraryDay(TypedDict, total=False):
    day: int
    title: str
    activities: list[dict]  # {time, name, description, location, type}
    notes: str


class PlannerState(TypedDict, total=False):
    # Conversation history — add_messages appends instead of replacing
    messages: Annotated[list[BaseMessage], add_messages]

    # Extracted user preferences
    preferences: TravelPreferences

    # The generated itinerary
    itinerary: list[ItineraryDay]

    # Routing
    intent: str  # "new_trip" | "refine" | "general" | "more_info_needed"

    # Status for streaming to frontend
    status: str
