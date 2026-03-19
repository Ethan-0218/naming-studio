"""agent.tools.check_pronunciation_harmony_tool 단위 테스트."""

from __future__ import annotations

from agent.tools.check_pronunciation_harmony_tool import check_pronunciation_harmony


def test_empty_name() -> None:
    out = check_pronunciation_harmony("")
    assert out["level"] == "반길"
    assert "이름 없음" in out["reason"]


def test_three_char_name() -> None:
    out = check_pronunciation_harmony("김민수")
    assert "level" in out
    assert "글자별_오행" in out
    assert len(out["글자별_오행"]) == 3
