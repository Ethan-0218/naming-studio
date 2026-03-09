"""취향 인터뷰 노드: 부모님의 이름 취향을 수집합니다."""

from langchain_core.messages import SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from agent.schemas import PreferenceInterviewOutput
from core.config import OPENAI_API_KEY, OPENAI_MODEL

# 반드시 파악해야 할 필드 목록
_REQUIRED_PREF_FIELDS = ["name_feel", "받침_preference", "values"]


def _missing_fields(profile: dict) -> list[str]:
    return [f for f in _REQUIRED_PREF_FIELDS if not profile.get(f)]


def _followup_message(missing: list[str]) -> str:
    questions = {
        "name_feel": "이름의 느낌은 어떤 것을 원하세요? 부드러운 느낌, 강한 느낌, 중성적인 느낌 중에서요.",
        "받침_preference": "받침이 있는 이름과 없는 이름 중 어느 쪽이 좋으세요?",
        "values": "이름에 담고 싶은 의미나 가치가 있으신가요?",
    }
    return questions.get(missing[0], "조금 더 여쭤볼게요. 피하고 싶은 이름의 특징이 있으신가요?")


def preference_interview_node(state: NamingState) -> dict:
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    structured_llm = llm.with_structured_output(PreferenceInterviewOutput, method="function_calling")
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    result = structured_llm.invoke(messages)

    turn_count = state.get("stage_turn_count", 0) + 1
    preference_profile = dict(state.get("preference_profile", {}))
    new_prefs = {k: v for k, v in result.preference_profile.model_dump().items() if v is not None}
    preference_profile.update(new_prefs)

    missing = _missing_fields(preference_profile)

    if missing:
        # LLM 메시지를 사용하되, 누락 필드가 있으면 LLM이 이미 해당 질문을 했을 것
        # 만약 LLM 메시지가 이상하면 fallback
        message = result.message
        next_stage = "preference_interview"
    else:
        # 필수 항목 모두 파악 → Python이 자동 전환
        message = result.message
        next_stage = "direction_confirm"

    return {
        "messages": [AIMessage(content=message)],
        "preference_profile": preference_profile,
        "stage": next_stage,
        "stage_turn_count": turn_count,
    }
