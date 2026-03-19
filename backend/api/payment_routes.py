"""결제 API: POST /api/purchases/verify, GET /api/purchases/status."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# product_id → (product_type, amount_krw) 매핑
_PRODUCT_MAP: dict[str, tuple[str, int]] = {
    "com.namingstudio.self_naming_premium":          ("self_naming_premium",    2900),
    "com.namingstudio.ai_naming_1":                  ("ai_naming_1",            4900),
    "com.namingstudio.ai_naming_5":                  ("ai_naming_5",           21900),
    "com.namingstudio.ai_naming_unlimited":          ("ai_naming_unlimited",   49800),
    "com.namingstudio.ai_naming_unlimited_u1":       ("ai_naming_unlimited_u1", 44900),
    "com.namingstudio.ai_naming_unlimited_u2":       ("ai_naming_unlimited_u2", 40000),
    "com.namingstudio.ai_naming_unlimited_u3":       ("ai_naming_unlimited_u3", 35100),
    "com.namingstudio.ai_naming_unlimited_u4":       ("ai_naming_unlimited_u4", 30200),
    "com.namingstudio.ai_naming_unlimited_u5":       ("ai_naming_unlimited_u5", 25300),
    "com.namingstudio.ai_naming_unlimited_u5plus":   ("ai_naming_unlimited_u5plus", 21900),
}

_AI_NAMING_TYPES = {
    "ai_naming_1", "ai_naming_5",
    "ai_naming_unlimited",
    "ai_naming_unlimited_u1", "ai_naming_unlimited_u2",
    "ai_naming_unlimited_u3", "ai_naming_unlimited_u4",
    "ai_naming_unlimited_u5", "ai_naming_unlimited_u5plus",
}


def _get_pool():
    from core.config import DATABASE_URL
    if not DATABASE_URL:
        raise HTTPException(status_code=503, detail="DB 미연결")
    from db.postgres_pool import _pool_instance
    if _pool_instance is None:
        raise HTTPException(status_code=503, detail="DB 미연결")
    return _pool_instance


class VerifyPurchaseRequest(BaseModel):
    product_id: str
    transaction_id: str
    receipt_data: str = ""       # base64 App Store receipt 또는 Play token
    session_id: str | None = None  # AI 작명 구매 시 필수, 프리미엄은 None


class VerifyPurchaseResponse(BaseModel):
    purchase_id: str
    product_type: str
    session_unlocked: bool   # AI 작명 세션 잠금 해제 여부
    user_premium: bool       # 스스로 이름짓기 프리미엄 활성화 여부


class PurchaseStatusResponse(BaseModel):
    self_naming_premium: bool
    ai_naming_unlocked: bool       # 무제한 구매 여부 (해당 세션)
    ai_naming_purchased_count: int # 총 구매 추천 수 (1개×n + 5개×n)
    purchases: list[dict]          # 전체 구매 이력 (결제 내역용)


@router.post("/verify", response_model=VerifyPurchaseResponse)
async def verify_purchase(
    body: VerifyPurchaseRequest,
    user_id: str = Depends(get_current_user),
):
    """IAP 영수증을 검증하고 구매를 기록합니다.

    TODO: 프로덕션에서는 Apple/Google 서버에 영수증 검증 요청 추가.
    현재는 클라이언트가 보고한 transaction_id를 신뢰합니다.
    Apple Sandbox: https://sandbox.itunes.apple.com/verifyReceipt
    Apple Production: https://buy.itunes.apple.com/verifyReceipt
    """
    pool = _get_pool()

    if body.product_id not in _PRODUCT_MAP:
        raise HTTPException(status_code=400, detail="알 수 없는 product_id입니다.")

    product_type, amount_krw = _PRODUCT_MAP[body.product_id]

    # AI 작명 구매 시 session_id 필수
    if product_type in _AI_NAMING_TYPES and not body.session_id:
        raise HTTPException(status_code=400, detail="AI 작명 구매에는 session_id가 필요합니다.")

    from db.purchase_repository import PurchaseRepository
    repo = PurchaseRepository(pool)

    # 중복 결제 방지
    if repo.check_transaction_exists(body.transaction_id):
        raise HTTPException(status_code=409, detail="이미 처리된 거래입니다.")

    # 구매 기록
    purchase_id = repo.record_purchase(
        user_id=user_id,
        product_id=body.product_id,
        product_type=product_type,
        amount_krw=amount_krw,
        transaction_id=body.transaction_id,
        receipt_data=body.receipt_data or None,
        session_id=body.session_id,
    )

    user_premium = False

    # 스스로 이름짓기 프리미엄: users.is_premium 업데이트
    if product_type == "self_naming_premium":
        from db.user_repository import UserRepository
        UserRepository(pool).set_premium(user_id, True)
        user_premium = True

    session_unlocked = product_type in _AI_NAMING_TYPES

    logger.info(
        "구매 완료 — user=%s product_type=%s purchase_id=%s",
        user_id, product_type, purchase_id,
    )

    return VerifyPurchaseResponse(
        purchase_id=purchase_id,
        product_type=product_type,
        session_unlocked=session_unlocked,
        user_premium=user_premium,
    )


@router.get("/status", response_model=PurchaseStatusResponse)
async def get_purchase_status(
    session_id: str | None = None,
    user_id: str = Depends(get_current_user),
):
    """사용자의 구매 상태를 반환합니다.

    session_id를 전달하면 해당 세션의 AI 작명 구매 상태도 포함합니다.
    """
    pool = _get_pool()

    from db.purchase_repository import PurchaseRepository
    repo = PurchaseRepository(pool)

    self_naming_premium = repo.get_user_self_naming_status(user_id)
    purchases = repo.get_user_purchases(user_id)

    ai_status = {"unlocked": False, "purchased_count": 0}
    if session_id:
        ai_status = repo.get_session_ai_status(session_id)

    return PurchaseStatusResponse(
        self_naming_premium=self_naming_premium,
        ai_naming_unlocked=ai_status["unlocked"],
        ai_naming_purchased_count=ai_status["purchased_count"],
        purchases=purchases,
    )
