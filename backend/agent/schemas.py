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
    받침_preference: str | None = Field(None, description="받침 선호를 유저 표현 그대로 저장. 예: '받침 없는 이름 선호', '두 글자 모두 받침 있는 건 피함', '한 글자만 받침 허용', '상관없음'")
    max_받침_count: int | None = Field(None, description="이름에서 받침 있는 글자 수 상한. 0=받침 없음 선호, 1=최대 1글자만 받침 허용, 2=둘 다 받침 허용, null=제한 없음")
    liked_sounds: str | None = Field(None, description="좋아하는 발음")
    disliked_sounds: str | None = Field(None, description="싫어하는 발음")
    values: str | None = Field(None, description="이름에 담고 싶은 의미나 가치")
    avoid: str | None = Field(None, description="피하고 싶은 이름의 특징")
    extra: str | None = Field(None, description="기타 취향 정보")
    name_length: str | None = Field(None, description="이름 글자 수 선호. 외자/두글자/상관없음")
    sibling_names: list[str] | None = Field(None, description="형제자매 이름 목록. 예: ['서윤', '서준']")


class PreferenceInterviewOutput(_Strict):
    message: str
    preference_profile: PreferenceProfile = Field(default_factory=PreferenceProfile)


# ── 방향 브리핑 ───────────────────────────────────────────────────────────

class DirectionBriefingOutput(_Strict):
    message: str = Field(description="부모님께 전달할 작명 방향 설명 및 확인 질문")
    naming_direction: str = Field(description="작명 방향 한 문장 요약")


# ── 방향 확인 ─────────────────────────────────────────────────────────────

class DirectionConfirmOutput(_Strict):
    message: str = Field(description=(
        "부모님께 전달할 작명 방향 설명 및 확인 질문. "
        "반드시 3~5문장 이상으로 충분히 작성하세요: "
        "(1) 대화 내용 자연스럽게 요약, "
        "(2) 아이의 에너지·취향을 반영한 구체적 작명 방향 설명 — 왜 이 방향인지 부모님이 납득할 수 있도록, "
        "(3) '이 방향으로 진행할까요?' 확인 질문으로 마무리."
    ))
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


class CandidatesOutput(_Strict):
    content: list[ContentBlock]
    updated_naming_direction: str = Field("", description="변경된 작명 방향. 변경 없으면 빈 문자열.")


# ── LLM용 경량 이름 선택 스키마 ──────────────────────────────────────────

class LLMContentBlock(_Strict):
    """LLM이 반환하는 경량 블록. NAME_REF는 id와 reason만 채웁니다."""
    type: Literal["TEXT", "NAME_REF"] = Field(description="블록 종류: TEXT 또는 NAME_REF")
    text: str | None = Field(None, description="type=TEXT일 때 표시할 텍스트")
    id: int | None = Field(None, description="type=NAME_REF일 때 후보 이름의 id (후보 목록에 있는 id 그대로)")
    reason: str | None = Field(None, description="type=NAME_REF일 때 이름 추천 이유 (부모님께 쉬운 말로)")


class UpdatedPreferenceFields(_Strict):
    """탐색 중 유저 요청으로 변경된 취향 필드. 변경 없는 필드는 None."""
    max_받침_count: int | None = Field(None, description="변경 시에만. 0=받침없음, 1=최대1개, 2=제한없음")
    name_length: str | None = Field(None, description="변경 시에만. 예: '외자', '두글자', '상관없음'")
    name_feel: str | None = Field(None, description="변경 시에만. 예: '부드러운', '강한', '중성적'")


class LLMCandidatesOutput(_Strict):
    content: list[LLMContentBlock]
    updated_naming_direction: str = Field("", description="변경된 작명 방향. 변경 없으면 빈 문자열.")
    updated_preference_fields: UpdatedPreferenceFields = Field(
        default_factory=UpdatedPreferenceFields,
        description="유저가 이번 턴에 변경 요청한 취향 필드만 채우세요. 변경 없는 필드는 null.",
    )
