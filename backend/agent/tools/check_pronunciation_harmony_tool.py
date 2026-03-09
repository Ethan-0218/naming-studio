"""발음오행 조화 확인 툴."""

from domain.jakmyeong.발음오행 import 발음오행_from_초성
from domain.jakmyeong.오행조화 import 오행조화


def check_pronunciation_harmony(full_name: str) -> dict:
    """전체 이름(성+이름)의 발음오행 조화를 계산합니다.

    반환: {level, reason, 글자별_오행}
    """
    if not full_name:
        return {"level": "반길", "reason": "이름 없음", "글자별_오행": []}

    chars = list(full_name)
    오행_list = [발음오행_from_초성(c) for c in chars]

    글자별_오행 = [
        {"글자": c, "오행": o.value if o else None}
        for c, o in zip(chars, 오행_list)
    ]

    # 오행이 있는 글자로만 조화 계산
    valid = [o for o in 오행_list if o is not None]
    if len(valid) < 2:
        return {"level": "반길", "reason": "오행 계산 불가", "글자별_오행": 글자별_오행}

    if len(valid) == 2:
        harmony = 오행조화.from_오행(valid[0], valid[1])
    else:
        harmony = 오행조화.from_오행(valid[0], valid[1], valid[2])

    return {
        "level": harmony.level,
        "reason": harmony.reason,
        "글자별_오행": 글자별_오행,
    }
