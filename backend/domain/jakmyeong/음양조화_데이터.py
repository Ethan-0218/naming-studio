# 음양조화 데이터 로더 (JSON)
# 소스: naming-studio/data/음양조화.json (backend + mobile 공유)

import json
from pathlib import Path
from typing import TypedDict

_캐시: dict[str, "_음양조화항목"] | None = None

# 체인: 음양조화_데이터.py → jakmyeong/ → domain/ → backend/ → naming-studio/
_JSON_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "음양조화.json"


class _음양조화항목(TypedDict):
    rating: str
    description: str


def _load() -> dict[str, "_음양조화항목"]:
    global _캐시
    if _캐시 is not None:
        return _캐시
    with open(_JSON_PATH, encoding="utf-8") as f:
        _캐시 = json.load(f)
    return _캐시


def get_음양조화_데이터(key: str) -> "_음양조화항목 | None":
    """
    음양 조합 키에 해당하는 rating과 description을 반환합니다.
    key는 글자별 음양 조합 문자열 (예: "음양", "음음양").
    """
    return _load().get(key)
