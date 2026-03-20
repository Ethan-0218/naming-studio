"""사주보완 complement level (용·희·기 net)."""

from domain.saju.사주보완등급 import 사주보완_complement_level


def test_세글자_모두_용신():
    assert 사주보완_complement_level("목", "목", "목", "목") == "大吉"


def test_net_0_평():
    # 목 용신: 희신 수, 기신 금 — 목 목 금 → 용2 기1 → net 2-1=1 actually y=2 g=1 -> (2+0)-1=1 吉
    # For net 0: e.g. 1용 1기: 목 화 금 if 목 ys, 화 is 생아=목? get생아오행 of 목 is 화. So 목 화 and one 기신
    # Simpler: all 기타 only - but 3 chars need 3 오행 that are not y/h/g
    # 목 용신, 희신=화, 기신=금. Use 토 토 토 -> 기타 3: net 0
    assert 사주보완_complement_level("목", "토", "토", "토") == "平"


def test_유효오행_없으면_평():
    assert 사주보완_complement_level("목", "", "", "") == "平"


def test_net_minus2_대흉():
    # 목 용신, 기신=금. Three 금 -> g=3, y=h=0 -> net -3
    assert 사주보완_complement_level("목", "금", "금", "금") == "大凶"
