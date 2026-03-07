# 수리격 도메인 (81수리, 원형이정 4격)

from typing import Literal

from .격 import 격
from .이름수리격 import 이름수리격
from .수리격_데이터 import load_수리격


def 성별_to_gender_key(남_or_여: Literal["남", "여"]) -> Literal["male", "female"]:
    """도메인 경계용: naming-studio 성별('남'|'여')을 수리격 내부 키('male'|'female')로 변환."""
    return "male" if 남_or_여 == "남" else "female"


__all__ = [
    "격",
    "이름수리격",
    "load_수리격",
    "성별_to_gender_key",
]
