"""PostgreSQL 연결 풀 및 스키마 초기화."""

from __future__ import annotations

import logging
from pathlib import Path

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

logger = logging.getLogger(__name__)

_MIGRATIONS_DIR = Path(__file__).resolve().parent / "migrations"

# 앱 lifespan에서 create_pool() 호출 후 여기에 등록됩니다.
# name_store 등 저장소 모듈이 이 변수를 import해 사용합니다.
_pool_instance: ConnectionPool | None = None


def create_pool(url: str) -> ConnectionPool:
    """psycopg ConnectionPool을 생성합니다.

    autocommit=True 와 row_factory=dict_row 는 PostgresSaver가 요구하는 설정입니다.
    """
    global _pool_instance
    pool = ConnectionPool(
        url,
        min_size=2,
        max_size=10,
        kwargs={"autocommit": True, "row_factory": dict_row},
        open=True,
    )
    _pool_instance = pool
    logger.info("Postgres 연결 풀 생성 완료")
    return pool


def setup_db(pool: ConnectionPool) -> None:
    """애플리케이션 스키마와 LangGraph 체크포인터 스키마를 초기화합니다.

    - 001_init.sql: users / naming_sessions / session_name_preferences 테이블
    - PostgresSaver.setup(): checkpoints / checkpoint_blobs / checkpoint_writes 테이블
    """
    _run_migrations(pool)
    _setup_checkpointer(pool)


def _run_migrations(pool: ConnectionPool) -> None:
    for sql_path in sorted(_MIGRATIONS_DIR.glob("*.sql")):
        sql = sql_path.read_text(encoding="utf-8")
        with pool.connection() as conn:
            conn.execute(sql)
        logger.info("DB 마이그레이션 완료: %s", sql_path.name)


def _setup_checkpointer(pool: ConnectionPool) -> None:
    from langgraph.checkpoint.postgres import PostgresSaver
    checkpointer = PostgresSaver(pool)
    checkpointer.setup()
    logger.info("LangGraph PostgresSaver 스키마 초기화 완료")


def run_checkpoint_cleanup(older_than_days: int = 30) -> int:
    """오래된 LangGraph 체크포인트를 정리합니다.

    반환값: 삭제된 오래된 세션 체크포인트 수 (approximate).
    DATABASE_URL이 없거나 pool이 없으면 0을 반환합니다.
    """
    if _pool_instance is None:
        return 0
    try:
        with _pool_instance.connection() as conn:
            row = conn.execute(
                "SELECT * FROM cleanup_old_checkpoints(%s)",
                (older_than_days,),
            ).fetchone()
        if row:
            logger.info(
                "체크포인트 정리 완료 — writes: %d, checkpoints: %d, expired sessions: %d (기준: %d일)",
                row["pruned_writes"], row["pruned_checkpoints"], row["pruned_sessions"], older_than_days,
            )
            return row["pruned_writes"] + row["pruned_checkpoints"]
        return 0
    except Exception:
        logger.warning("체크포인트 정리 실패", exc_info=True)
        return 0
