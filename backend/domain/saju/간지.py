# 간지 (love-teller 간지.ts)

from datetime import datetime

from . import 천간
from . import 지지


class 간지:
    def __init__(self, 천간: 천간.천간, 지지: 지지.지지):
        self.천간 = 천간
        self.지지 = 지지

    def equals(self, other: "간지") -> bool:
        return self.천간.equals(other.천간) and self.지지.equals(other.지지)

    @staticmethod
    def 연주(birth_datetime: datetime) -> "간지":
        return 간지(천간.천간.연간(birth_datetime), 지지.지지.연지(birth_datetime))

    @staticmethod
    def 월주(birth_datetime: datetime) -> "간지":
        return 간지(천간.천간.월간(birth_datetime), 지지.지지.월지(birth_datetime))

    @staticmethod
    def 일주(birth_datetime: datetime) -> "간지":
        return 간지(천간.천간.일간(birth_datetime), 지지.지지.일지(birth_datetime))

    @staticmethod
    def 시주(birth_datetime: datetime) -> "간지":
        return 간지(천간.천간.시간(birth_datetime), 지지.지지.시지(birth_datetime))
