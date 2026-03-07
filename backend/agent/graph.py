"""LangGraph 에이전트 그래프 정의."""

from typing import Annotated, Any, TypedDict

from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from core.config import OPENAI_API_KEY, OPENAI_MODEL


class AgentState(TypedDict):
    """에이전트 상태: 메시지 히스토리 등."""
    messages: Annotated[list, add_messages]


def create_agent_graph():
    """LangGraph StateGraph를 정의하고 컴파일해 반환합니다."""
    from langchain_openai import ChatOpenAI
    from agent.nodes import route_after_llm

    llm = ChatOpenAI(
        model=OPENAI_MODEL,
        api_key=OPENAI_API_KEY or None,
        temperature=0.7,
    )

    def run_llm(state: AgentState) -> dict[str, Any]:
        response = llm.invoke(state["messages"])
        return {"messages": [response]}

    graph = StateGraph(AgentState)

    graph.add_node("llm", run_llm)
    graph.add_conditional_edges("llm", route_after_llm, {"end": END})
    graph.add_edge("__start__", "llm")

    return graph.compile()
