"""LangGraph 에이전트 노드: 라우팅, 도구 실행 등."""

from typing import Any


def route_after_llm(state: dict[str, Any]) -> str:
    """LLM 응답 후 다음 노드를 결정합니다. (도구 호출 필요 시 확장)"""
    return "end"
