"""정보 수집 노드: 성씨/성별/생년월일/출생시간을 수집합니다."""

from langchain_core.messages import SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.schemas import InfoCollectionOutput
from core.config import OPENAI_API_KEY, OPENAI_MODEL

_REQUIRED_FIELDS = ["surname", "gender", "birth_date", "birth_time"]


def info_collection_node(state: NamingState) -> dict:
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    structured_llm = llm.with_structured_output(InfoCollectionOutput, method="function_calling")
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    result = structured_llm.invoke(messages)

    user_info = dict(state.get("user_info", {}))
    new_info = {k: v for k, v in result.user_info_update.model_dump().items() if v is not None}
    user_info.update(new_info)

    # 누락 필드 업데이트
    missing = [f for f in _REQUIRED_FIELDS if not user_info.get(f)]
    if user_info.get("birth_time") == "모름":
        user_info["birth_time"] = None
        missing = [f for f in missing if f != "birth_time"]

    # 사주 계산 시도
    사주_summary = state.get("사주_summary")
    if not missing and 사주_summary is None:
        try:
            from agent.tools.calculate_saju_tool import calculate_saju
            사주_summary = calculate_saju(
                birth_date=user_info["birth_date"],
                birth_time=user_info.get("birth_time"),
                gender=user_info["gender"],
                is_lunar=user_info.get("is_lunar", False),
            )
        except Exception:
            사주_summary = None

    next_stage = "preference_interview" if (not missing and 사주_summary is not None) else "info_collection"

    return {
        "messages": [AIMessage(content=result.message)],
        "user_info": user_info,
        "missing_info_fields": missing,
        "사주_summary": 사주_summary,
        "stage": next_stage,
        "stage_turn_count": state.get("stage_turn_count", 0) + 1,
    }
