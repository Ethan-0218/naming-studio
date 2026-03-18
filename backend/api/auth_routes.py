"""POST /api/auth/apple — Apple 로그인, GET /api/auth/me — 프로필 조회."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth.apple import verify_identity_token
from auth.dependencies import get_current_user
from auth.jwt_utils import create_access_token

router = APIRouter()


class AppleLoginRequest(BaseModel):
    identity_token: str
    full_name: str | None = None
    email: str | None = None


class UserProfile(BaseModel):
    user_id: str
    email: str | None
    display_name: str | None
    oauth_provider: str | None
    created_at: datetime
    is_premium: bool


class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    email: str | None
    display_name: str | None
    oauth_provider: str | None
    created_at: datetime
    is_premium: bool


def _get_pool():
    from core.config import DATABASE_URL
    if not DATABASE_URL:
        raise HTTPException(status_code=503, detail="DB 미연결")
    from db.postgres_pool import _pool_instance
    if _pool_instance is None:
        raise HTTPException(status_code=503, detail="DB 미연결")
    return _pool_instance


@router.post("/apple", response_model=AuthResponse)
async def apple_login(body: AppleLoginRequest):
    """Apple identity token → JWT 발급 + 프로필 반환."""
    pool = _get_pool()

    apple_id = await verify_identity_token(body.identity_token)

    from db.user_repository import UserRepository
    repo = UserRepository(pool)
    user_id = repo.upsert_by_apple_id(
        apple_id,
        email=body.email,
        display_name=body.full_name,
    )

    profile = repo.get_by_id(user_id)
    token = create_access_token(user_id)

    return AuthResponse(
        access_token=token,
        user_id=user_id,
        email=profile["email"] if profile else None,
        display_name=profile["display_name"] if profile else None,
        oauth_provider=profile["oauth_provider"] if profile else "apple",
        created_at=profile["created_at"] if profile else datetime.utcnow(),
        is_premium=profile["is_premium"] if profile else False,
    )


@router.get("/me", response_model=UserProfile)
async def get_me(user_id: str = Depends(get_current_user)):
    """Bearer token → 현재 유저 프로필 반환."""
    pool = _get_pool()

    from db.user_repository import UserRepository
    profile = UserRepository(pool).get_by_id(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")

    return UserProfile(
        user_id=profile["id"],
        email=profile["email"],
        display_name=profile["display_name"],
        oauth_provider=profile["oauth_provider"],
        created_at=profile["created_at"],
        is_premium=profile["is_premium"],
    )
