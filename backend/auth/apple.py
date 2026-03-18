"""Apple identity token 검증 → apple_id 반환."""

import httpx
from fastapi import HTTPException
from jose import ExpiredSignatureError, JWTError, jwt

from core.config import APPLE_BUNDLE_ID

_APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys"
_APPLE_ISSUER = "https://appleid.apple.com"


async def _fetch_apple_public_keys() -> list[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(_APPLE_KEYS_URL)
        resp.raise_for_status()
        return resp.json()["keys"]


async def verify_identity_token(identity_token: str) -> str:
    """Apple identity token 검증 후 Apple user ID(sub)를 반환합니다."""
    try:
        header = jwt.get_unverified_header(identity_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 Apple identity token입니다.")

    kid = header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Apple token에 kid가 없습니다.")

    keys = await _fetch_apple_public_keys()
    matching_key = next((k for k in keys if k["kid"] == kid), None)
    if not matching_key:
        raise HTTPException(status_code=401, detail="Apple 공개 키를 찾을 수 없습니다.")

    try:
        payload = jwt.decode(
            identity_token,
            matching_key,
            algorithms=["RS256"],
            audience=APPLE_BUNDLE_ID,
            issuer=_APPLE_ISSUER,
        )
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Apple token이 만료되었습니다.")
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Apple token 검증 실패: {e}")

    apple_id: str | None = payload.get("sub")
    if not apple_id:
        raise HTTPException(status_code=401, detail="Apple token에 sub가 없습니다.")

    return apple_id
