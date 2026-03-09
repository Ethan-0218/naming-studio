"""FastAPI 라우트: POST /api/chat."""

import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

from agent import name_store

router = APIRouter()

_agent_graph = None


def _get_agent_graph():
    global _agent_graph
    if _agent_graph is None:
        from agent.graph import create_agent_graph
        _agent_graph = create_agent_graph()
    return _agent_graph


class NamingRequest(BaseModel):
    session_id: str | None = None
    message: str
    action: str | None = None


class NamingResponse(BaseModel):
    session_id: str
    stage: str
    content: list[dict]
    liked_names: list[str] = []
    disliked_names: list[str] = []
    actions: list[str] = []
    payment_required: bool = False
    naming_direction: str | None = None
    requirement_summary: str = ""


@router.post("/chat", response_model=NamingResponse)
async def chat(request: NamingRequest):
    """사용자 메시지를 받아 에이전트를 호출하고 응답을 반환합니다."""
    session_id = request.session_id or str(uuid.uuid4())

    try:
        # action 처리 (LangGraph 우회)
        if request.action:
            result = _handle_action(session_id, request.action)
            if result is not None:
                return result

        graph = _get_agent_graph()
        config = {"configurable": {"thread_id": session_id}}

        # payment_complete action
        if request.action == "payment_complete":
            graph.update_state(
                config,
                {"payment_status": "completed", "stage": "candidate_exploration"},
            )

        # 현재 state 조회 (세션 첫 호출 판단)
        try:
            current_state = graph.get_state(config)
            state_values = current_state.values if current_state else {}
        except Exception:
            state_values = {}

        is_new_session = not state_values or not state_values.get("stage")

        if is_new_session:
            initial_state = {
                "messages": [HumanMessage(content=request.message)],
                "stage": "welcome",
                "stage_turn_count": 0,
                "session_id": session_id,
                "user_info": {},
                "missing_info_fields": ["surname", "gender", "birth_date", "birth_time"],
                "사주_summary": None,
                "preference_profile": {},
                "requirement_summary": "",
                "naming_direction": None,
                "current_candidates": [],
                "payment_status": "pending",
            }
            result = graph.invoke(initial_state, config=config)
        else:
            result = graph.invoke(
                {"messages": [HumanMessage(content=request.message)]},
                config=config,
            )

        stage = result.get("stage", "welcome")
        payment_required = (
            stage == "payment_gate" or result.get("_payment_required", False)
        )

        # 결제 게이트: 결제 안 된 상태에서 initial_candidates 이후면 payment_gate
        if stage == "candidate_exploration" and result.get("payment_status", "pending") != "completed":
            payment_required = True

        content_blocks = result.get("_content_blocks", [])
        if not content_blocks:
            messages = result.get("messages", [])
            if messages:
                last = messages[-1]
                text = last.content if hasattr(last, "content") else str(last)
                content_blocks = [{"type": "TEXT", "data": {"text": text}}]

        return NamingResponse(
            session_id=session_id,
            stage=stage,
            content=content_blocks,
            liked_names=name_store.get_liked(session_id),
            disliked_names=name_store.get_disliked(session_id),
            payment_required=payment_required,
            naming_direction=result.get("naming_direction"),
            requirement_summary=result.get("requirement_summary", ""),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _handle_action(session_id: str, action: str):
    """like/dislike/unlike/undislike action을 처리합니다. NamingResponse 또는 None 반환."""
    if ":" not in action:
        return None

    op, name = action.split(":", 1)
    name = name.strip()

    if op == "like":
        name_store.add_liked(session_id, name)
    elif op == "dislike":
        name_store.add_disliked(session_id, name)
    elif op == "unlike":
        name_store.remove_liked(session_id, name)
    elif op == "undislike":
        name_store.remove_disliked(session_id, name)
    else:
        return None

    return NamingResponse(
        session_id=session_id,
        stage="candidate_exploration",
        content=[{"type": "TEXT", "data": {"text": f"'{name}' 정보가 업데이트되었습니다."}}],
        liked_names=name_store.get_liked(session_id),
        disliked_names=name_store.get_disliked(session_id),
    )
