# 통합 rating → [0, 1] 점수 변환 모듈.
# 소스: naming-studio/data/rating_scores.json (backend + mobile 공유)

import json
from pathlib import Path

_JSON_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "rating_scores.json"
_캐시: dict[str, float] | None = None


def load() -> dict[str, float]:
    global _캐시
    if _캐시 is not None:
        return _캐시
    with open(_JSON_PATH, encoding="utf-8") as f:
        _캐시 = json.load(f)
    return _캐시


def to_score(rating: str) -> float:
    """rating 문자열 → [0, 1] 점수. 알 수 없는 등급이면 0.5(중립) 반환."""
    return load().get(rating, 0.5)
