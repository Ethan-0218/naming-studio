"""FastAPI 스모크: /health, 그래프 모킹 시 /api/chat."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_chat_with_mocked_graph(client: TestClient) -> None:
    g = MagicMock()
    g.get_state.return_value = MagicMock(values={})
    g.invoke.return_value = {
        "stage": "welcome",
        "_content_blocks": [{"type": "TEXT", "data": {"text": "테스트"}}],
        "messages": [],
        "payment_status": "pending",
    }
    client.app.state.agent_graph = g

    r = client.post("/api/chat", json={"message": "안녕"})
    assert r.status_code == 200
    body = r.json()
    assert body["session_id"]
    assert body["stage"] == "welcome"
    assert body["content"][0]["type"] == "TEXT"


def test_session_find_or_create_without_db(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """DATABASE_URL 없으면 새 UUID 세션만 반환 (라우트 모듈 스코프 값을 직접 끕니다)."""
    monkeypatch.setattr("api.routes.DATABASE_URL", None)

    r = client.post("/api/session/find-or-create", json={"myeongju_id": "mj-1"})
    assert r.status_code == 200
    data = r.json()
    assert data["is_new"] is True
    assert len(data["session_id"]) > 0


def test_get_session_state(client: TestClient) -> None:
    g = MagicMock()
    g.get_state.return_value = MagicMock(values={"stage": "welcome"})
    client.app.state.agent_graph = g

    r = client.get("/api/session/test-session-id")
    assert r.status_code == 200
    data = r.json()
    assert data["session_id"] == "test-session-id"
    assert data["stage"] == "welcome"


def test_cleanup_checkpoints_no_postgres(client: TestClient) -> None:
    r = client.post("/api/admin/cleanup-checkpoints?older_than_days=30")
    assert r.status_code == 200
    assert r.json()["deleted"] == 0


def test_submit_info_invalid_json(client: TestClient) -> None:
    g = MagicMock()
    client.app.state.agent_graph = g

    r = client.post(
        "/api/chat",
        json={"message": "not json", "action": "submit_info"},
    )
    assert r.status_code == 400

