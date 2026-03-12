"""
좋아요/싫어요 이름 패턴에서 취향을 자동 추론합니다.

추론 대상은 순수 취향 영역(발음 느낌, 받침 수, 희귀도)에 한정합니다.
용신·자원오행·수리격 등 사주/작명 이론 기반 점수는 취향이 아니므로 건드리지 않습니다.
"""

from __future__ import annotations

# 부드러운 초성 (soft feel)
_SOFT_INITIALS = set("ㅅㄴㅁㅇㅎㄹ")
# 강한 초성 (strong feel)
_STRONG_INITIALS = set("ㅂㄱㄷㅈㅊ")

# 한글 자모 분해를 위한 기본 상수
_CHO = [
    "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
    "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
]
_JONG = [
    "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ",
    "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ",
    "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
]

_RARITY_SIGNAL_SCORE = {
    "희귀": 2,
    "보통": 1,
    "흔한": 0,
}


def _get_initial(char: str) -> str | None:
    """한글 글자의 초성을 반환합니다. 한글이 아니면 None."""
    code = ord(char)
    if 0xAC00 <= code <= 0xD7A3:
        return _CHO[(code - 0xAC00) // 28 // 21]
    return None


def _count_받침(name: str) -> int:
    """이름(음절 단위)에서 받침 있는 글자 수를 반환합니다."""
    count = 0
    for char in name:
        code = ord(char)
        if 0xAC00 <= code <= 0xD7A3:
            jong_idx = (code - 0xAC00) % 28
            if jong_idx > 0:
                count += 1
    return count


def _classify_feel(name: str) -> str | None:
    """이름의 초성 패턴을 분석해 soft/strong/None을 반환합니다."""
    soft = 0
    strong = 0
    for char in name:
        initial = _get_initial(char)
        if initial in _SOFT_INITIALS:
            soft += 1
        elif initial in _STRONG_INITIALS:
            strong += 1
    if soft == 0 and strong == 0:
        return None
    if soft > strong:
        return "soft"
    if strong > soft:
        return "strong"
    return None  # 동률 → 판단 보류


def infer_preferences(
    liked_names: list[str],
    disliked_names: list[str],
    shown_name_scores: dict[str, dict],
    current_inferred: dict,
) -> dict:
    """좋아요/싫어요 이름 목록에서 취향 속성을 추론해 inferred_preferences를 반환합니다.

    추론 결과는 기존 current_inferred를 덮어쓰지 않고 신뢰도 높은 경우만 갱신합니다.
    liked_names가 2개 미만이면 아직 패턴을 판단하기 어려우므로 건드리지 않습니다.
    """
    result = dict(current_inferred)

    if len(liked_names) < 2:
        # 좋아요 2개 미만: 패턴 판단 유보
        return result

    # ── 1. 발음 느낌 (soft/strong) 추론 ────────────────────────────────────
    feel_votes: dict[str, int] = {"soft": 0, "strong": 0}
    for name in liked_names:
        feel = _classify_feel(name)
        if feel:
            feel_votes[feel] += 1
    for name in disliked_names:
        feel = _classify_feel(name)
        if feel:
            opposite = "strong" if feel == "soft" else "soft"
            feel_votes[opposite] += 1  # 싫어요의 반대를 선호로 가산

    soft_votes = feel_votes["soft"]
    strong_votes = feel_votes["strong"]
    total_feel = soft_votes + strong_votes
    if total_feel >= 2:
        if soft_votes / total_feel >= 0.7:
            result["name_feel_preference"] = "soft"
        elif strong_votes / total_feel >= 0.7:
            result["name_feel_preference"] = "strong"
        else:
            # 패턴 불명확 → 기존 값 유지
            pass

    # ── 2. 받침 수 추론 ──────────────────────────────────────────────────
    liked_받침_counts = [_count_받침(name) for name in liked_names]
    avg_받침 = sum(liked_받침_counts) / len(liked_받침_counts)

    if avg_받침 == 0:
        result["max_받침_count"] = 0
    elif avg_받침 <= 0.5:
        result["max_받침_count"] = 1
    else:
        # 받침 많은 이름 선호 → 제한 없음 (기존 값 유지 또는 제거)
        result.pop("max_받침_count", None)

    # ── 3. 희귀도 추론 ───────────────────────────────────────────────────
    # rarity_signal은 content_blocks의 NAME 데이터에 저장되어 있으며
    # shown_name_scores에는 score_breakdown만 있으므로, 별도로 rarity_signal을 추적하려면
    # shown_name_scores에 rarity_signal을 함께 저장해야 합니다.
    # 현재는 score_breakdown만 캐시하므로, 희귀도 추론은 충분한 신호가 있을 때만 적용합니다.
    liked_rarity_scores = [
        _RARITY_SIGNAL_SCORE.get(shown_name_scores.get(name, {}).get("rarity_signal", ""), -1)
        for name in liked_names
    ]
    valid_rarity = [s for s in liked_rarity_scores if s >= 0]
    if len(valid_rarity) >= 2:
        avg_rarity = sum(valid_rarity) / len(valid_rarity)
        if avg_rarity >= 1.7:  # 2(희귀) 위주
            result["rarity_preference"] = "독특한"
        elif avg_rarity <= 0.3:  # 0(흔한) 위주
            result["rarity_preference"] = "평범한"
        else:
            result.pop("rarity_preference", None)

    return result
