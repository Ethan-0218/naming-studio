"""purchases 테이블 CRUD."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from psycopg_pool import ConnectionPool

logger = logging.getLogger(__name__)

# product_type → 추천 수 매핑 (무제한 variants는 모두 unlimited)
_PRODUCT_TYPE_TO_COUNT: dict[str, int | None] = {
    "ai_naming_1": 1,
    "ai_naming_5": 5,
    "ai_naming_unlimited": None,
    "ai_naming_unlimited_u1": None,
    "ai_naming_unlimited_u2": None,
    "ai_naming_unlimited_u3": None,
    "ai_naming_unlimited_u4": None,
    "ai_naming_unlimited_u5": None,
    "ai_naming_unlimited_u5plus": None,
}

_UNLIMITED_TYPES = {
    "ai_naming_unlimited",
    "ai_naming_unlimited_u1",
    "ai_naming_unlimited_u2",
    "ai_naming_unlimited_u3",
    "ai_naming_unlimited_u4",
    "ai_naming_unlimited_u5",
    "ai_naming_unlimited_u5plus",
}


class PurchaseRepository:
    def __init__(self, pool: ConnectionPool) -> None:
        self._pool = pool

    def check_transaction_exists(self, transaction_id: str) -> bool:
        """중복 결제 방지: transaction_id가 이미 기록되어 있으면 True."""
        with self._pool.connection() as conn:
            row = conn.execute(
                "SELECT 1 FROM purchases WHERE transaction_id = %s LIMIT 1",
                (transaction_id,),
            ).fetchone()
        return row is not None

    def record_purchase(
        self,
        user_id: str,
        product_id: str,
        product_type: str,
        amount_krw: int,
        transaction_id: str,
        receipt_data: str | None = None,
        session_id: str | None = None,
    ) -> str:
        """구매 이력을 기록하고 purchase UUID를 반환합니다."""
        with self._pool.connection() as conn:
            row = conn.execute(
                """
                INSERT INTO purchases
                    (user_id, session_id, product_id, product_type,
                     amount_krw, transaction_id, receipt_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    user_id,
                    session_id,
                    product_id,
                    product_type,
                    amount_krw,
                    transaction_id,
                    receipt_data,
                ),
            ).fetchone()
        return str(row["id"])

    def get_session_ai_status(self, session_id: str) -> dict:
        """세션의 AI 작명 구매 상태를 반환합니다.

        Returns:
            {
                "unlocked": bool,            # 무제한 구매 여부
                "purchased_count": int,      # 누적 구매 추천 수 (1개×n + 5개×n)
            }
        """
        with self._pool.connection() as conn:
            rows = conn.execute(
                """
                SELECT product_type FROM purchases
                WHERE session_id = %s AND status = 'completed'
                """,
                (session_id,),
            ).fetchall()

        purchased_count = 0
        unlocked = False
        for (pt,) in rows:
            if pt in _UNLIMITED_TYPES:
                unlocked = True
            elif pt == "ai_naming_1":
                purchased_count += 1
            elif pt == "ai_naming_5":
                purchased_count += 5

        return {"unlocked": unlocked, "purchased_count": purchased_count}

    def get_user_self_naming_status(self, user_id: str) -> bool:
        """사용자의 스스로 이름짓기 프리미엄 구매 여부를 반환합니다."""
        with self._pool.connection() as conn:
            row = conn.execute(
                """
                SELECT 1 FROM purchases
                WHERE user_id = %s
                  AND product_type = 'self_naming_premium'
                  AND status = 'completed'
                LIMIT 1
                """,
                (user_id,),
            ).fetchone()
        return row is not None

    def get_user_purchases(self, user_id: str) -> list[dict]:
        """사용자의 전체 구매 이력을 최신순으로 반환합니다."""
        with self._pool.connection() as conn:
            rows = conn.execute(
                """
                SELECT id, product_id, product_type, amount_krw,
                       session_id, purchased_at
                FROM purchases
                WHERE user_id = %s AND status = 'completed'
                ORDER BY purchased_at DESC
                """,
                (user_id,),
            ).fetchall()

        return [
            {
                "id": str(r[0]),
                "product_id": r[1],
                "product_type": r[2],
                "amount_krw": r[3],
                "session_id": r[4],
                "purchased_at": r[5].isoformat() if r[5] else None,
            }
            for r in rows
        ]
