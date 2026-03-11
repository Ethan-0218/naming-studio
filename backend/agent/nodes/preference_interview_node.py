"""취향 인터뷰 노드: 섹션별 CHOICE_GROUP UI로 취향을 구조화해 수집합니다."""

from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.schemas import NamingDirectionDraftOutput
from agent.progress import emit
from core.config import OPENAI_API_KEY, OPENAI_MODEL


# ── 질문 순서 ────────────────────────────────────────────────────────────

_QUESTION_SEQUENCE = [
    "sibling_names",
    "name_length",
    "rarity_preference",
    "_section3_feel",
    "_section3_values",
    "_section3_avoid",
]


# ── CHOICE_GROUP 블록 정의 ────────────────────────────────────────────────

def _make_choice_block(question_key: str) -> dict:
    blocks = {
        "sibling_names": {
            "type": "CHOICE_GROUP",
            "data": {
                "question": "형제자매 이름이 있나요?",
                "choices": ["있어요", "없어요"],
                "multi": False,
                "allow_custom": False,
                "field_key": "sibling_names",
                "follow_up": {
                    "trigger": "있어요",
                    "placeholder": "이름을 입력해주세요 (예: 서윤, 서준)",
                },
            },
        },
        "name_length": {
            "type": "CHOICE_GROUP",
            "data": {
                "question": "이름은 몇 글자로 하실 건가요?",
                "choices": ["외자", "두 글자", "상관없어요"],
                "multi": False,
                "allow_custom": False,
                "field_key": "name_length",
            },
        },
        "rarity_preference": {
            "type": "CHOICE_GROUP",
            "data": {
                "question": "이름 희귀도는 어떻게 하실 건가요?",
                "choices": ["독특한 이름 원해요", "평범한 이름 좋아요", "상관없어요"],
                "multi": False,
                "allow_custom": False,
                "field_key": "rarity_preference",
            },
        },
        "_section3_feel": {
            "type": "CHOICE_GROUP",
            "data": {
                "question": "원하는 이름 느낌을 모두 골라주세요",
                "choices": [
                    "단정하고 고급스러운",
                    "밝고 사랑스러운",
                    "지적인",
                    "강인한",
                    "맑고 자연스러운",
                    "중성적인",
                ],
                "multi": True,
                "allow_custom": True,
                "field_key": "_section3_feel",
            },
        },
        "_section3_values": {
            "type": "CHOICE_GROUP",
            "data": {
                "question": "이름에 담고 싶은 의미를 모두 골라주세요",
                "choices": ["건강", "지혜", "따뜻함", "총명함", "품격", "밝음", "부드러움", "리더십"],
                "multi": True,
                "allow_custom": True,
                "field_key": "_section3_values",
            },
        },
        "_section3_avoid": {
            "type": "CHOICE_GROUP",
            "data": {
                "question": "피하고 싶은 조건이 있으면 모두 골라주세요",
                "choices": ["받침 많은 이름", "너무 흔한 이름", "센 발음", "특별한 조건 없음"],
                "multi": True,
                "allow_custom": True,
                "field_key": "_section3_avoid",
            },
        },
    }
    return blocks[question_key]


# ── 응답 파싱 ────────────────────────────────────────────────────────────

def _parse_answer(question_key: str, user_msg: str) -> dict:
    """유저 메시지를 파싱해 preference_profile 업데이트 딕셔너리를 반환."""
    msg = user_msg.strip()
    updates: dict = {}

    if question_key == "sibling_names":
        if "없어요" in msg:
            updates["sibling_names"] = []
        else:
            # "있어요: 서윤, 서준" 또는 "서윤, 서준" 형태
            names_part = msg.split(":", 1)[-1].strip() if "있어요" in msg else msg
            names = [n.strip() for n in names_part.replace(",", " ").replace("，", " ").split() if n.strip()]
            updates["sibling_names"] = names if names else []

    elif question_key == "name_length":
        if "외자" in msg:
            updates["name_length"] = "외자"
        elif "두 글자" in msg or "두글자" in msg:
            updates["name_length"] = "두글자"
        else:
            updates["name_length"] = "상관없음"

    elif question_key == "rarity_preference":
        if "독특" in msg:
            updates["rarity_preference"] = "독특한"
        elif "평범" in msg:
            updates["rarity_preference"] = "평범한"
        else:
            updates["rarity_preference"] = "상관없음"

    elif question_key == "_section3_feel":
        updates["_section3_feel"] = msg

    elif question_key == "_section3_values":
        updates["_section3_values"] = msg

    elif question_key == "_section3_avoid":
        updates["_section3_avoid"] = msg
        # 받침 많은 이름 선택 → max_받침_count 구조화 필드도 함께 설정
        if "받침 많은 이름" in msg:
            updates["max_받침_count"] = 1
        # 너무 흔한 이름 → rarity_preference (이미 Q4에서 설정됐을 수 있으나, 우선순위: avoid 선택)
        if "너무 흔한 이름" in msg and updates.get("rarity_preference") is None:
            updates["rarity_preference"] = "독특한"

    return updates


def _get_next_question(profile: dict) -> str | None:
    """다음으로 물어볼 질문 키를 반환. None이면 인터뷰 완료."""
    for q in _QUESTION_SEQUENCE:
        if profile.get(q) is None:
            return q
    return None


def _get_ack_text(question_key: str | None, user_msg: str) -> str:
    """이전 질문에 대한 짧은 확인 메시지를 반환."""
    if question_key is None:
        return ""
    acks = {
        "sibling_names": "확인했어요!",
        "name_length": "이름 길이를 기억했어요.",
        "rarity_preference": "이제 이름의 느낌과 의미에 대해 여쭤볼게요.",
        "_section3_feel": "느낌 취향을 기억했어요.",
        "_section3_values": "담고 싶은 의미를 기억했어요.",
    }
    return acks.get(question_key, "")


def _get_last_user_message(messages: list) -> str:
    for m in reversed(messages):
        if isinstance(m, HumanMessage):
            return m.content if isinstance(m.content, str) else ""
    return ""


# ── 방향 초안 생성 (LLM 호출) ────────────────────────────────────────────

def _generate_naming_direction_draft(state: NamingState, profile: dict) -> str:
    """Section 3 + 구조화 취향 정보를 바탕으로 naming_direction 초안을 LLM이 생성."""
    emit("작명 방향을 정리하고 있어요...")
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    structured_llm = llm.with_structured_output(NamingDirectionDraftOutput, method="function_calling")
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    result = structured_llm.invoke(messages)
    return result.naming_direction


# ── 메인 노드 ────────────────────────────────────────────────────────────

def preference_interview_node(state: NamingState) -> dict:
    emit("취향을 파악하고 있어요...")
    profile = dict(state.get("preference_profile", {}))
    turn = state.get("stage_turn_count", 0)
    messages = list(state.get("messages", []))

    # ── 첫 턴: 인트로 + 첫 질문 (LLM 없이 즉시) ────────────────────────
    if turn == 0:
        blocks = [
            {"type": "TEXT", "data": {"text": "이름 취향에 대해 몇 가지 여쭤볼게요. 선택지를 탭하거나 직접 말씀해 주셔도 됩니다 😊"}},
            _make_choice_block("sibling_names"),
        ]
        profile["_current_question"] = "sibling_names"
        return {
            "messages": [AIMessage(content="이름 취향에 대해 몇 가지 여쭤볼게요.")],
            "preference_profile": profile,
            "stage": "preference_interview",
            "stage_turn_count": 1,
            "_content_blocks": blocks,
        }

    # ── 이전 질문 응답 파싱 ─────────────────────────────────────────────
    current_q = profile.pop("_current_question", None)
    last_user_msg = _get_last_user_message(messages)

    if current_q and last_user_msg:
        updates = _parse_answer(current_q, last_user_msg)
        profile.update(updates)

    # ── 다음 질문 결정 ──────────────────────────────────────────────────
    next_q = _get_next_question(profile)

    if next_q is None:
        # 모든 질문 완료 → LLM으로 naming_direction 초안 생성 → direction_confirm으로
        naming_direction = _generate_naming_direction_draft(state, profile)
        # _section3_* 임시 필드 제거 (naming_direction으로 통합 완료, 이후 stale 충돌 방지)
        for key in ("_section3_feel", "_section3_values", "_section3_avoid"):
            profile.pop(key, None)
        return {
            "messages": [AIMessage(content="취향을 모두 파악했어요! 작명 방향을 정리해드릴게요.")],
            "preference_profile": profile,
            "naming_direction": naming_direction,
            "stage": "direction_confirm",
            "stage_turn_count": turn + 1,
            "_content_blocks": [
                {"type": "TEXT", "data": {"text": "취향을 모두 파악했어요! 작명 방향을 정리해드릴게요."}}
            ],
        }

    # ── 다음 질문 블록 반환 ─────────────────────────────────────────────
    ack = _get_ack_text(current_q, last_user_msg)
    blocks: list[dict] = []
    if ack:
        blocks.append({"type": "TEXT", "data": {"text": ack}})
    blocks.append(_make_choice_block(next_q))
    profile["_current_question"] = next_q

    return {
        "messages": [AIMessage(content=ack or "다음 질문이에요.")],
        "preference_profile": profile,
        "stage": "preference_interview",
        "stage_turn_count": turn + 1,
        "_content_blocks": blocks,
    }
