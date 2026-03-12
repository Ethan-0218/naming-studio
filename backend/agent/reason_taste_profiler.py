"""
좋아요/싫어요 명시적 이유 데이터에서 취향 프로파일을 구축합니다.

preference_inferrer.py가 초성·받침·희귀도 패턴을 알고리즘으로 추론하는 것과 달리,
이 모듈은 사용자가 직접 선택한 이유 선택지(발음, 분위기 등)를 집계합니다.
"""

from __future__ import annotations

# 이유 키 목록 (모바일 ReasonPicker와 동일해야 합니다)
REASON_KEYS = ["pronunciation", "vibe", "meaning", "surname_harmony", "rarity", "other"]

REASON_LABELS_KO = {
    "pronunciation": "발음",
    "vibe": "분위기/이미지",
    "meaning": "뜻/한자",
    "surname_harmony": "성과의 조화",
    "rarity": "희귀도",
    "other": "기타",
}

# 좋아요 이유별 한국어 설명 템플릿
_LIKE_NARRATIVES = {
    "pronunciation": "발음을 중요하게 여기시는 것 같습니다",
    "vibe": "분위기와 이미지를 중요하게 여기시는 것 같습니다",
    "meaning": "뜻과 한자 의미를 중요하게 여기시는 것 같습니다",
    "surname_harmony": "성과의 조화를 중요하게 여기시는 것 같습니다",
    "rarity": "적당히 독특한 이름을 선호하시는 것 같습니다",
    "other": "다양한 기준으로 이름을 고르시는 것 같습니다",
}

# 싫어요 이유별 한국어 설명 템플릿
_DISLIKE_NARRATIVES = {
    "pronunciation": "발음이 별로일 때 싫어요를 누르시는 경향이 있습니다",
    "vibe": "분위기나 이미지가 맞지 않을 때 싫어요를 누르시는 경향이 있습니다",
    "meaning": "뜻이 마음에 안 들 때 싫어요를 누르시는 경향이 있습니다",
    "surname_harmony": "성과 어울리지 않으면 싫어요를 누르시는 경향이 있습니다",
    "rarity": "너무 흔하거나 낯선 이름은 피하시는 경향이 있습니다",
    "other": "다양한 이유로 싫어요를 누르시는 경향이 있습니다",
}

# dominant 판정 임계값
_MIN_VOTES = 2      # 최소 투표 수
_MIN_SHARE = 0.35   # 전체 투표 중 최소 비율


def build_reason_taste_profile(reason_records: list[dict]) -> dict:
    """이유 기록 목록에서 취향 프로파일을 구축합니다.

    Args:
        reason_records: get_reasons_for_session() 반환값
            [{'preference_type': 'liked'|'disliked', 'name': str, 'reasons': list[str]}, ...]

    Returns:
        {
          'like_reasons': {key: count},      # 좋아요 이유별 집계
          'dislike_reasons': {key: count},   # 싫어요 이유별 집계
          'dominant_like': [key, ...],       # 신뢰도 높은 좋아요 이유
          'dominant_dislike': [key, ...],    # 신뢰도 높은 싫어요 이유
          'total_reactions_with_reasons': int,
          'narrative_hints': [str, ...],     # 프롬프트에 주입할 한국어 설명 목록
        }
    """
    like_counts: dict[str, int] = {k: 0 for k in REASON_KEYS}
    dislike_counts: dict[str, int] = {k: 0 for k in REASON_KEYS}
    total = 0

    other_like_texts: list[str] = []
    other_dislike_texts: list[str] = []

    for record in reason_records:
        ptype = record.get("preference_type", "")
        reasons = record.get("reasons", [])
        if not reasons:
            continue
        total += 1
        counts = like_counts if ptype == "liked" else dislike_counts
        other_texts = other_like_texts if ptype == "liked" else other_dislike_texts
        for r in reasons:
            # 'other:텍스트' 형식 처리 — 'other' 카테고리로 집계하고 텍스트 따로 보관
            if r.startswith("other:"):
                counts["other"] += 1
                text = r[len("other:"):].strip()
                if text:
                    other_texts.append(text)
            elif r in counts:
                counts[r] += 1

    like_total = sum(like_counts.values())
    dislike_total = sum(dislike_counts.values())

    dominant_like = [
        k for k in REASON_KEYS
        if like_counts[k] >= _MIN_VOTES
        and like_total > 0
        and like_counts[k] / like_total >= _MIN_SHARE
    ]
    dominant_dislike = [
        k for k in REASON_KEYS
        if dislike_counts[k] >= _MIN_VOTES
        and dislike_total > 0
        and dislike_counts[k] / dislike_total >= _MIN_SHARE
    ]

    narrative_hints: list[str] = []
    for k in dominant_like:
        if k != "other":
            cnt = like_counts[k]
            narrative_hints.append(f"{_LIKE_NARRATIVES[k]} (좋아요 {cnt}회)")
    for k in dominant_dislike:
        if k != "other":
            cnt = dislike_counts[k]
            narrative_hints.append(f"{_DISLIKE_NARRATIVES[k]} (싫어요 {cnt}회)")

    return {
        "like_reasons": {k: v for k, v in like_counts.items() if v > 0},
        "dislike_reasons": {k: v for k, v in dislike_counts.items() if v > 0},
        "dominant_like": dominant_like,
        "dominant_dislike": dominant_dislike,
        "total_reactions_with_reasons": total,
        "narrative_hints": narrative_hints,
        "other_like_texts": other_like_texts,
        "other_dislike_texts": other_dislike_texts,
    }
