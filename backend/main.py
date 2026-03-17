"""FastAPI 앱 엔트리."""

import logging
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router as api_router
from api.myeongju_routes import router as myeongju_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 수명주기: 시작 시 DB 풀·체크포인터·그래프 초기화, 종료 시 풀 정리."""
    from core.config import DATABASE_URL
    from agent.graph import create_agent_graph

    if DATABASE_URL:
        import logging as _log
        _log.getLogger(__name__).info("DATABASE_URL 감지 — Postgres 체크포인터로 초기화합니다.")
        from db.postgres_pool import create_pool, setup_db
        from langgraph.checkpoint.postgres import PostgresSaver

        pool = create_pool(DATABASE_URL)
        setup_db(pool)
        app.state.agent_graph = create_agent_graph(PostgresSaver(pool))
        app.state.db_pool = pool

        # 시작 시 30일 이상 미활동 세션의 체크포인트 자동 정리
        from db.postgres_pool import run_checkpoint_cleanup
        run_checkpoint_cleanup(older_than_days=30)
    else:
        import logging as _log
        _log.getLogger(__name__).warning("DATABASE_URL 미설정 — MemorySaver(개발용)로 초기화합니다.")
        app.state.agent_graph = create_agent_graph()
        app.state.db_pool = None

    yield

    if app.state.db_pool is not None:
        app.state.db_pool.close()
        logging.getLogger(__name__).info("Postgres 연결 풀 종료")


app = FastAPI(title="Naming Studio API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api", tags=["api"])
app.include_router(myeongju_router, prefix="/api", tags=["myeongju"])


@app.get("/health")
def health():
    return {"status": "ok"}
