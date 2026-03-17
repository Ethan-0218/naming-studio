"""users 테이블 접근."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from psycopg_pool import ConnectionPool


class UserRepository:
    def __init__(self, pool: "ConnectionPool") -> None:
        self._pool = pool

    def upsert_by_device_id(self, device_id: str) -> str:
        """device_id로 users 행을 upsert하고 UUID 문자열을 반환합니다."""
        with self._pool.connection() as conn:
            row = conn.execute(
                """
                INSERT INTO users (device_id)
                VALUES (%s)
                ON CONFLICT (device_id) DO UPDATE SET last_seen_at = NOW()
                RETURNING id
                """,
                (device_id,),
            ).fetchone()
        return str(row["id"])
