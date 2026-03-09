"""LLM 구조화 출력 스키마 (Pydantic).

OpenAI strict JSON schema 요구사항:
- 모든 모델에 model_config = ConfigDict(extra="forbid") 필수
  → additionalProperties: false 생성
"""

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class _Strict(BaseModel):
    """additionalProperties: false를 보장하는 베이스 클래스."""
    model_config = ConfigDict(extra="forbid")


# ── 단순 대화 ─────────────────────────────────────────────────────────────

class SimpleMessageOutput(_Strict):
    message: str


# ── 정보 수집 ─────────────────────────────────────────────────────────────

class UserInfoUpdate(_Strict):
    surname: str | None = None
    surname_hanja: str | None = None
    gender: str | None = Field(None, description="남 또는 여")
    birth_date: str | None = Field(None, description="YYYY-MM-DD 형식")
    birth_time: str | None = Field(None, description="HH:MM 형식 또는 null")
    is_lunar: bool | None = None


class InfoCollectionOutput(_Strict):
    message: str
    user_info_update: UserInfoUpdate = Field(default_factory=UserInfoUpdate)


# ── 취향 인터뷰 ───────────────────────────────────────────────────────────

class PreferenceProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name_feel: str | None = Field(None, description="이름의 느낌. 예: 부드러운, 강한, 중성적")
    받침_preference: str | None = Field(None, description="받침 선호. 있음/없음/상관없음")
    liked_sounds: str | None = Field(None, description="좋아하는 발음")
    disliked_sounds: str | None = Field(None, description="싫어하는 발음")
    values: str | None = Field(None, description="이름에 담고 싶은 의미나 가치")
    avoid: str | None = Field(None, description="피하고 싶은 이름의 특징")
    extra: str | None = Field(None, description="기타 취향 정보")


class PreferenceInterviewOutput(_Strict):
    message: str
    preference_profile: PreferenceProfile = Field(default_factory=PreferenceProfile)


# ── 방향 브리핑 ───────────────────────────────────────────────────────────

class DirectionBriefingOutput(_Strict):
    message: str = Field(description="부모님께 전달할 작명 방향 설명 및 확인 질문")
    naming_direction: str = Field(description="작명 방향 한 문장 요약")


# ── 방향 확인 ─────────────────────────────────────────────────────────────

class DirectionConfirmOutput(_Strict):
    message: str
    naming_direction: str = Field(description="이번에 제안하는 작명 방향 한 문장 요약")
    confirmed: bool = Field(description="방향에 동의하면 True, 수정을 원하면 False")
    feedback: str | None = Field(None, description="수정 요청 시 원하는 방향 변경 내용")


# ── 이름 후보 공통 ────────────────────────────────────────────────────────

class SyllableInfo(_Strict):
    한글: str
    한자: str
    meaning: str
    오행: str = ""


class ContentBlock(_Strict):
    """TEXT 또는 NAME 블록. type에 따라 관련 필드만 채우면 됩니다."""
    type: Literal["TEXT", "NAME"] = Field(description="블록 종류: TEXT 또는 NAME")
    # TEXT 전용
    text: str | None = Field(None, description="type=TEXT일 때 표시할 텍스트")
    # NAME 전용
    한글: str | None = Field(None, description="type=NAME일 때 한글 이름 (예: 준서)")
    full_name: str | None = Field(None, description="type=NAME일 때 전체 이름 (성+이름, 예: 김준서)")
    syllables: list[SyllableInfo] | None = Field(None, description="type=NAME일 때 음절별 정보")
    발음오행_조화: str = Field("반길", description="발음오행 조화 등급: 대길/반길/대흉")
    rarity_signal: str = Field("보통", description="희귀도: 희귀/보통/흔한")
    reason: str = Field("", description="type=NAME일 때 이름 추천 이유")


class CandidateFilters(_Strict):
    preferred_오행: str | None = Field(None, description="선호 오행. 목/화/토/금/수 중 하나")
    require_받침: str | None = Field(None, description="받침 조건. 있음 또는 없음")
    rarity_preference: str | None = Field(None, description="희귀도 선호. 희귀/보통/흔함")


class CandidatesOutput(_Strict):
    content: list[ContentBlock]
    request_new_candidates: bool = Field(False, description="새 후보 풀을 다시 조회해야 하면 True")
    candidate_filters: CandidateFilters = Field(default_factory=CandidateFilters)
    updated_requirement_summary: str = Field("", description="지금까지 파악된 요구사항 누적 요약")
