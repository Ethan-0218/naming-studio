"""후보 탐색 노드: 결제 후 무한 루프로 이름 탐색."""

from langchain_core.messages import SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.schemas import CandidatesOutput
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def candidate_exploration_node(state: NamingState) -> dict:
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    structured_llm = llm.with_structured_output(CandidatesOutput, method="function_calling")
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    result = structured_llm.invoke(messages)

    current_candidates = list(state.get("current_candidates", []))
    requirement_summary = state.get("requirement_summary", "")

    if result.request_new_candidates:
        try:
            from agent.tools.find_name_candidates_tool import find_name_candidates
            user_info = state.get("user_info", {})
            사주 = state.get("사주_summary") or {}
            filters = result.candidate_filters
            preference = state.get("preference_profile", {})
            pool_size = 500
            call_count = state.get("candidate_call_count", 0)
            current_candidates = find_name_candidates(
                surname=user_info.get("surname", ""),
                surname_hanja=user_info.get("surname_hanja", ""),
                gender=user_info.get("gender", "남"),
                session_id=state.get("session_id", ""),
                부족한_오행=사주.get("부족한_오행", []),
                preferred_오행=filters.preferred_오행,
                max_받침_count=filters.max_받침_count,
                rarity_preference=filters.rarity_preference,
                name_length=preference.get("name_length"),
                sibling_names=preference.get("sibling_names"),
                limit=8,
                pool_size=pool_size,
                offset=call_count * pool_size,
            )
            candidate_call_count = call_count + 1
        except Exception:
            candidate_call_count = state.get("candidate_call_count", 0)
    else:
        candidate_call_count = state.get("candidate_call_count", 0)

    if result.updated_requirement_summary:
        requirement_summary = result.updated_requirement_summary

    limited = _limit_name_blocks(result.content, max_names=3)
    content_blocks = [_to_frontend_block(block) for block in limited]

    return {
        "messages": [AIMessage(content=_blocks_to_text(content_blocks))],
        "current_candidates": current_candidates,
        "requirement_summary": requirement_summary,
        "stage": "candidate_exploration",
        "stage_turn_count": state.get("stage_turn_count", 0) + 1,
        "candidate_call_count": candidate_call_count,
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
    parts = []
    for b in blocks:
        if b.get("type") == "TEXT":
            parts.append(b["data"]["text"])
        elif b.get("type") == "NAME":
            d = b["data"]
            parts.append(f"[이름 추천] {d.get('full_name', '')} — {d.get('reason', '')}")
    return "\n".join(parts)
