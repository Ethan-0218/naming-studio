"""LangGraph 작명 에이전트 그래프."""

import uuid
from typing import Any

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from agent.state import NamingState
from agent.nodes.router_node import router_node, route_by_stage
from agent.nodes.welcome_node import welcome_node
from agent.nodes.info_collection_node import info_collection_node
from agent.nodes.preference_interview_node import preference_interview_node
from agent.nodes.direction_briefing_node import direction_briefing_node
from agent.nodes.direction_confirm_node import direction_confirm_node
from agent.nodes.initial_candidates_node import initial_candidates_node
from agent.nodes.payment_gate_node import payment_gate_node
from agent.nodes.candidate_exploration_node import candidate_exploration_node


def create_agent_graph():
    """NamingState 기반 9-node StateGraph를 컴파일해 반환합니다."""
    memory = MemorySaver()
    graph = StateGraph(NamingState)

    # 노드 등록
    graph.add_node("router", router_node)
    graph.add_node("welcome", welcome_node)
    graph.add_node("info_collection", info_collection_node)
    graph.add_node("preference_interview", preference_interview_node)
    graph.add_node("direction_briefing", direction_briefing_node)
    graph.add_node("direction_confirm", direction_confirm_node)
    graph.add_node("initial_candidates", initial_candidates_node)
    graph.add_node("payment_gate", payment_gate_node)
    graph.add_node("candidate_exploration", candidate_exploration_node)

    # 시작 → router
    graph.set_entry_point("router")

    # router → stage 노드
    graph.add_conditional_edges(
        "router",
        route_by_stage,
        {
            "welcome": "welcome",
            "info_collection": "info_collection",
            "preference_interview": "preference_interview",
            "direction_briefing": "direction_briefing",
            "direction_confirm": "direction_confirm",
            "initial_candidates": "initial_candidates",
            "payment_gate": "payment_gate",
            "candidate_exploration": "candidate_exploration",
        },
    )

    # 각 stage 노드 → END (다음 API 호출 시 router가 재진입)
    for node in [
        "welcome",
        "info_collection",
        "preference_interview",
        "direction_briefing",
        "direction_confirm",
        "initial_candidates",
        "payment_gate",
        "candidate_exploration",
    ]:
        graph.add_edge(node, END)

    return graph.compile(checkpointer=memory)
