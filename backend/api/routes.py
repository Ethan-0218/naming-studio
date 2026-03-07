"""FastAPI 라우트: /chat, /agent 등."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

router = APIRouter()

_agent_graph = None


def _get_agent_graph():
    """에이전트 그래프를 지연 생성합니다 (OPENAI_API_KEY 없이 서버 기동 가능)."""
    global _agent_graph
    if _agent_graph is None:
        from agent import create_agent_graph
        _agent_graph = create_agent_graph()
    return _agent_graph


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """사용자 메시지를 받아 에이전트를 호출하고 응답을 반환합니다."""
    try:
        graph = _get_agent_graph()
        result = graph.invoke(
            {"messages": [HumanMessage(content=request.message)]}
        )
        messages = result.get("messages", [])
        if not messages:
            raise HTTPException(status_code=500, detail="No response from agent")
        last = messages[-1]
        content = last.content if hasattr(last, "content") else str(last)
        return ChatResponse(response=content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
