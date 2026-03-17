# 오행 3글자 조화 데이터 로더 (JSON)
# 소스: naming-studio/data/오행조화.json (backend + mobile 공유)

import json
from pathlib import Path
from typing import TypedDict

_캐시: dict[str, "_오행조화항목"] | None = None

# 체인: 오행조화_데이터.py → jakmyeong/ → domain/ → backend/ → naming-studio/
_JSON_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "오행조화.json"


class _오행조화항목(TypedDict):
    rating: str
    description: str


def _load() -> dict[str, "_오행조화항목"]:
    global _캐시
    if _캐시 is not None:
        return _캐시
    with open(_JSON_PATH, encoding="utf-8") as f:
        _캐시 = json.load(f)
    return _캐시


def get_오행조화_데이터(성: str, 이름1: str, 이름2: str) -> "_오행조화항목 | None":
    """
    3글자 오행 조화의 rating/description을 반환합니다.
    성, 이름1, 이름2는 오행 한글 값(목/화/토/금/수)이어야 합니다.
    예: get_오행조화_데이터("목", "화", "토") → {"rating": "대길", "description": "..."}
    """
    key = f"{성}{이름1}{이름2}"
    return _load().get(key)
