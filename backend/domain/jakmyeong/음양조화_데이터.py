# 음양조화 설명 데이터 로더 (JSON)
# 소스: naming-studio/data/음양조화.json (backend + mobile 공유)

import json
from pathlib import Path

_캐시: dict[str, str] | None = None

# 체인: 음양조화_데이터.py → jakmyeong/ → domain/ → backend/ → naming-studio/
_JSON_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "음양조화.json"


def _load() -> dict[str, str]:
    global _캐시
    if _캐시 is not None:
        return _캐시
    with open(_JSON_PATH, encoding="utf-8") as f:
        _캐시 = json.load(f)
    return _캐시


def get_음양조화_설명(key: str) -> str | None:
    """
    음양 조합 키에 해당하는 설명을 반환합니다.
    key는 글자별 음양 조합 문자열 (예: "음양", "음음양").
    """
    return _load().get(key)
