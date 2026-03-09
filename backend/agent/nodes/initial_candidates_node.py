"""초기 후보 추천 노드."""

from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.content_block_parser import parse_content_blocks
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def initial_candidates_node(state: NamingState) -> dict:
    # 후보가 없으면 먼저 생성
    current_candidates = list(state.get("current_candidates", []))
    if not current_candidates:
        try:
            from agent.tools.find_name_candidates_tool import find_name_candidates
            user_info = state.get("user_info", {})
            current_candidates = find_name_candidates(
                surname=user_info.get("surname", ""),
                gender=user_info.get("gender", "남"),
                session_id=state.get("session_id", ""),
                limit=8,
            )
        except Exception:
            current_candidates = []

    updated_state = dict(state)
    updated_state["current_candidates"] = current_candidates

    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    system_prompt = build_system_prompt(updated_state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    response = llm.invoke(messages)

    response_text = response.content if hasattr(response, "content") else str(response)
    content_blocks = parse_content_blocks(response_text)

    return {
        "messages": [response],
        "current_candidates": current_candidates,
        "stage": "payment_gate",
        "stage_turn_count": 0,
        "_content_blocks": content_blocks,
    }
