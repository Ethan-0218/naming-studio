"""naming_sessions 테이블 CRUD."""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from psycopg_pool import ConnectionPool

logger = logging.getLogger(__name__)


class NamingSessionRepository:
    def __init__(self, pool: ConnectionPool) -> None:
        self._pool = pool

    def upsert_session(
        self,
        session_id: str,
        stage: str | None = None,
        payment_status: str | None = None,
        naming_direction: str | None = None,
        user_info: dict | None = None,
    ) -> None:
        """세션 메타데이터를 upsert합니다.

        최초 호출 시 행을 생성하고, 이후 호출 시 제공된 필드만 갱신합니다.
        None인 필드는 기존 값을 그대로 유지합니다.
        """
        with self._pool.connection() as conn:
            conn.execute(
                """
                INSERT INTO naming_sessions (id, stage, payment_status, naming_direction, user_info)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    stage           = COALESCE(EXCLUDED.stage, naming_sessions.stage),
                    payment_status  = COALESCE(EXCLUDED.payment_status, naming_sessions.payment_status),
                    naming_direction = COALESCE(EXCLUDED.naming_direction, naming_sessions.naming_direction),
                    user_info       = COALESCE(EXCLUDED.user_info, naming_sessions.user_info),
                    updated_at      = NOW()
                """,
                (
                    session_id,
                    stage,
                    payment_status,
                    naming_direction,
                    json.dumps(user_info, ensure_ascii=False) if user_info else None,
                ),
            )
