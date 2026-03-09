"""라우터 노드: stage에 따라 다음 노드를 결정합니다."""

from agent.state import NamingState


def router_node(state: NamingState) -> dict:
    """state의 stage를 그대로 유지 (실제 라우팅은 graph.py의 conditional edges에서)."""
    return {}


def route_by_stage(state: NamingState) -> str:
    """현재 stage에 해당하는 노드 이름을 반환합니다."""
    stage = state.get("stage", "welcome")
    return stage
