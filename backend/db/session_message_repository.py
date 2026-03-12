"""session_messages 테이블 CRUD."""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from psycopg_pool import ConnectionPool

logger = logging.getLogger(__name__)


class SessionMessageRepository:
    def __init__(self, pool: ConnectionPool) -> None:
        self._pool = pool

    def add_message(
        self,
        session_id: str,
        role: str,
        content_blocks: list[dict],
        stage: str | None = None,
    ) -> None:
        """메시지 1건을 session_messages에 저장합니다.

        naming_sessions FK 제약을 위해 세션 행이 없으면 먼저 upsert합니다.
        """
        self._ensure_session(session_id)
        with self._pool.connection() as conn:
            conn.execute(
                "INSERT INTO session_messages (session_id, role, content_blocks, stage) "
                "VALUES (%s, %s, %s::jsonb, %s)",
                (session_id, role, json.dumps(content_blocks, ensure_ascii=False), stage),
            )

    def get_messages(self, session_id: str) -> list[dict]:
        """세션의 전체 메시지 이력을 생성 순서대로 반환합니다.

        반환 형태: [{"role": "user"|"assistant", "content_blocks": [...], "stage": "..."}]
        """
        with self._pool.connection() as conn:
            rows = conn.execute(
                "SELECT role, content_blocks, stage FROM session_messages "
                "WHERE session_id = %s ORDER BY id ASC",
                (session_id,),
            ).fetchall()
        return [
            {
                "role": r["role"],
                "content_blocks": r["content_blocks"],
                "stage": r["stage"],
            }
            for r in rows
        ]

    def _ensure_session(self, session_id: str) -> None:
        with self._pool.connection() as conn:
            conn.execute(
                "INSERT INTO naming_sessions (id) VALUES (%s) ON CONFLICT (id) DO NOTHING",
                (session_id,),
            )
