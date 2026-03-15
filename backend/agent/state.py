"""NamingState TypedDict — LangGraph 작명 에이전트 상태."""

from typing import Annotated, Literal
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

ExplorationMode = Literal["안정형", "확장형", "발음형", "의미형", "가족조화형"]

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
    reason_taste_profile: dict  # 명시적 이유 선택지 집계 기반 취향 프로파일 (reason_taste_profiler.py)
    exploration_mode: ExplorationMode | None  # 현재 탐색 모드 (None = 안정형 기본값)
    _exploration_mode_reason: str | None  # 모드 전환 시 사용자에게 전달할 제안 문장 (임시 필드)
    _content_blocks: list[dict]  # 현재 응답의 콘텐츠 블록 (TEXT / NAME)
    _awaiting_confirm: bool  # True면 반문 후 유저 확인 대기 중 (새 이름 추천 전 단계)
    recommendation_count: int  # 지금까지 이름을 추천한 총 횟수 (이름 1개 = 1 카운트)
