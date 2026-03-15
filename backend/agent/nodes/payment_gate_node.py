"""결제 게이트 노드."""

from langchain_core.messages import SystemMessage, AIMessage
from agent.state import NamingState


def payment_gate_node(state: NamingState) -> dict:
    """결제가 완료되지 않은 경우 결제 안내를 반환합니다."""
    msg = "이름을 추천받으시려면 결제가 필요해요. 결제를 완료해 주시면 바로 시작해 드릴게요."
    return {
        "messages": [AIMessage(content=msg)],
        "stage": "payment_gate",
        "_payment_required": True,
        "_content_blocks": [{"type": "TEXT", "data": {"text": msg}}],
    }
