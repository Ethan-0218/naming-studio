"""작명 방향 확인 노드."""

import json
import re
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def _extract_json(text: str) -> dict:
    match = re.search(r"<json>(.*?)</json>", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except (json.JSONDecodeError, ValueError):
            return {}
    return {}


def direction_confirm_node(state: NamingState) -> dict:
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    response = llm.invoke(messages)

    response_text = response.content if hasattr(response, "content") else str(response)
    extracted = _extract_json(response_text)

    confirmed = extracted.get("confirmed", False)
    if confirmed:
        # 초기 후보 생성 후 initial_candidates로
        next_stage = "initial_candidates"
    else:
        # 피드백 반영해 재브리핑
        next_stage = "direction_briefing"

    return {
        "messages": [response],
        "stage": next_stage,
        "stage_turn_count": 0,
    }
