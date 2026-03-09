"""취향 인터뷰 노드: 부모님의 이름 취향을 수집합니다."""

import json
import re
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from core.config import OPENAI_API_KEY, OPENAI_MODEL

_MIN_TURNS = 3


def _extract_json(text: str) -> dict:
    match = re.search(r"<json>(.*?)</json>", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except (json.JSONDecodeError, ValueError):
            return {}
    return {}


def preference_interview_node(state: NamingState) -> dict:
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    response = llm.invoke(messages)

    response_text = response.content if hasattr(response, "content") else str(response)
    extracted = _extract_json(response_text)

    turn_count = state.get("stage_turn_count", 0) + 1
    preference_profile = dict(state.get("preference_profile", {}))
    if "preference_profile" in extracted:
        preference_profile.update(extracted["preference_profile"])

    ready = extracted.get("ready_to_proceed", False)
    next_stage = "direction_briefing" if (ready and turn_count >= _MIN_TURNS) else "preference_interview"

    return {
        "messages": [response],
        "preference_profile": preference_profile,
        "stage": next_stage,
        "stage_turn_count": turn_count,
    }
