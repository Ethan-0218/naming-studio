"""작명 방향 브리핑 노드."""

import re
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def direction_briefing_node(state: NamingState) -> dict:
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    response = llm.invoke(messages)

    response_text = response.content if hasattr(response, "content") else str(response)

    # <naming_direction> 태그에서 방향 추출
    naming_direction = state.get("naming_direction")
    match = re.search(r"<naming_direction>(.*?)</naming_direction>", response_text, re.DOTALL)
    if match:
        naming_direction = match.group(1).strip()

    return {
        "messages": [response],
        "naming_direction": naming_direction,
        "stage": "direction_confirm",
        "stage_turn_count": 0,
    }
