"""LangGraph 작명 에이전트 그래프."""

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
from agent.nodes.preference_update_node import preference_update_node
from agent.nodes.candidate_exploration_node import candidate_exploration_node


def _after_preference_interview(state: NamingState) -> str:
    """취향 인터뷰 완료 시 direction_confirm으로 자동 체인, 아니면 END."""
    return "direction_confirm" if state.get("stage") == "direction_confirm" else END


def _after_direction_confirm(state: NamingState) -> str:
    """방향 확인 완료 시 initial_candidates로 자동 체인, 아니면 END."""
    return "initial_candidates" if state.get("stage") == "initial_candidates" else END


def create_agent_graph():
    """NamingState 기반 StateGraph를 컴파일해 반환합니다."""
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
    graph.add_node("preference_update", preference_update_node)
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
            "candidate_exploration": "preference_update",  # preference_update 먼저 체인
        },
    )

    # 단순 END 노드
    for node in ["welcome", "info_collection", "direction_briefing", "payment_gate", "candidate_exploration"]:
        graph.add_edge(node, END)

    # preference_update → candidate_exploration 항상 체인
    graph.add_edge("preference_update", "candidate_exploration")

    # preference_interview → 완료 시 direction_confirm 자동 체인
    graph.add_conditional_edges(
        "preference_interview",
        _after_preference_interview,
        {"direction_confirm": "direction_confirm", END: END},
    )

    # direction_confirm → 확인 완료 시 initial_candidates 자동 체인
    graph.add_conditional_edges(
        "direction_confirm",
        _after_direction_confirm,
        {"initial_candidates": "initial_candidates", END: END},
    )

    # initial_candidates → END (payment_gate는 API routes에서 처리)
    graph.add_edge("initial_candidates", END)

    return graph.compile(checkpointer=memory)
