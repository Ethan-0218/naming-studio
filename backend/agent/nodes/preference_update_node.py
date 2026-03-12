"""취향 변경 감지 노드: candidate_exploration 전에 실행해 naming_direction을 갱신합니다."""

from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.persona import PERSONA_DESCRIPTION, PERSONA_CONSTRAINTS
from agent.prompts.preference_update_prompt import build_stage_prompt
from agent.schemas import PreferenceUpdateOutput
from agent.progress import emit
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def preference_update_node(state: NamingState) -> dict:
    # turn 0: 결제 직후 리드 메시지 턴, 분석할 유저 입력 없음 → pass-through
    if state.get("stage_turn_count", 0) == 0:
        return {}

    emit("취향 변경을 확인하고 있어요...")
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0)
    structured_llm = llm.with_structured_output(PreferenceUpdateOutput, method="function_calling")
    system_prompt = f"{PERSONA_DESCRIPTION}\n\n{PERSONA_CONSTRAINTS}\n\n{build_stage_prompt(state)}"
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    result = structured_llm.invoke(messages)

    preference_profile = dict(state.get("preference_profile", {}))
    if result.max_받침_count is not None:
        preference_profile["max_받침_count"] = result.max_받침_count
    if result.rarity_preference is not None:
        preference_profile["rarity_preference"] = result.rarity_preference
    if result.name_feel_preference is not None:
        preference_profile["name_feel_preference"] = result.name_feel_preference

    # naming_direction이 실질적으로 변경된 경우 sc_cursor 리셋
    old_direction = (state.get("naming_direction") or "").strip()
    new_direction = (result.naming_direction or "").strip()
    direction_changed = old_direction != new_direction

    update: dict = {
        "naming_direction": result.naming_direction,
        "preference_profile": preference_profile,
    }
    if direction_changed and old_direction:
        update["sc_cursor"] = 0

    return update
