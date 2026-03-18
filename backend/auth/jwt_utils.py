"""JWT 발급 및 검증."""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from jose import JWTError, jwt

from core.config import JWT_ALGORITHM, JWT_EXPIRE_DAYS, JWT_SECRET


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_access_token(token: str) -> str:
    """JWT 검증 → user_id 반환. 실패 시 HTTPException(401)."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
