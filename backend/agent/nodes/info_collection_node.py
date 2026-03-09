"""정보 수집 노드: 성씨/성별/생년월일/출생시간을 수집합니다."""

import json
import re
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from core.config import OPENAI_API_KEY, OPENAI_MODEL

_REQUIRED_FIELDS = ["surname", "gender", "birth_date", "birth_time"]


def _extract_json(text: str) -> dict:
    match = re.search(r"<json>(.*?)</json>", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except (json.JSONDecodeError, ValueError):
            return {}
    return {}


def info_collection_node(state: NamingState) -> dict:
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    response = llm.invoke(messages)

    response_text = response.content if hasattr(response, "content") else str(response)
    extracted = _extract_json(response_text)

    user_info = dict(state.get("user_info", {}))
    if "user_info_update" in extracted:
        user_info.update(extracted["user_info_update"])

    # 누락 필드 업데이트
    missing = [f for f in _REQUIRED_FIELDS if not user_info.get(f)]
    # birth_time 없어도 "모름" 처리하면 넘어감
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

    # 모든 필수 정보 수집 완료 → preference_interview로 전환
    next_stage = "preference_interview" if (not missing and 사주_summary is not None) else "info_collection"

    return {
        "messages": [response],
        "user_info": user_info,
        "missing_info_fields": missing,
        "사주_summary": 사주_summary,
        "stage": next_stage,
        "stage_turn_count": state.get("stage_turn_count", 0) + 1,
    }
