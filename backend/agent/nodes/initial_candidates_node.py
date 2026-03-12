"""초기 후보 추천 노드."""

import logging

logger = logging.getLogger(__name__)

from langchain_core.messages import SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.schemas import LLMCandidatesOutput
from agent import name_store
from agent.progress import emit
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def initial_candidates_node(state: NamingState) -> dict:
    current_candidates = list(state.get("current_candidates", []))
    if not current_candidates:
        emit("이름 후보를 데이터베이스에서 검색하고 있어요...")
        try:
            from agent.tools.find_name_candidates_tool import find_name_candidates
            user_info = state.get("user_info", {})
            사주 = state.get("사주_summary") or {}
            preference = state.get("preference_profile", {})
            reason_profile = state.get("reason_taste_profile") or {}
            logger.info(
                "[초기후보] DB 검색 시작 (성=%s 성별=%s)",
                user_info.get("surname", ""), user_info.get("gender", "남"),
            )
            current_candidates = find_name_candidates(
                surname=user_info.get("surname", ""),
                surname_hanja=user_info.get("surname_hanja", ""),
                gender=user_info.get("gender", "남"),
                session_id=state.get("session_id", ""),
                부족한_오행=사주.get("부족한_오행", []),
                max_받침_count=preference.get("max_받침_count"),
                sibling_names=preference.get("sibling_names"),
                sibling_anchor_syllables=preference.get("sibling_anchor_syllables"),
                sibling_anchor_patterns=preference.get("sibling_anchor_patterns"),
                limit=8,
                dominant_like_reasons=reason_profile.get("dominant_like", []),
                dominant_dislike_reasons=reason_profile.get("dominant_dislike", []),
                total_reactions=reason_profile.get("total_reactions_with_reasons", 0),
            )
            logger.info("[초기후보] DB 검색 완료: %d개 후보", len(current_candidates))
        except Exception:
            logger.exception("[초기후보] DB 검색 실패")
            current_candidates = []

    if not current_candidates:
        logger.warning("[초기후보] 후보가 0개 — 에러 메시지 반환")
        error_block = {"type": "TEXT", "data": {"text": "죄송해요, 조건에 맞는 이름 후보를 찾지 못했어요. 잠시 후 다시 시도해 주세요."}}
        return {
            "messages": [AIMessage(content=error_block["data"]["text"])],
            "current_candidates": [],
            "stage": "payment_gate",
            "stage_turn_count": 0,
            "_content_blocks": [error_block],
        }

    updated_state = dict(state)
    updated_state["current_candidates"] = current_candidates

    emit("이름 후보를 검토하고 있어요...")
    logger.info("[초기후보] LLM 구조화 출력 시작")
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    structured_llm = llm.with_structured_output(LLMCandidatesOutput, method="function_calling")
    system_prompt = build_system_prompt(updated_state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    result = structured_llm.invoke(messages)

    candidates_by_id = {c["id"]: c for c in current_candidates if "id" in c}
    limited = _limit_name_ref_blocks(result.content, max_names=3)
    content_blocks = _resolve_blocks(limited, candidates_by_id)

    # 전문가 해설 블록을 맨 앞에 삽입
    if result.expert_commentary:
        commentary_block = {"type": "TEXT", "data": {"text": result.expert_commentary}}
        content_blocks = [commentary_block] + content_blocks

    shown_names = [b["data"]["한글"] for b in content_blocks if b["type"] == "NAME"]
    logger.info("[초기후보] 최종 추천 %d개: %s", len(shown_names), shown_names)
    name_store.add_shown(state.get("session_id", ""), shown_names)

    # shown_name_scores 갱신: score_breakdown + rarity_signal 캐시
    shown_name_scores = dict(state.get("shown_name_scores") or {})
    for b in content_blocks:
        if b["type"] == "NAME":
            d = b["data"]
            entry: dict = dict(d.get("score_breakdown") or {})
            if d.get("rarity_signal"):
                entry["rarity_signal"] = d["rarity_signal"]
            if entry:
                shown_name_scores[d["한글"]] = entry

    return {
        "messages": [AIMessage(content=_blocks_to_text(content_blocks))],
        "current_candidates": current_candidates,
        "stage": "payment_gate",
        "stage_turn_count": 0,
        "shown_name_scores": shown_name_scores,
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
                logger.warning("[초기후보] NAME_REF id=%s 미매칭 (candidates_by_id keys=%s)", block.id, list(candidates_by_id.keys()))
    return result


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
