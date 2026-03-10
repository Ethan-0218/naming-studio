"""작명 방향 확인 노드: 방향 제안 + 확인을 한 번에 처리."""

from langchain_core.messages import SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.schemas import DirectionConfirmOutput
from agent.progress import emit
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def direction_confirm_node(state: NamingState) -> dict:
    emit("작명 방향을 정리하고 있어요...")
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    structured_llm = llm.with_structured_output(DirectionConfirmOutput, method="function_calling")
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    result = structured_llm.invoke(messages)

    # 이미 방향을 제안한 적 있는 경우에만 사용자 확인을 인정.
    # naming_direction이 없으면 이번이 첫 제안 — 사용자가 아직 못 봤으므로 confirmed 무시.
    prior_direction = state.get("naming_direction")
    if not prior_direction:
        confirmed = False
    else:
        confirmed = result.confirmed

    next_stage = "initial_candidates" if confirmed else "direction_confirm"

    return {
        "messages": [AIMessage(content=result.message)],
        "naming_direction": result.naming_direction,
        "stage": next_stage,
        "stage_turn_count": 0,
    }
