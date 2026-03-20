"""사주보완 complement level (이름 두 글자 기준, 성씨 제외)."""

from domain.saju.사주보완등급 import 사주보완_complement_level


def test_두글자_모두_용신_대길():
    # 목 용신, 이름 두 글자 모두 목 → net 2 → 大吉
    assert 사주보완_complement_level("목", "목", "목") == "大吉"


def test_용신_희신_각_하나_대길():
    # 목 용신, 희신=수(수생목). 목+수 → net (1+1)-0=2 → 大吉
    assert 사주보완_complement_level("목", "목", "수") == "大吉"


def test_용신_하나_길():
    # 목 용신, h1=목 h2=토(기타) → net 1 → 吉
    assert 사주보완_complement_level("목", "목", "토") == "吉"


def test_희신_하나_길():
    # 목 용신, 희신=수(수생목). h1=수 h2=토 → net 1 → 吉
    assert 사주보완_complement_level("목", "수", "토") == "吉"


def test_net_0_평():
    # 목 용신, 기신=금. h1=목(용신) h2=금(기신) → net (1+0)-1=0 → 平
    assert 사주보완_complement_level("목", "목", "금") == "平"


def test_기타만_평():
    # 목 용신, 두 글자 모두 토(기타) → net 0 → 平
    assert 사주보완_complement_level("목", "토", "토") == "平"


def test_기신_하나_흉():
    # 목 용신, 기신=금. h1=금 h2=토 → net -1 → 凶
    assert 사주보완_complement_level("목", "금", "토") == "凶"


def test_두글자_모두_기신_대흉():
    # 목 용신, 기신=금. h1=금 h2=금 → net -2 → 大凶
    assert 사주보완_complement_level("목", "금", "금") == "大凶"


def test_유효오행_없으면_평():
    assert 사주보완_complement_level("목", "", "") == "平"


def test_용신_없으면_평():
    assert 사주보완_complement_level("없음", "목", "화") == "平"


def test_한글자만_유효_용신이면_길():
    # h1=목(용신), h2="" → net 1 → 吉
    assert 사주보완_complement_level("목", "목", "") == "吉"


def test_한글자만_유효_기신이면_흉():
    # h1=금(기신), h2="" → net -1 → 凶
    assert 사주보완_complement_level("목", "금", "") == "凶"
