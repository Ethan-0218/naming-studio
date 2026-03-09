"""결제 게이트 노드."""

from langchain_core.messages import SystemMessage, AIMessage
from agent.state import NamingState


def payment_gate_node(state: NamingState) -> dict:
    """결제가 완료되지 않은 경우 결제 안내를 반환합니다."""
    return {
        "messages": [AIMessage(content="이름 후보를 더 탐색하시려면 결제가 필요합니다. 결제 완료 후 계속 진행해 드리겠습니다.")],
        "stage": "payment_gate",
        "_payment_required": True,
    }
