"""FastAPI 라우트: POST /api/chat, POST /api/chat/stream."""

import asyncio
import contextvars
import json
import uuid
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

from agent import name_store
from agent import progress as _progress
from core.config import DATABASE_URL

router = APIRouter()


def _get_agent_graph(request: Request):
    """app.state에 등록된 그래프 인스턴스를 반환합니다.

    lifespan에서 초기화된 그래프(Postgres 또는 MemorySaver)를 사용합니다.
    """
    return request.app.state.agent_graph


def _get_session_repo(request: Request):
    """Postgres가 활성화된 경우 NamingSessionRepository를 반환합니다."""
    if not DATABASE_URL:
        return None
    from db.postgres_pool import _pool_instance
    from db.naming_session_repository import NamingSessionRepository
    if _pool_instance is None:
        return None
    return NamingSessionRepository(_pool_instance)


def _sync_session(request: Request, session_id: str, result: dict) -> None:
    """graph.invoke() 결과의 주요 필드를 naming_sessions 테이블에 동기화합니다."""
    repo = _get_session_repo(request)
    if repo is None:
        return
    try:
        repo.upsert_session(
            session_id=session_id,
            stage=result.get("stage"),
            payment_status=result.get("payment_status"),
            naming_direction=result.get("naming_direction"),
            user_info=result.get("user_info") or None,
        )
    except Exception:
        import logging
        logging.getLogger(__name__).warning("naming_sessions upsert 실패", exc_info=True)


def _save_messages(
    session_id: str,
    user_text: str | None,
    ai_content_blocks: list[dict],
    stage: str | None,
) -> None:
    """user 메시지와 AI 응답 content_blocks를 session_messages 테이블에 저장합니다.

    DATABASE_URL이 없거나 pool이 준비되지 않은 경우 조용히 건너뜁니다.
    """
    if not DATABASE_URL:
        return
    try:
        from db.postgres_pool import _pool_instance
        from db.session_message_repository import SessionMessageRepository
        if _pool_instance is None:
            return
        repo = SessionMessageRepository(_pool_instance)
        if user_text:
            repo.add_message(
                session_id, "user",
                [{"type": "TEXT", "data": {"text": user_text}}],
                stage,
            )
        if ai_content_blocks:
            repo.add_message(session_id, "assistant", ai_content_blocks, stage)
    except Exception:
        import logging
        logging.getLogger(__name__).warning("session_messages 저장 실패", exc_info=True)


class NamingRequest(BaseModel):
    session_id: str | None = None
    message: str
    action: str | None = None
    reason_keys: list[str] | None = None           # 이유 선택지 키 목록 (예: ['pronunciation', 'vibe'])
    reason_for_name: str | None = None             # 이유가 적용되는 이름
    reason_preference_type: str | None = None      # 'liked' | 'disliked'


class NamingResponse(BaseModel):
    session_id: str
    stage: str
    content: list[dict]
    liked_names: list[str] = []
    disliked_names: list[str] = []
    actions: list[str] = []
    payment_required: bool = False
    naming_direction: str | None = None
    debug: dict | None = None



@router.get("/session/{session_id}")
async def get_session_state(session_id: str, req: Request):
    """session_id로 세션 현재 상태를 조회합니다. LLM 호출 없음."""
    graph = _get_agent_graph(req)
    config = {"configurable": {"thread_id": session_id}}

    try:
        current_state = graph.get_state(config)
        state_values = current_state.values if current_state else {}
    except Exception:
        state_values = {}

    messages: list[dict] = []
    if DATABASE_URL:
        try:
            from db.postgres_pool import _pool_instance
            from db.session_message_repository import SessionMessageRepository
            if _pool_instance is not None:
                messages = SessionMessageRepository(_pool_instance).get_messages(session_id)
        except Exception:
            import logging
            logging.getLogger(__name__).warning("session_messages 조회 실패", exc_info=True)

    stage_graph = state_values.get("stage") if state_values else None
    found = bool(stage_graph) or bool(messages)
    stage = stage_graph or (messages[-1].get("stage") if messages else None)
    payment_status = (
        state_values.get("payment_status", "pending") if state_values else "pending"
    )
    naming_direction = state_values.get("naming_direction") if state_values else None
    user_info = state_values.get("user_info") if state_values else None

    myeongju_id: str | None = None
    repo = _get_session_repo(req)
    if repo is not None:
        myeongju_id = repo.get_myeongju_id(session_id)

    return {
        "session_id": session_id,
        "found": found,
        "myeongju_id": myeongju_id,
        "stage": stage,
        "payment_required": (
            stage == "payment_gate"
            or (stage == "candidate_exploration" and payment_status != "completed")
        ),
        "naming_direction": naming_direction,
        "user_info": user_info,
        "liked_names": name_store.get_liked(session_id),
        "disliked_names": name_store.get_disliked(session_id),
        "messages": messages,
    }



class FindOrCreateRequest(BaseModel):
    myeongju_id: str


@router.post("/session/find-or-create")
async def find_or_create_session(body: FindOrCreateRequest, req: Request):
    """myeongju_id로 기존 세션을 찾거나 새 세션을 생성합니다.

    명주당 세션은 하나만 생성됩니다. 이미 존재하면 기존 session_id를 반환합니다.
    """
    repo = _get_session_repo(req)
    if repo is None:
        new_id = str(uuid.uuid4())
        return {"session_id": new_id, "is_new": True}

    existing = repo.find_by_myeongju_id(body.myeongju_id)
    if existing:
        return {"session_id": existing, "is_new": False}

    new_id = str(uuid.uuid4())
    repo.upsert_session(session_id=new_id, myeongju_id=body.myeongju_id)
    return {"session_id": new_id, "is_new": True}


@router.post("/admin/cleanup-checkpoints")
async def cleanup_checkpoints(older_than_days: int = 30):
    """오래된 LangGraph 체크포인트를 정리합니다 (관리자용).

    older_than_days: 이 일수 이상 미활동 세션의 체크포인트를 삭제합니다 (기본 30일).
    """
    if not DATABASE_URL:
        return {"deleted": 0, "message": "Postgres 미사용 모드"}
    from db.postgres_pool import run_checkpoint_cleanup
    deleted = run_checkpoint_cleanup(older_than_days=older_than_days)
    return {"deleted": deleted, "older_than_days": older_than_days}


@router.get("/surname-search")
def surname_search(q: str = "", limit: int = 20):
    """성씨 검색: is_family_hanja=True인 한자를 eum으로 검색합니다."""
    from db.hanja_repository import HanjaRepository
    repo = HanjaRepository()
    results = repo.search_by_eum(q.strip(), limit=limit * 3) if q.strip() else []
    family = [h for h in results if h.is_family_hanja][:limit]
    return [
        {
            "hanja": h.hanja, "eum": h.eum, "mean": h.mean, "stroke": h.original_stroke_count,
            "char_ohaeng": h.character_five_elements,
            "stroke_ohaeng": h.stroke_five_elements,
            "sound_eumyang": h.sound_based_yin_yang,
            "stroke_eumyang": h.stroke_based_yin_yang,
            "baleum_ohaeng": h.pronunciation_five_elements,
        }
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
        {
            "hanja": h.hanja, "eum": h.eum, "mean": h.mean, "stroke": h.original_stroke_count,
            "char_ohaeng": h.character_five_elements,
            "stroke_ohaeng": h.stroke_five_elements,
            "sound_eumyang": h.sound_based_yin_yang,
            "stroke_eumyang": h.stroke_based_yin_yang,
            "baleum_ohaeng": h.pronunciation_five_elements,
        }
        for h in name_hanja
    ]


@router.post("/chat", response_model=NamingResponse)
async def chat(request: NamingRequest, req: Request):
    """사용자 메시지를 받아 에이전트를 호출하고 응답을 반환합니다."""
    session_id = request.session_id or str(uuid.uuid4())

    try:
        graph = _get_agent_graph(req)
        config = {"configurable": {"thread_id": session_id}}

        # submit_info: 폼 데이터 직접 처리 (LLM 우회)
        if request.action == "submit_info":
            response = _handle_submit_info(session_id, request.message, graph, config)
            try:
                ui = json.loads(request.message)
            except Exception:
                ui = {}
            _sync_session(req, session_id, {"stage": response.stage, "user_info": ui})
            return response

        # update_dolrimja: 돌림자 업데이트 후 AI 응답
        if request.action == "update_dolrimja":
            return _handle_update_dolrimja(session_id, request.message, graph, config)

        # reason 제출: name_store reasons 갱신 + reason_taste_profile 업데이트
        if request.reason_keys and request.reason_for_name and request.reason_preference_type:
            return _handle_reason_submission(session_id, request, req)

        # like/dislike/unlike/undislike: name_store 직접 업데이트
        if request.action and ":" in request.action:
            result = _handle_name_action(session_id, request.action, req)
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
                "naming_direction": None,
                "current_candidates": [],
                "payment_status": "pending",
                "sc_cursor": 0,
                "shown_name_scores": {},
                "inferred_preferences": {},
                "reason_taste_profile": {},
            }
            result = graph.invoke(initial_state, config=config)
        else:
            result = graph.invoke(
                {"messages": [HumanMessage(content=request.message)]},
                config=config,
            )

        _sync_session(req, session_id, result)
        _save_messages(
            session_id,
            request.message,
            result.get("_content_blocks", []),
            result.get("stage"),
        )
        return _build_naming_response(session_id, result, req)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _build_naming_response(
    session_id: str,
    result: dict,
    request: Request | None = None,
) -> NamingResponse:
    """graph.invoke() 결과로 NamingResponse 생성."""
    stage = result.get("stage", "welcome")
    payment_status = result.get("payment_status", "pending")

    payment_required = (
        stage == "payment_gate" or result.get("_payment_required", False)
    )
    if stage == "candidate_exploration" and payment_status != "completed":
        payment_required = True

    # 그래프 상태에 payment_status가 없더라도 DB 구매 기록이 있으면 해제
    if payment_required and request is not None:
        try:
            from core.config import DATABASE_URL
            if DATABASE_URL:
                from db.postgres_pool import _pool_instance
                if _pool_instance is not None:
                    from db.purchase_repository import PurchaseRepository
                    ai_status = PurchaseRepository(_pool_instance).get_session_ai_status(session_id)
                    if ai_status["unlocked"]:
                        payment_required = False
        except Exception:
            import logging as _log
            _log.getLogger(__name__).warning("구매 상태 DB 조회 실패", exc_info=True)

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
        debug={
            "raw_llm_output": raw_llm_output,
            "state": debug_state,
        },
    )


@router.post("/chat/stream")
async def chat_stream(request: NamingRequest, req: Request):
    """LLM 호출이 있는 액션을 SSE로 스트리밍합니다."""

    async def event_generator():
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue[str] = asyncio.Queue()

        def _on_progress(message: str) -> None:
            loop.call_soon_threadsafe(queue.put_nowait, message)

        token = _progress.set_callback(_on_progress)

        def _run() -> NamingResponse:
            session_id = request.session_id or str(uuid.uuid4())
            graph = _get_agent_graph(req)
            config = {"configurable": {"thread_id": session_id}}

            if request.action == "submit_info":
                response = _handle_submit_info(session_id, request.message, graph, config)
                try:
                    ui = json.loads(request.message)
                except Exception:
                    ui = {}
                _sync_session(req, session_id, {"stage": response.stage, "user_info": ui})
                return response
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
                    "naming_direction": None,
                    "current_candidates": [],
                    "payment_status": "pending",
                    "sc_cursor": 0,
                    "shown_name_scores": {},
                    "inferred_preferences": {},
                }
            else:
                invoke_arg = {"messages": [HumanMessage(content=request.message)]}

            result = graph.invoke(invoke_arg, config=config)
            _sync_session(req, session_id, result)
            _save_messages(
                session_id,
                request.message,
                result.get("_content_blocks", []),
                result.get("stage"),
            )
            return _build_naming_response(session_id, result, req)

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
    except Exception:
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
        "naming_direction": None,
        "current_candidates": [],
        "payment_status": "pending",
        "sc_cursor": 0,
        "shown_name_scores": {},
        "inferred_preferences": {},
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

    _save_messages(session_id, None, content_blocks, stage)
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

    _save_messages(session_id, ack_text, content_blocks, stage)
    return NamingResponse(
        session_id=session_id,
        stage=stage,
        content=content_blocks,
        liked_names=name_store.get_liked(session_id),
        disliked_names=name_store.get_disliked(session_id),
    )


def _handle_name_action(session_id: str, action: str, req: "Request | None" = None) -> "NamingResponse | None":
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

    # like/dislike 변경 후 취향 자동 추론 및 state 업데이트
    if op in ("like", "dislike", "unlike", "undislike") and req is not None:
        _update_inferred_preferences(session_id, req)

    return NamingResponse(
        session_id=session_id,
        stage="candidate_exploration",
        content=[{"type": "TEXT", "data": {"text": f"'{name}' 정보가 업데이트되었습니다."}}],
        liked_names=name_store.get_liked(session_id),
        disliked_names=name_store.get_disliked(session_id),
    )


def _update_inferred_preferences(session_id: str, req: "Request") -> None:
    """like/dislike 현황을 바탕으로 inferred_preferences를 추론하고 graph state에 저장합니다."""
    try:
        from agent.preference_inferrer import infer_preferences
        graph = _get_agent_graph(req)
        config = {"configurable": {"thread_id": session_id}}
        current_state = graph.get_state(config)
        state_values = current_state.values if current_state else {}

        liked = name_store.get_liked(session_id)
        disliked = name_store.get_disliked(session_id)
        shown_name_scores: dict = state_values.get("shown_name_scores") or {}
        current_inferred: dict = state_values.get("inferred_preferences") or {}

        new_inferred = infer_preferences(liked, disliked, shown_name_scores, current_inferred)
        if new_inferred != current_inferred:
            graph.update_state(config, {"inferred_preferences": new_inferred})
    except Exception:
        import logging
        logging.getLogger(__name__).warning("inferred_preferences 갱신 실패", exc_info=True)


def _handle_reason_submission(
    session_id: str,
    request: "NamingRequest",
    req: "Request",
) -> "NamingResponse":
    """이유 선택지를 DB에 저장하고 reason_taste_profile을 갱신합니다."""
    if DATABASE_URL:
        try:
            from db.postgres_pool import _pool_instance
            from db.session_name_preference_repository import SessionNamePreferenceRepository
            if _pool_instance is not None:
                repo = SessionNamePreferenceRepository(_pool_instance)
                repo.update_reasons(
                    session_id,
                    request.reason_preference_type,  # type: ignore[arg-type]
                    request.reason_for_name,          # type: ignore[arg-type]
                    request.reason_keys or [],
                )
        except Exception:
            import logging
            logging.getLogger(__name__).warning("reason update 실패", exc_info=True)

    _update_reason_taste_profile(session_id, req)

    return NamingResponse(
        session_id=session_id,
        stage="candidate_exploration",
        content=[],
        liked_names=name_store.get_liked(session_id),
        disliked_names=name_store.get_disliked(session_id),
    )


def _update_reason_taste_profile(session_id: str, req: "Request") -> None:
    """이유 집계에서 reason_taste_profile을 구축해 graph state에 저장합니다."""
    if not DATABASE_URL:
        return
    try:
        from db.postgres_pool import _pool_instance
        from db.session_name_preference_repository import SessionNamePreferenceRepository
        from agent.reason_taste_profiler import build_reason_taste_profile
        if _pool_instance is None:
            return
        records = SessionNamePreferenceRepository(_pool_instance).get_reasons_for_session(session_id)
        new_profile = build_reason_taste_profile(records)
        graph = _get_agent_graph(req)
        config = {"configurable": {"thread_id": session_id}}
        current_state = graph.get_state(config)
        current_profile = (current_state.values or {}).get("reason_taste_profile") or {}
        if new_profile != current_profile:
            graph.update_state(config, {"reason_taste_profile": new_profile})
    except Exception:
        import logging
        logging.getLogger(__name__).warning("reason_taste_profile 갱신 실패", exc_info=True)
