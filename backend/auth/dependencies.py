"""FastAPI 인증 의존성."""

from fastapi import Header, HTTPException

from auth.jwt_utils import verify_access_token


async def get_current_user(authorization: str = Header(...)) -> str:
    """Authorization: Bearer <jwt> → user_id 반환."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer 토큰이 필요합니다.")
    token = authorization[len("Bearer "):]
    return verify_access_token(token)
