"""후보 탐색 노드: 결제 후 무한 루프로 이름 탐색."""

from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.content_block_parser import parse_content_blocks, extract_meta
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def candidate_exploration_node(state: NamingState) -> dict:
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    response = llm.invoke(messages)

    response_text = response.content if hasattr(response, "content") else str(response)
    content_blocks = parse_content_blocks(response_text)
    meta = extract_meta(response_text)

    current_candidates = list(state.get("current_candidates", []))
    requirement_summary = state.get("requirement_summary", "")

    # 새 후보 요청
    if meta.get("request_new_candidates"):
        try:
            from agent.tools.find_name_candidates_tool import find_name_candidates
            user_info = state.get("user_info", {})
            filters = meta.get("candidate_filters", {})
            current_candidates = find_name_candidates(
                surname=user_info.get("surname", ""),
                gender=user_info.get("gender", "남"),
                session_id=state.get("session_id", ""),
                preferred_오행=filters.get("preferred_오행"),
                require_받침=filters.get("require_받침"),
                rarity_preference=filters.get("rarity_preference"),
                limit=8,
            )
        except Exception:
            pass

    # 요구사항 요약 업데이트
    updated_summary = meta.get("updated_requirement_summary")
    if updated_summary:
        requirement_summary = updated_summary

    return {
        "messages": [response],
        "current_candidates": current_candidates,
        "requirement_summary": requirement_summary,
        "stage": "candidate_exploration",  # 루프
        "stage_turn_count": state.get("stage_turn_count", 0) + 1,
        "_content_blocks": content_blocks,
    }
