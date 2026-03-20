# 사주보완(용신·희신·기신) 글자 수 기반 5단 등급 — scored_combinations.saju_complement_level

from typing import Literal

사주보완등급 = Literal["大吉", "吉", "平", "凶", "大凶"]


def 사주보완_complement_level(
    용신_한글: str,
    surname_char_fe: str,
    h1_char_fe: str,
    h2_char_fe: str,
) -> 사주보완등급:
    """성·이름 두 글자 자원오행(유효한 것만)에 대해 net = (용신+희신)−기신 으로 5단.

    유효 오행 글자가 0개면 平.
    """
    from domain.saju.오행 import 오행

    ys = 오행.from_string(용신_한글)
    if ys is None:
        return "平"

    o0 = 오행.from_string(surname_char_fe) if surname_char_fe else None
    o1 = 오행.from_string(h1_char_fe) if h1_char_fe else None
    o2 = 오행.from_string(h2_char_fe) if h2_char_fe else None
    elements = [e for e in (o0, o1, o2) if e is not None]
    if not elements:
        return "平"

    gisin_o = ys.get극아오행()
    huisin_o = ys.get생아오행()

    y_cnt = h_cnt = g_cnt = 0
    for e in elements:
        if e == ys:
            y_cnt += 1
        elif e == huisin_o:
            h_cnt += 1
        elif e == gisin_o:
            g_cnt += 1

    net = (y_cnt + h_cnt) - g_cnt
    if net >= 2:
        return "大吉"
    if net == 1:
        return "吉"
    if net == 0:
        return "平"
    if net == -1:
        return "凶"
    return "大凶"
