"""NamingState TypedDict — LangGraph 작명 에이전트 상태."""

from typing import Annotated, Literal
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

Stage = Literal[
    "welcome",
    "info_collection",
    "preference_interview",
    "direction_briefing",
    "direction_confirm",
    "initial_candidates",
    "payment_gate",
    "candidate_exploration",
]


class NamingState(TypedDict):
    messages: Annotated[list, add_messages]
    stage: Stage
    stage_turn_count: int
    session_id: str
    user_info: dict
    missing_info_fields: list[str]
    사주_summary: dict | None
    preference_profile: dict
    requirement_summary: str
    naming_direction: str | None
    current_candidates: list[dict]
    payment_status: str  # "pending" | "completed"
