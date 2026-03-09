"""작명 방향 확인 노드: 방향 제안 + 확인을 한 번에 처리."""

from langchain_core.messages import SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.schemas import DirectionConfirmOutput
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def direction_confirm_node(state: NamingState) -> dict:
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    structured_llm = llm.with_structured_output(DirectionConfirmOutput, method="function_calling")
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    result = structured_llm.invoke(messages)

    next_stage = "initial_candidates" if result.confirmed else "direction_confirm"

    return {
        "messages": [AIMessage(content=result.message)],
        "naming_direction": result.naming_direction,
        "stage": next_stage,
        "stage_turn_count": 0,
    }
