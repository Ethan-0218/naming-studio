"""POST /api/auth/apple — Apple 로그인."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from auth.apple import verify_identity_token
from auth.jwt_utils import create_access_token

router = APIRouter()


class AppleLoginRequest(BaseModel):
    identity_token: str


class AuthResponse(BaseModel):
    access_token: str
    user_id: str


@router.post("/apple", response_model=AuthResponse)
async def apple_login(body: AppleLoginRequest):
    """Apple identity token → JWT 발급."""
    from core.config import DATABASE_URL
    if not DATABASE_URL:
        raise HTTPException(status_code=503, detail="DB 미연결")

    from db.postgres_pool import _pool_instance
    if _pool_instance is None:
        raise HTTPException(status_code=503, detail="DB 미연결")

    apple_id = await verify_identity_token(body.identity_token)

    from db.user_repository import UserRepository
    user_id = UserRepository(_pool_instance).upsert_by_apple_id(apple_id)

    token = create_access_token(user_id)
    return AuthResponse(access_token=token, user_id=user_id)
