"""환영 노드: 처음 방문한 사용자를 환영합니다."""

import uuid
from langchain_core.messages import SystemMessage, AIMessage
from langchain_openai import ChatOpenAI
from agent.state import NamingState
from agent.prompts import build_system_prompt
from core.config import OPENAI_API_KEY, OPENAI_MODEL


def welcome_node(state: NamingState) -> dict:
    llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY or None, temperature=0.7)
    system_prompt = build_system_prompt(state)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    response = llm.invoke(messages)

    return {
        "messages": [response],
        "stage": "info_collection",
        "stage_turn_count": 0,
        "missing_info_fields": ["surname", "gender", "birth_date", "birth_time"],
        "user_info": {},
        "사주_summary": None,
        "preference_profile": {},
        "requirement_summary": "",
        "naming_direction": None,
        "current_candidates": [],
        "payment_status": "pending",
    }
