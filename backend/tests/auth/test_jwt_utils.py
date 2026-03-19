"""auth.jwt_utils 단위 테스트."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from auth.jwt_utils import create_access_token, verify_access_token


def test_token_roundtrip() -> None:
    uid = "user-uuid-123"
    token = create_access_token(uid)
    assert verify_access_token(token) == uid


def test_verify_invalid_token() -> None:
    with pytest.raises(HTTPException) as exc:
        verify_access_token("not-a-jwt")
    assert exc.value.status_code == 401
