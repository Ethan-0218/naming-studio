"""session_name_preferences 테이블 CRUD."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from psycopg_pool import ConnectionPool

logger = logging.getLogger(__name__)

PreferenceType = str  # 'liked' | 'disliked' | 'shown'


class SessionNamePreferenceRepository:
    def __init__(self, pool: ConnectionPool) -> None:
        self._pool = pool

    # ── 조회 ──────────────────────────────────────────────────────────────

    def get_by_type(self, session_id: str, preference_type: PreferenceType) -> list[str]:
        with self._pool.connection() as conn:
            rows = conn.execute(
                "SELECT name FROM session_name_preferences "
                "WHERE session_id = %s AND preference_type = %s "
                "ORDER BY created_at",
                (session_id, preference_type),
            ).fetchall()
        return [r["name"] for r in rows]

    def get_liked(self, session_id: str) -> list[str]:
        return self.get_by_type(session_id, "liked")

    def get_disliked(self, session_id: str) -> list[str]:
        return self.get_by_type(session_id, "disliked")

    def get_shown(self, session_id: str) -> list[str]:
        return self.get_by_type(session_id, "shown")

    # ── 추가 ──────────────────────────────────────────────────────────────

    def add(self, session_id: str, preference_type: PreferenceType, name: str) -> None:
        """세션이 naming_sessions에 없으면 먼저 upsert한 뒤 선호 이름을 삽입합니다."""
        self._ensure_session(session_id)
        with self._pool.connection() as conn:
            conn.execute(
                "INSERT INTO session_name_preferences (session_id, preference_type, name) "
                "VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                (session_id, preference_type, name),
            )

    def add_liked(self, session_id: str, name: str) -> None:
        # liked 추가 전 disliked에서 제거 (상호 배타)
        self.remove(session_id, "disliked", name)
        self.add(session_id, "liked", name)

    def add_disliked(self, session_id: str, name: str) -> None:
        # disliked 추가 전 liked에서 제거 (상호 배타)
        self.remove(session_id, "liked", name)
        self.add(session_id, "disliked", name)

    def add_shown(self, session_id: str, names: list[str]) -> None:
        for name in names:
            self.add(session_id, "shown", name)

    # ── 삭제 ──────────────────────────────────────────────────────────────

    def remove(self, session_id: str, preference_type: PreferenceType, name: str) -> None:
        with self._pool.connection() as conn:
            conn.execute(
                "DELETE FROM session_name_preferences "
                "WHERE session_id = %s AND preference_type = %s AND name = %s",
                (session_id, preference_type, name),
            )

    def remove_liked(self, session_id: str, name: str) -> None:
        self.remove(session_id, "liked", name)

    def remove_disliked(self, session_id: str, name: str) -> None:
        self.remove(session_id, "disliked", name)

    # ── 내부 헬퍼 ─────────────────────────────────────────────────────────

    def _ensure_session(self, session_id: str) -> None:
        """session_name_preferences의 FK 제약을 위해 naming_sessions 행이 존재함을 보장합니다."""
        with self._pool.connection() as conn:
            conn.execute(
                "INSERT INTO naming_sessions (id) VALUES (%s) ON CONFLICT (id) DO NOTHING",
                (session_id,),
            )
