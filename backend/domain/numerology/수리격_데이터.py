# 81수리격 데이터 로더 (JSON)

import json
from pathlib import Path
from typing import Any

_수리격_캐시: dict[str, Any] | None = None

# 체인: 수리격_데이터.py → numerology/ → domain/ → backend/ → naming-studio/
_JSON_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "수리격.json"


def load_수리격() -> dict[str, Any]:
    """81수리격 JSON을 로드하고 캐시합니다. 키는 "0"~"81" 문자열."""
    global _수리격_캐시
    if _수리격_캐시 is not None:
        return _수리격_캐시
    with open(_JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)
    # 키 0~81 검증
    for i in range(82):
        key = str(i)
        if key not in data:
            raise ValueError(f"수리격 데이터에 키 '{key}'가 없습니다.")
        row = data[key]
        for field in ("level", "name1", "name2", "interpretation"):
            if field not in row:
                raise ValueError(f"수리격[{key}]에 '{field}'가 없습니다.")
        if "male" not in row["level"] or "female" not in row["level"]:
            raise ValueError(f"수리격[{key}].level에 male/female이 없습니다.")
    _수리격_캐시 = data
    return data
