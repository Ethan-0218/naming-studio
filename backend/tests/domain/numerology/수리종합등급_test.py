"""수리격 total_score → 5단 등급."""

from domain.numerology.수리종합등급 import 수리격_total_score_to_level


def test_대길_경계():
    assert 수리격_total_score_to_level(0.8) == "大吉"
    assert 수리격_total_score_to_level(1.0) == "大吉"


def test_중간_구간():
    assert 수리격_total_score_to_level(0.7) == "吉"
    assert 수리격_total_score_to_level(0.5) == "平"
    assert 수리격_total_score_to_level(0.3) == "凶"


def test_대흉():
    assert 수리격_total_score_to_level(0.19) == "大凶"
    assert 수리격_total_score_to_level(0.0) == "大凶"
