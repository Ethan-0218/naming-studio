# 천간 (love-teller 천간.ts)

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from . import 십간 as 십간모듈
from . import 십신 as 십신모듈
from .절기 import get절기년도


@dataclass(frozen=True)
class 천간:
    십간: 십간모듈.십간
    십신: 십신모듈.십신

    def equals(self, other: 천간) -> bool:
        return self.십간 == other.십간

    @staticmethod
    def 연간(birth_datetime: datetime) -> 천간:
        year = get절기년도(birth_datetime)
        일간 = 십간모듈.십간.fromDay(birth_datetime)
        return 천간(
            십간모듈.십간.fromYear(year),
            십신모듈.십신.from음양오행(일간, 십간모듈.십간.fromYear(year)),
        )

    @staticmethod
    def 월간(birth_datetime: datetime) -> 천간:
        year = get절기년도(birth_datetime)
        일간 = 십간모듈.십간.fromDay(birth_datetime)
        return 천간(
            십간모듈.십간.fromMonth(year, birth_datetime),
            십신모듈.십신.from음양오행(일간, 십간모듈.십간.fromMonth(year, birth_datetime)),
        )

    @staticmethod
    def 일간(birth_datetime: datetime) -> 천간:
        일간 = 십간모듈.십간.fromDay(birth_datetime)
        return 천간(
            십간모듈.십간.fromDay(birth_datetime),
            십신모듈.십신.from음양오행(일간, 십간모듈.십간.fromDay(birth_datetime)),
        )

    @staticmethod
    def 시간(birth_datetime: datetime) -> 천간:
        일간 = 십간모듈.십간.fromDay(birth_datetime)
        return 천간(
            십간모듈.십간.fromHour(birth_datetime),
            십신모듈.십신.from음양오행(일간, 십간모듈.십간.fromHour(birth_datetime)),
        )
