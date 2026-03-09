"""초기 후보 추천 노드."""

from langchain_core.messages import SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.schemas import CandidatesOutput
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def initial_candidates_node(state: NamingState) -> dict:
    current_candidates = list(state.get("current_candidates", []))
    if not current_candidates:
        try:
            from agent.tools.find_name_candidates_tool import find_name_candidates
            user_info = state.get("user_info", {})
            사주 = state.get("사주_summary") or {}
            preference = state.get("preference_profile", {})
            current_candidates = find_name_candidates(
                surname=user_info.get("surname", ""),
                surname_hanja=user_info.get("surname_hanja", ""),
                gender=user_info.get("gender", "남"),
                session_id=state.get("session_id", ""),
                부족한_오행=사주.get("부족한_오행", []),
                max_받침_count=preference.get("max_받침_count"),
                name_length=preference.get("name_length"),
                sibling_names=preference.get("sibling_names"),
                limit=8,
            )
        except Exception:
            current_candidates = []

    updated_state = dict(state)
    updated_state["current_candidates"] = current_candidates

    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    structured_llm = llm.with_structured_output(CandidatesOutput, method="function_calling")
    system_prompt = build_system_prompt(updated_state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    result = structured_llm.invoke(messages)

    limited = _limit_name_blocks(result.content, max_names=3)
    content_blocks = [_to_frontend_block(block) for block in limited]

    return {
        "messages": [AIMessage(content=_blocks_to_text(content_blocks))],
        "current_candidates": current_candidates,
        "stage": "payment_gate",
        "stage_turn_count": 0,
        "_content_blocks": content_blocks,
    }


def _limit_name_blocks(content: list, max_names: int = 3) -> list:
    """content에서 NAME 블록이 최대 max_names개가 되도록 초과분을 제거합니다. 순서 유지."""
    name_count = 0
    out = []
    for block in content:
        if getattr(block, "type", None) == "NAME":
            if name_count >= max_names:
                continue
            name_count += 1
        out.append(block)
    return out


def _to_frontend_block(block) -> dict:
    """평탄한 ContentBlock을 프론트엔드가 기대하는 중첩 형식으로 변환."""
    if block.type == "TEXT":
        return {"type": "TEXT", "data": {"text": block.text or ""}}
    return {"type": "NAME", "data": {
        "한글": block.한글 or "",
        "full_name": block.full_name or "",
        "syllables": [s.model_dump() for s in (block.syllables or [])],
        "발음오행_조화": block.발음오행_조화,
        "rarity_signal": block.rarity_signal,
        "reason": block.reason,
    }}


def _blocks_to_text(blocks: list[dict]) -> str:
    """content blocks에서 대화 텍스트 추출 (messages 히스토리용)."""
    parts = []
    for b in blocks:
        if b.get("type") == "TEXT":
            parts.append(b["data"]["text"])
        elif b.get("type") == "NAME":
            d = b["data"]
            parts.append(f"[이름 추천] {d.get('full_name', '')} — {d.get('reason', '')}")
    return "\n".join(parts)
