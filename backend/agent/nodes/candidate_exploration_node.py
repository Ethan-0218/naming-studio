"""후보 탐색 노드: 결제 후 무한 루프로 이름 탐색."""

import json
from langchain_core.messages import SystemMessage, AIMessage, ToolMessage, HumanMessage
from langchain_core.tools import tool as lc_tool
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.schemas import CandidatesOutput
from agent import name_store
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def candidate_exploration_node(state: NamingState) -> dict:
    user_info = state.get("user_info", {})
    사주 = state.get("사주_summary") or {}
    preference = state.get("preference_profile", {})
    session_id = state.get("session_id", "")
    call_count_ref = [state.get("candidate_call_count", 0)]

    @lc_tool
    def get_name_candidates(
        preferred_오행: str | None = None,
        max_받침_count: int | None = None,
        rarity_preference: str | None = None,
        name_feel_preference: str | None = None,
    ) -> str:
        """이름 후보를 DB에서 검색합니다.
        preferred_오행: 목/화/토/금/수 중 선호 오행.
        max_받침_count: 0=받침 없음, 1=최대 1글자 받침, null=제한 없음.
        rarity_preference: 희귀/보통/흔한.
        name_feel_preference: soft(ㅅㄴㅁㅇㅎㄹ)/strong(ㅂㄱㄷㅈㅊ)/null."""
        from agent.tools.find_name_candidates_tool import find_name_candidates
        pool_size = 200
        offset = call_count_ref[0] * pool_size
        candidates = find_name_candidates(
            surname=user_info.get("surname", ""),
            surname_hanja=user_info.get("surname_hanja", ""),
            gender=user_info.get("gender", "남"),
            session_id=session_id,
            부족한_오행=사주.get("부족한_오행", []),
            preferred_오행=preferred_오행,
            max_받침_count=max_받침_count,
            rarity_preference=rarity_preference,
            name_feel_preference=name_feel_preference,
            name_length=preference.get("name_length"),
            sibling_names=preference.get("sibling_names"),
            limit=12,
            pool_size=pool_size,
            offset=offset,
        )
        call_count_ref[0] += 1
        return json.dumps(candidates, ensure_ascii=False)

    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    tool_llm = llm.bind_tools([get_name_candidates])
    system_msg = SystemMessage(content=build_system_prompt(state))
    history = list(state.get("messages", []))
    loop_messages = [system_msg] + history

    # Phase 1: 툴 호출 루프 (최대 4회)
    for _ in range(4):
        ai_msg = tool_llm.invoke(loop_messages)
        if not ai_msg.tool_calls:
            break
        loop_messages.append(ai_msg)
        for tc in ai_msg.tool_calls:
            tool_result = get_name_candidates.invoke(tc["args"])
            loop_messages.append(ToolMessage(content=tool_result, tool_call_id=tc["id"]))

    # Phase 2: 구조화 출력
    structured_llm = llm.with_structured_output(CandidatesOutput, method="function_calling")
    result = structured_llm.invoke(
        loop_messages + [HumanMessage(content="위 후보들을 바탕으로 최종 추천을 structured output으로 작성하세요.")]
    )

    limited = _limit_name_blocks(result.content, max_names=3)
    content_blocks = [_to_frontend_block(block) for block in limited]

    # shown 기록
    shown_names = [b["data"]["한글"] for b in content_blocks if b["type"] == "NAME"]
    name_store.add_shown(session_id, shown_names)

    requirement_summary = result.updated_requirement_summary or state.get("requirement_summary", "")

    return {
        "messages": [AIMessage(content=_blocks_to_text(content_blocks))],
        "requirement_summary": requirement_summary,
        "stage": "candidate_exploration",
        "stage_turn_count": state.get("stage_turn_count", 0) + 1,
        "candidate_call_count": call_count_ref[0],
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
