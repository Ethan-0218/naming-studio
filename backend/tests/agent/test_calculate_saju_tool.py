"""agent.tools.calculate_saju_tool 단위 테스트."""

from __future__ import annotations

from agent.tools.calculate_saju_tool import calculate_saju


def test_calculate_saju_solar() -> None:
    out = calculate_saju(
        birth_date="2025-06-12",
        birth_time="14:28",
        gender="남",
        is_lunar=False,
    )
    assert out["일간"] == "임"
    assert out["신강신약"] in ("신강", "신약", "중화", "태강", "극약")
    assert "오행_분포" in out
    assert len(out["부족한_오행"]) >= 1
