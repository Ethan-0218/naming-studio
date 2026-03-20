# 이름수리격 total_score(0~1) → 5단 등급 (사전 DB surigyeok_level 등)

from typing import Literal

수리종합등급 = Literal["大吉", "吉", "平", "凶", "大凶"]


def 수리격_total_score_to_level(total_score: float) -> 수리종합등급:
    """4격 평균 total_score를 5단 등급으로 변환 (상한 우선).

    >= 0.8 → 大吉, >= 0.6 → 吉, >= 0.4 → 平, >= 0.2 → 凶, 그 미만 → 大凶.
    """
    if total_score >= 0.8:
        return "大吉"
    if total_score >= 0.6:
        return "吉"
    if total_score >= 0.4:
        return "平"
    if total_score >= 0.2:
        return "凶"
    return "大凶"
