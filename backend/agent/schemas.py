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
    """DB 필터로 사용되는 구조화 취향 필드만 저장. 서술형 취향은 naming_direction으로 통합."""
    model_config = ConfigDict(extra="ignore")
    max_받침_count: int | None = Field(None, description="받침 있는 글자 수 상한. 0=받침없음, 1=최대1개, null=제한없음")
    name_length: str | None = Field(None, description="이름 글자 수 선호. 외자/두글자/상관없음")
    sibling_names: list[str] | None = Field(None, description="형제자매 이름 목록. 예: ['서윤', '서준']")
    sibling_style_match: bool | None = Field(None, description="형제자매와 이름 계열 맞추기 여부")
    sibling_anchor_syllables: list[str] | None = Field(None, description="공유할 앵커 음절. 예: ['은', '우'] 또는 ['서']")
    sibling_anchor_patterns: list[str] | None = Field(None, description="앵커 음절 SQL LIKE 패턴. 예: ['은%', '%우'] 또는 ['서%']")
    rarity_preference: str | None = Field(None, description="이름 희귀도 선호. 독특한/평범한/상관없음")
    hanja_preference: str | None = Field(None, description="한자이름선호/순우리말/둘다")


class NamingDirectionDraftOutput(_Strict):
    """취향 인터뷰 완료 후 naming_direction 초안 생성용."""
    naming_direction: str = Field(description="수집된 느낌·의미·조건을 종합한 작명 방향 초안 (한 문장)")


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


class LLMCandidatesOutput(_Strict):
    content: list[LLMContentBlock]


# ── 취향 변경 감지 ────────────────────────────────────────────────────────

class PreferenceUpdateOutput(_Strict):
    """유저 메시지 취향 변경 감지 결과."""
    naming_direction: str = Field(description=(
        "현재 유효한 작명 방향 한 문장. "
        "유저가 취향을 언급했으면 기존 방향에 통합해 갱신. "
        "반응(좋아요/싫어요/재추천)만 한 경우 기존 방향 그대로."
    ))
    max_받침_count: int | None = Field(None, description="받침 조건 변경 시. 0=없음, 1=최대1개, 2=제한없음")
    name_length: str | None = Field(None, description="길이 변경 시. '외자'/'두글자'/'상관없음'")
