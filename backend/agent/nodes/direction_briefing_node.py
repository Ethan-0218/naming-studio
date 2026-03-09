"""작명 방향 브리핑 노드."""

from langchain_core.messages import SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.schemas import DirectionBriefingOutput
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def direction_briefing_node(state: NamingState) -> dict:
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    structured_llm = llm.with_structured_output(DirectionBriefingOutput, method="function_calling")
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    result = structured_llm.invoke(messages)

    return {
        "messages": [AIMessage(content=result.message)],
        "naming_direction": result.naming_direction,
        "stage": "direction_confirm",
        "stage_turn_count": 0,
    }
