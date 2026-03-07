# 십이지 (love-teller 십이지.ts)

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from .계절 import 계절
from .음양 import 음양
from .오행 import 오행
from .절기 import get일주Index, get십이지IndexFrom시간, findMonthOffset


@dataclass(frozen=True)
class 십이지:
    value: Literal["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]
    한자: str
    음양: 음양
    오행: 오행
    계절: 계절
    상징: str

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, 십이지):
            return False
        return self.value == other.value

    def equals(self, other: "십이지") -> bool:
        return self.value == other.value

    @staticmethod
    def fromYear(year: int) -> "십이지":
        idx = (year - 4) % 12
        return list_십이지[idx]

    @staticmethod
    def fromMonth(birth_datetime: datetime) -> "십이지":
        month_offset = findMonthOffset(birth_datetime)
        idx = (month_offset + 2) % 12
        return list_십이지[idx]

    @staticmethod
    def fromDay(birth_datetime: datetime) -> "십이지":
        idx = get일주Index(birth_datetime) % 12
        return list_십이지[idx]

    @staticmethod
    def fromHour(birth_datetime: datetime) -> "십이지":
        idx = get십이지IndexFrom시간(birth_datetime) % 12
        return list_십이지[idx]

    @staticmethod
    def findIndex(time: datetime) -> int:
        return get십이지IndexFrom시간(time)


# 인스턴스
십이지.자 = 십이지("자", "子", 음양.음, 오행.수, 계절.겨울, "쥐")  # type: ignore[misc]
십이지.축 = 십이지("축", "丑", 음양.음, 오행.토, 계절.겨울, "소")  # type: ignore[misc]
십이지.인 = 십이지("인", "寅", 음양.양, 오행.목, 계절.봄, "호랑이")  # type: ignore[misc]
십이지.묘 = 십이지("묘", "卯", 음양.음, 오행.목, 계절.봄, "토끼")  # type: ignore[misc]
십이지.진 = 십이지("진", "辰", 음양.양, 오행.토, 계절.봄, "용")  # type: ignore[misc]
십이지.사 = 십이지("사", "巳", 음양.양, 오행.화, 계절.여름, "뱀")  # type: ignore[misc]
십이지.오 = 십이지("오", "午", 음양.음, 오행.화, 계절.여름, "말")  # type: ignore[misc]
십이지.미 = 십이지("미", "未", 음양.음, 오행.토, 계절.여름, "양")  # type: ignore[misc]
십이지.신 = 십이지("신", "申", 음양.양, 오행.금, 계절.가을, "원숭이")  # type: ignore[misc]
십이지.유 = 십이지("유", "酉", 음양.음, 오행.금, 계절.가을, "닭")  # type: ignore[misc]
십이지.술 = 십이지("술", "戌", 음양.양, 오행.토, 계절.가을, "개")  # type: ignore[misc]
십이지.해 = 십이지("해", "亥", 음양.양, 오행.수, 계절.겨울, "돼지")  # type: ignore[misc]

list_십이지 = [
    십이지.자, 십이지.축, 십이지.인, 십이지.묘, 십이지.진, 십이지.사,
    십이지.오, 십이지.미, 십이지.신, 십이지.유, 십이지.술, 십이지.해,
]
