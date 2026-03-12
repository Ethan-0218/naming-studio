"""
좋아요/싫어요/본 이름 저장소.

DATABASE_URL 환경변수가 설정된 경우 Postgres 백엔드를 사용합니다.
설정되지 않은 경우 in-memory 백엔드로 동작합니다 (개발용 fallback).

호출부(routes.py, find_name_candidates_tool.py, 노드 등)는 변경 없이
이 모듈의 함수를 그대로 사용합니다.
"""

from __future__ import annotations

from core.config import DATABASE_URL

# ── Postgres 백엔드 ───────────────────────────────────────────────────────

def _get_pg_repo():
    """Postgres 저장소 인스턴스를 반환합니다 (앱 state에서 풀을 가져옴)."""
    from db.postgres_pool import _pool_instance
    from db.session_name_preference_repository import SessionNamePreferenceRepository
    return SessionNamePreferenceRepository(_pool_instance)


# ── 메모리 백엔드 ─────────────────────────────────────────────────────────

_store: dict[str, dict[str, list[str]]] = {}


def _ensure(session_id: str) -> None:
    if session_id not in _store:
        _store[session_id] = {"liked": [], "disliked": [], "shown": []}


# ── 공개 API ─────────────────────────────────────────────────────────────

def get_liked(session_id: str) -> list[str]:
    if DATABASE_URL:
        return _get_pg_repo().get_liked(session_id)
    _ensure(session_id)
    return list(_store[session_id]["liked"])


def get_disliked(session_id: str) -> list[str]:
    if DATABASE_URL:
        return _get_pg_repo().get_disliked(session_id)
    _ensure(session_id)
    return list(_store[session_id]["disliked"])


def get_shown(session_id: str) -> list[str]:
    if DATABASE_URL:
        return _get_pg_repo().get_shown(session_id)
    _ensure(session_id)
    return list(_store[session_id]["shown"])


def add_liked(session_id: str, name: str) -> None:
    if DATABASE_URL:
        _get_pg_repo().add_liked(session_id, name)
        return
    _ensure(session_id)
    if name not in _store[session_id]["liked"]:
        _store[session_id]["liked"].append(name)
    if name in _store[session_id]["disliked"]:
        _store[session_id]["disliked"].remove(name)


def add_disliked(session_id: str, name: str) -> None:
    if DATABASE_URL:
        _get_pg_repo().add_disliked(session_id, name)
        return
    _ensure(session_id)
    if name not in _store[session_id]["disliked"]:
        _store[session_id]["disliked"].append(name)
    if name in _store[session_id]["liked"]:
        _store[session_id]["liked"].remove(name)


def remove_liked(session_id: str, name: str) -> None:
    if DATABASE_URL:
        _get_pg_repo().remove_liked(session_id, name)
        return
    _ensure(session_id)
    if name in _store[session_id]["liked"]:
        _store[session_id]["liked"].remove(name)


def remove_disliked(session_id: str, name: str) -> None:
    if DATABASE_URL:
        _get_pg_repo().remove_disliked(session_id, name)
        return
    _ensure(session_id)
    if name in _store[session_id]["disliked"]:
        _store[session_id]["disliked"].remove(name)


def add_shown(session_id: str, names: list[str]) -> None:
    if DATABASE_URL:
        _get_pg_repo().add_shown(session_id, names)
        return
    _ensure(session_id)
    for name in names:
        if name not in _store[session_id]["shown"]:
            _store[session_id]["shown"].append(name)
