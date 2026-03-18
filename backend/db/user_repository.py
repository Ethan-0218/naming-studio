"""users 테이블 접근."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

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

    def upsert_by_apple_id(
        self,
        apple_id: str,
        email: str | None = None,
        display_name: str | None = None,
    ) -> str:
        """apple_id로 users 행을 upsert하고 UUID 문자열을 반환합니다.

        첫 로그인 시 email/display_name을 저장하고, 재로그인 시 last_seen_at만 갱신합니다.
        """
        with self._pool.connection() as conn:
            row = conn.execute(
                """
                INSERT INTO users (apple_id, oauth_provider, email, display_name)
                VALUES (%s, 'apple', %s, %s)
                ON CONFLICT (apple_id) DO UPDATE
                  SET last_seen_at = NOW(),
                      email        = COALESCE(users.email, EXCLUDED.email),
                      display_name = COALESCE(users.display_name, EXCLUDED.display_name)
                RETURNING id
                """,
                (apple_id, email, display_name),
            ).fetchone()
        return str(row["id"])

    def get_by_id(self, user_id: str) -> dict[str, Any] | None:
        """user_id로 프로필 조회. 없으면 None 반환."""
        with self._pool.connection() as conn:
            row = conn.execute(
                """
                SELECT id, email, display_name, oauth_provider, created_at, is_premium
                FROM users
                WHERE id = %s
                """,
                (user_id,),
            ).fetchone()
        if row is None:
            return None
        return {
            "id": str(row["id"]),
            "email": row["email"],
            "display_name": row["display_name"],
            "oauth_provider": row["oauth_provider"],
            "created_at": row["created_at"],
            "is_premium": row["is_premium"],
        }
