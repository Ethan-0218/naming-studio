"""FastAPI 라우트: POST /api/chat, POST /api/chat/stream."""

import asyncio
import contextvars
import json
import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

from agent import name_store
from agent import progress as _progress

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
    debug: dict | None = None


@router.get("/surname-search")
def surname_search(q: str = "", limit: int = 20):
    """성씨 검색: is_family_hanja=True인 한자를 eum으로 검색합니다."""
    from db.hanja_repository import HanjaRepository
    repo = HanjaRepository()
    results = repo.search_by_eum(q.strip(), limit=limit * 3) if q.strip() else []
    family = [h for h in results if h.is_family_hanja][:limit]
    return [
        {"hanja": h.hanja, "eum": h.eum, "mean": h.mean, "stroke": h.original_stroke_count}
        for h in family
    ]


@router.get("/hanja-search")
def hanja_search(q: str = "", limit: int = 20):
    """이름용 한자 검색: is_family_hanja=False인 한자를 eum으로 검색합니다."""
    from db.hanja_repository import HanjaRepository
    repo = HanjaRepository()
    results = repo.search_by_eum(q.strip(), limit=limit * 3) if q.strip() else []
    name_hanja = [h for h in results if not h.is_family_hanja][:limit]
    return [
        {"hanja": h.hanja, "eum": h.eum, "mean": h.mean, "stroke": h.original_stroke_count}
        for h in name_hanja
    ]


@router.post("/chat", response_model=NamingResponse)
async def chat(request: NamingRequest):
    """사용자 메시지를 받아 에이전트를 호출하고 응답을 반환합니다."""
    session_id = request.session_id or str(uuid.uuid4())

    try:
        graph = _get_agent_graph()
        config = {"configurable": {"thread_id": session_id}}

        # submit_info: 폼 데이터 직접 처리 (LLM 우회)
        if request.action == "submit_info":
            return _handle_submit_info(session_id, request.message, graph, config)

        # update_dolrimja: 돌림자 업데이트 후 AI 응답
        if request.action == "update_dolrimja":
            return _handle_update_dolrimja(session_id, request.message, graph, config)

        # like/dislike/unlike/undislike: name_store 직접 업데이트
        if request.action and ":" in request.action:
            result = _handle_name_action(session_id, request.action)
            if result is not None:
                return result

        # payment_complete: state 직접 업데이트 후 graph 재실행
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
                "candidate_call_count": 0,
            }
            result = graph.invoke(initial_state, config=config)
        else:
            result = graph.invoke(
                {"messages": [HumanMessage(content=request.message)]},
                config=config,
            )

        return _build_naming_response(session_id, result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _build_naming_response(session_id: str, result: dict) -> NamingResponse:
    """graph.invoke() 결과로 NamingResponse 생성."""
    stage = result.get("stage", "welcome")
    payment_required = (
        stage == "payment_gate" or result.get("_payment_required", False)
    )
    if stage == "candidate_exploration" and result.get("payment_status", "pending") != "completed":
        payment_required = True

    content_blocks = result.get("_content_blocks", [])
    raw_llm_output = None
    messages = result.get("messages", [])
    if messages:
        last = messages[-1]
        raw_llm_output = last.content if hasattr(last, "content") else str(last)
    if not content_blocks and raw_llm_output:
        content_blocks = [{"type": "TEXT", "data": {"text": raw_llm_output}}]

    debug_state = {
        k: v for k, v in result.items()
        if k not in ("messages",) and not k.startswith("_")
    }

    return NamingResponse(
        session_id=session_id,
        stage=stage,
        content=content_blocks,
        liked_names=name_store.get_liked(session_id),
        disliked_names=name_store.get_disliked(session_id),
        payment_required=payment_required,
        naming_direction=result.get("naming_direction"),
        requirement_summary=result.get("requirement_summary", ""),
        debug={
            "raw_llm_output": raw_llm_output,
            "state": debug_state,
        },
    )


@router.post("/chat/stream")
async def chat_stream(request: NamingRequest):
    """LLM 호출이 있는 액션을 SSE로 스트리밍합니다."""
    session_id = request.session_id or str(uuid.uuid4())

    async def event_generator():
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue[str] = asyncio.Queue()

        def _on_progress(message: str) -> None:
            loop.call_soon_threadsafe(queue.put_nowait, message)

        token = _progress.set_callback(_on_progress)

        def _run() -> NamingResponse:
            graph = _get_agent_graph()
            config = {"configurable": {"thread_id": session_id}}

            if request.action == "submit_info":
                return _handle_submit_info(session_id, request.message, graph, config)
            if request.action == "update_dolrimja":
                return _handle_update_dolrimja(session_id, request.message, graph, config)
            if request.action == "payment_complete":
                graph.update_state(
                    config,
                    {"payment_status": "completed", "stage": "candidate_exploration"},
                )

            try:
                current_state = graph.get_state(config)
                state_values = current_state.values if current_state else {}
            except Exception:
                state_values = {}

            is_new_session = not state_values or not state_values.get("stage")

            if is_new_session:
                invoke_arg = {
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
                    "candidate_call_count": 0,
                }
            else:
                invoke_arg = {"messages": [HumanMessage(content=request.message)]}

            result = graph.invoke(invoke_arg, config=config)
            return _build_naming_response(session_id, result)

        try:
            ctx = contextvars.copy_context()
            future = loop.run_in_executor(None, ctx.run, _run)
            get_task = asyncio.ensure_future(queue.get())

            while not future.done():
                done, _ = await asyncio.wait(
                    [future, get_task],
                    return_when=asyncio.FIRST_COMPLETED,
                    timeout=60.0,
                )
                if get_task in done:
                    msg = get_task.result()
                    yield f"data: {json.dumps({'type': 'progress', 'message': msg}, ensure_ascii=False)}\n\n"
                    get_task = asyncio.ensure_future(queue.get())

            # future 완료 후 남은 큐 비우기
            if not get_task.done():
                get_task.cancel()
            while not queue.empty():
                msg = queue.get_nowait()
                yield f"data: {json.dumps({'type': 'progress', 'message': msg}, ensure_ascii=False)}\n\n"

            naming_response = await future
            result_payload = {"type": "result", **naming_response.model_dump()}
            yield f"data: {json.dumps(result_payload, ensure_ascii=False)}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"
        finally:
            _progress.reset_callback(token)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _handle_submit_info(session_id: str, message: str, graph, config: dict) -> NamingResponse:
    """폼 제출: user_info JSON 파싱 → 사주 계산 → preference_interview 단계로 전환."""
    try:
        user_info: dict = json.loads(message)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"user_info JSON 파싱 실패: {e}")

    # 사주 계산
    사주_summary = None
    try:
        from agent.tools.calculate_saju_tool import calculate_saju
        사주_summary = calculate_saju(
            birth_date=user_info["birth_date"],
            birth_time=user_info.get("birth_time"),
            gender=user_info["gender"],
            is_lunar=user_info.get("is_lunar", False),
        )
    except Exception as e:
        # 사주 계산 실패해도 진행 (사주_summary=None)
        pass

    # 폼 요약 텍스트 (사용자 메시지 대신 표시용)
    birth_time_display = user_info.get("birth_time") or "모름"
    lunar_label = "(음력)" if user_info.get("is_lunar") else "(양력)"
    summary_text = (
        f"성씨: {user_info.get('surname', '')} | "
        f"성별: {user_info.get('gender', '')} | "
        f"생년월일: {user_info.get('birth_date', '')} {lunar_label} | "
        f"출생시간: {birth_time_display}"
    )
    human_msg = HumanMessage(content=summary_text)

    initial_state = {
        "messages": [human_msg],
        "stage": "preference_interview",
        "stage_turn_count": 0,
        "session_id": session_id,
        "user_info": user_info,
        "missing_info_fields": [],
        "사주_summary": 사주_summary,
        "preference_profile": {},
        "requirement_summary": "",
        "naming_direction": None,
        "current_candidates": [],
        "payment_status": "pending",
        "candidate_call_count": 0,
    }
    result = graph.invoke(initial_state, config=config)

    stage = result.get("stage", "preference_interview")
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
    )


def _handle_update_dolrimja(session_id: str, message: str, graph, config: dict) -> NamingResponse:
    """돌림자 업데이트: user_info에 돌림자 정보를 반영하고 AI가 확인 메시지를 반환합니다."""
    try:
        dolrimja_info: dict = json.loads(message)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"돌림자 JSON 파싱 실패: {e}")

    # 현재 state의 user_info를 가져와 돌림자만 업데이트
    try:
        current_state = graph.get_state(config)
        user_info = dict(current_state.values.get("user_info", {})) if current_state else {}
    except Exception:
        user_info = {}

    user_info["돌림자"] = dolrimja_info.get("hangul", "")
    user_info["돌림자_한자"] = dolrimja_info.get("hanja", "")
    graph.update_state(config, {"user_info": user_info})

    # AI가 변경 사실을 자연스럽게 확인해주도록 invoke
    hangul = dolrimja_info.get("hangul", "")
    hanja = dolrimja_info.get("hanja", "")
    ack_text = f"돌림자를 {hanja}({hangul})자로 변경했어요."
    result = graph.invoke(
        {"messages": [{"role": "user", "content": ack_text}]},
        config=config,
    )

    stage = result.get("stage", "preference_interview")
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
    )


def _handle_name_action(session_id: str, action: str) -> NamingResponse | None:
    """like/dislike/unlike/undislike action을 처리합니다."""
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
