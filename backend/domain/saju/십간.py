# 십간 (love-teller 십간.ts)
# 참고: love-teller에서 경=辛, 신=庚 으로 정의되어 있음 (한자 표기)

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from .계절 import 계절
from .음양 import 음양
from .오행 import 오행
from .절기 import findMonthOffset, get일주Index, get절기년도, get십이지IndexFrom시간


@dataclass(frozen=True)
class 십간:
    value: Literal["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
    한자: str
    음양: 음양
    오행: 오행
    계절: 계절

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, 십간):
            return False
        return self.value == other.value

    def equals(self, other: "십간") -> bool:
        return self.value == other.value

    @staticmethod
    def fromYear(year: int) -> "십간":
        idx = (year - 4) % 10
        return list_십간[idx]

    @staticmethod
    def fromMonth(year: int, birth_datetime: datetime) -> "십간":
        연간 = 십간.fromYear(year)
        시작십간 = None
        if 연간 in (십간.갑, 십간.기):
            시작십간 = 십간.병
        elif 연간 in (십간.을, 십간.경):
            시작십간 = 십간.무
        elif 연간 in (십간.병, 십간.신):
            시작십간 = 십간.경
        elif 연간 in (십간.정, 십간.임):
            시작십간 = 십간.임
        elif 연간 in (십간.무, 십간.계):
            시작십간 = 십간.갑
        if 시작십간 is None:
            raise ValueError(f"월간 계산 실패: 연간={연간.value}")
        시작인덱스 = list_십간.index(시작십간)
        month_offset = findMonthOffset(birth_datetime)
        idx = (시작인덱스 + month_offset) % 10
        return list_십간[idx]

    @staticmethod
    def fromDay(birth_datetime: datetime) -> "십간":
        idx = get일주Index(birth_datetime) % 10
        return list_십간[idx]

    @staticmethod
    def fromHour(birth_datetime: datetime) -> "십간":
        일간 = 십간.fromDay(birth_datetime)
        일간인덱스 = list_십간.index(일간)
        시작천간목록 = [십간.갑, 십간.병, 십간.무, 십간.경, 십간.임]
        시작천간 = 시작천간목록[일간인덱스 % 5]
        시작인덱스 = list_십간.index(시작천간)
        십이지인덱스 = get십이지IndexFrom시간(birth_datetime)
        최종인덱스 = (시작인덱스 + 십이지인덱스) % 10
        return list_십간[최종인덱스]


# 인스턴스 (love-teller: 경=辛, 신=庚)
십간.갑 = 십간("갑", "甲", 음양.양, 오행.목, 계절.봄)  # type: ignore[misc]
십간.을 = 십간("을", "乙", 음양.음, 오행.목, 계절.봄)  # type: ignore[misc]
십간.병 = 십간("병", "丙", 음양.양, 오행.화, 계절.여름)  # type: ignore[misc]
십간.정 = 십간("정", "丁", 음양.음, 오행.화, 계절.여름)  # type: ignore[misc]
십간.무 = 십간("무", "戊", 음양.양, 오행.토, 계절.중재)  # type: ignore[misc]
십간.기 = 십간("기", "己", 음양.음, 오행.토, 계절.중재)  # type: ignore[misc]
십간.경 = 십간("경", "辛", 음양.양, 오행.금, 계절.가을)  # type: ignore[misc]
십간.신 = 십간("신", "庚", 음양.음, 오행.금, 계절.가을)  # type: ignore[misc]
십간.임 = 십간("임", "壬", 음양.양, 오행.수, 계절.겨울)  # type: ignore[misc]
십간.계 = 십간("계", "癸", 음양.음, 오행.수, 계절.겨울)  # type: ignore[misc]

list_십간 = [
    십간.갑, 십간.을, 십간.병, 십간.정, 십간.무,
    십간.기, 십간.경, 십간.신, 십간.임, 십간.계,
]
