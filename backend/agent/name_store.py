"""
좋아요/싫어요 in-memory store.
TODO: 추후 DB(예: SQLite 또는 PostgreSQL)로 교체 필요.
UI에서 좋아요/싫어요 목록을 직접 수정할 수 있어야 하므로 LangGraph state 외부에서 관리.
"""

_store: dict[str, dict[str, list[str]]] = {}


def _ensure(session_id: str) -> None:
    if session_id not in _store:
        _store[session_id] = {"liked": [], "disliked": []}


def get_liked(session_id: str) -> list[str]:
    _ensure(session_id)
    return list(_store[session_id]["liked"])


def get_disliked(session_id: str) -> list[str]:
    _ensure(session_id)
    return list(_store[session_id]["disliked"])


def add_liked(session_id: str, name: str) -> None:
    _ensure(session_id)
    if name not in _store[session_id]["liked"]:
        _store[session_id]["liked"].append(name)
    if name in _store[session_id]["disliked"]:
        _store[session_id]["disliked"].remove(name)


def add_disliked(session_id: str, name: str) -> None:
    _ensure(session_id)
    if name not in _store[session_id]["disliked"]:
        _store[session_id]["disliked"].append(name)
    if name in _store[session_id]["liked"]:
        _store[session_id]["liked"].remove(name)


def remove_liked(session_id: str, name: str) -> None:
    _ensure(session_id)
    if name in _store[session_id]["liked"]:
        _store[session_id]["liked"].remove(name)


def remove_disliked(session_id: str, name: str) -> None:
    _ensure(session_id)
    if name in _store[session_id]["disliked"]:
        _store[session_id]["disliked"].remove(name)
