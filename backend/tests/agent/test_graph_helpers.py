"""agent.graph: 조건부 엣지 헬퍼 및 그래프 컴파일."""

from __future__ import annotations

from langgraph.graph import END

from agent.graph import _after_direction_confirm, _after_preference_interview, create_agent_graph


def test_after_preference_interview() -> None:
    assert _after_preference_interview({"stage": "direction_confirm"}) == "direction_confirm"
    assert _after_preference_interview({"stage": "other"}) is END


def test_after_direction_confirm() -> None:
    assert _after_direction_confirm({"stage": "payment_gate"}) == "payment_gate"
    assert _after_direction_confirm({"stage": "x"}) is END


def test_create_agent_graph_compiles() -> None:
    g = create_agent_graph()
    assert g is not None
    assert hasattr(g, "invoke")
