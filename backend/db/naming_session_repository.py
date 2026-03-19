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
        myeongju_id: str | None = None,
    ) -> None:
        """세션 메타데이터를 upsert합니다.

        최초 호출 시 행을 생성하고, 이후 호출 시 제공된 필드만 갱신합니다.
        None인 필드는 기존 값을 그대로 유지합니다.
        myeongju_id는 최초 설정 후 덮어쓰지 않습니다.
        """
        with self._pool.connection() as conn:
            conn.execute(
                """
                INSERT INTO naming_sessions (id, myeongju_id, stage, payment_status, naming_direction, user_info)
                VALUES (%s, %s, COALESCE(%s, 'welcome'), COALESCE(%s, 'pending'), %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    myeongju_id      = COALESCE(naming_sessions.myeongju_id, EXCLUDED.myeongju_id),
                    stage            = COALESCE(EXCLUDED.stage, naming_sessions.stage),
                    payment_status   = COALESCE(EXCLUDED.payment_status, naming_sessions.payment_status),
                    naming_direction = COALESCE(EXCLUDED.naming_direction, naming_sessions.naming_direction),
                    user_info        = COALESCE(EXCLUDED.user_info, naming_sessions.user_info),
                    updated_at       = NOW()
                """,
                (
                    session_id,
                    myeongju_id,
                    stage,
                    payment_status,
                    naming_direction,
                    json.dumps(user_info, ensure_ascii=False) if user_info else None,
                ),
            )

    def find_by_myeongju_id(self, myeongju_id: str) -> str | None:
        """myeongju_id로 session_id를 조회합니다.

        동일 명주에 행이 여러 개면 session_messages가 가장 많은 세션을 우선합니다
        (빈 세션만 최신인 경우 잘못 붙는 것을 방지).
        """
        with self._pool.connection() as conn:
            row = conn.execute(
                """
                SELECT ns.id
                FROM naming_sessions ns
                LEFT JOIN session_messages sm ON sm.session_id = ns.id
                WHERE ns.myeongju_id = %s
                GROUP BY ns.id
                ORDER BY COUNT(sm.id) DESC, MAX(ns.updated_at) DESC
                LIMIT 1
                """,
                (myeongju_id,),
            ).fetchone()
        return row["id"] if row else None

    def get_myeongju_id(self, session_id: str) -> str | None:
        """session_id에 연결된 myeongju_id를 반환합니다."""
        with self._pool.connection() as conn:
            row = conn.execute(
                "SELECT myeongju_id FROM naming_sessions WHERE id = %s LIMIT 1",
                (session_id,),
            ).fetchone()
        return row["myeongju_id"] if row else None
