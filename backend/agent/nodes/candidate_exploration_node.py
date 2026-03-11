"""후보 탐색 노드: 결제 후 무한 루프로 이름 탐색."""

import json
import logging

logger = logging.getLogger(__name__)
from langchain_core.messages import SystemMessage, AIMessage, ToolMessage, HumanMessage
from langchain_core.tools import tool as lc_tool
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.schemas import LLMCandidatesOutput
from agent import name_store
from agent.progress import emit
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def candidate_exploration_node(state: NamingState) -> dict:
    user_info = state.get("user_info", {})
    사주 = state.get("사주_summary") or {}
    preference = state.get("preference_profile", {})
    session_id = state.get("session_id", "")
    sc_cursor_ref = [state.get("sc_cursor", 0)]

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
            sc_cursor=sc_cursor_ref[0],
        )
        sc_cursor_ref[0] += pool_size
        return json.dumps(candidates, ensure_ascii=False)

    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    tool_llm = llm.bind_tools([get_name_candidates])
    system_msg = SystemMessage(content=build_system_prompt(state))
    history = list(state.get("messages", []))
    loop_messages = [system_msg] + history

    # Phase 1: 툴 호출 루프 (최대 4회)
    tool_call_count = 0
    for i in range(4):
        logger.info("[탐색노드] Phase1 루프 %d/%d 시작", i + 1, 4)
        emit(f"이름 후보를 탐색하고 있어요... ({i + 1}번째)")
        ai_msg = tool_llm.invoke(loop_messages)
        if not ai_msg.tool_calls:
            break
        loop_messages.append(ai_msg)
        for tc in ai_msg.tool_calls:
            tool_result = get_name_candidates.invoke(tc["args"])
            loop_messages.append(ToolMessage(content=tool_result, tool_call_id=tc["id"]))
            tool_call_count += 1
    logger.info("[탐색노드] Phase1 종료: 툴 %d회 호출됨", tool_call_count)

    # Phase 2: 구조화 출력
    logger.info("[탐색노드] Phase2 구조화 출력 시작")
    emit("최종 이름을 다듬고 있어요...")
    structured_llm = llm.with_structured_output(LLMCandidatesOutput, method="function_calling")
    result = structured_llm.invoke(
        loop_messages + [HumanMessage(content="위 후보들을 바탕으로 최종 추천을 structured output으로 작성하세요.")]
    )

    # 툴 결과에서 후보 수집해 id 조회 맵 구성
    all_tool_candidates: list[dict] = []
    for msg in loop_messages:
        if isinstance(msg, ToolMessage):
            try:
                tool_cands = json.loads(msg.content)
                if isinstance(tool_cands, list):
                    all_tool_candidates.extend(tool_cands)
            except Exception:
                pass
    candidates_by_id = {c["id"]: c for c in all_tool_candidates if "id" in c}

    limited = _limit_name_ref_blocks(result.content, max_names=3)
    content_blocks = _resolve_blocks(limited, candidates_by_id)

    # shown 기록
    shown_names = [b["data"]["한글"] for b in content_blocks if b["type"] == "NAME"]
    logger.info("[탐색노드] 최종 추천 %d개: %s", len(shown_names), shown_names)
    name_store.add_shown(session_id, shown_names)

    requirement_summary = result.updated_requirement_summary or state.get("requirement_summary", "")

    return {
        "messages": [AIMessage(content=_blocks_to_text(content_blocks))],
        "requirement_summary": requirement_summary,
        "stage": "candidate_exploration",
        "stage_turn_count": state.get("stage_turn_count", 0) + 1,
        "sc_cursor": sc_cursor_ref[0],
        "_content_blocks": content_blocks,
    }


def _limit_name_ref_blocks(content: list, max_names: int = 3) -> list:
    """content에서 NAME_REF 블록이 최대 max_names개가 되도록 초과분을 제거합니다."""
    name_count = 0
    out = []
    for block in content:
        if getattr(block, "type", None) == "NAME_REF":
            if name_count >= max_names:
                continue
            name_count += 1
        out.append(block)
    return out


def _resolve_blocks(content: list, candidates_by_id: dict) -> list[dict]:
    """LLM의 경량 블록을 후보 데이터로 조회해 프론트엔드 형식으로 조립."""
    result = []
    for block in content:
        if block.type == "TEXT":
            result.append({"type": "TEXT", "data": {"text": block.text or ""}})
        elif block.type == "NAME_REF":
            cand = candidates_by_id.get(block.id)
            if cand:
                result.append({"type": "NAME", "data": {
                    "한글": cand["한글"],
                    "full_name": cand["full_name"],
                    "syllables": cand["syllables"],
                    "발음오행_조화": cand["발음오행_조화"],
                    "발음오행_조화_이유": cand.get("발음오행_조화_이유", ""),
                    "rarity_signal": cand["rarity_signal"],
                    "score_breakdown": cand.get("score_breakdown", {}),
                    "reason": block.reason or "",
                }})
            else:
                logger.warning("[탐색노드] NAME_REF id=%s 미매칭 (candidates_by_id keys=%s)", block.id, list(candidates_by_id.keys()))
    return result


def _blocks_to_text(blocks: list[dict]) -> str:
    parts = []
    for b in blocks:
        if b.get("type") == "TEXT":
            parts.append(b["data"]["text"])
        elif b.get("type") == "NAME":
            d = b["data"]
            parts.append(f"[이름 추천] {d.get('full_name', '')} — {d.get('reason', '')}")
    return "\n".join(parts)
