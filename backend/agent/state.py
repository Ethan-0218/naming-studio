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
    naming_direction: str | None
    current_candidates: list[dict]
    payment_status: str  # "pending" | "completed"
    sc_cursor: int  # scored_combinations SQL OFFSET 커서 (세션 전반에 누적)
    shown_name_scores: dict  # {한글이름: score_breakdown} — 보여준 이름의 점수 분포 캐시
    inferred_preferences: dict  # like/dislike 패턴에서 자동 추론된 취향 (취향 영역만)
    _content_blocks: list[dict]  # 현재 응답의 콘텐츠 블록 (TEXT / NAME)
