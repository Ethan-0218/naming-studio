# 절기 (love-teller 절기.ts, calendar.utils.ts)

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List


def get일주Index(solar_date: datetime) -> int:
    """1936년 2월 12일(갑자일) 기준 일수 차이."""
    start = datetime(1936, 2, 12)
    return (solar_date - start).days


def get십이지IndexFrom시간(time: datetime) -> int:
    """시간(시)별 십이지 인덱스 (자=0 ~ 해=11). 자시 23~01, 축시 01~03 등 (01시는 자시)."""
    hour = time.hour
    매핑 = {
        23: 0, 0: 0, 1: 0, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4,
        9: 5, 10: 5, 11: 6, 12: 6, 13: 7, 14: 7, 15: 8, 16: 8,
        17: 9, 18: 9, 19: 10, 20: 10, 21: 11, 22: 11,
    }
    if hour not in 매핑:
        raise ValueError("유효하지 않은 시간입니다")
    return 매핑[hour]


@dataclass
class 절기:
    value: str
    절입일시: datetime


def get입춘(solar_year: int) -> datetime:
    data = 절기데이터.get(solar_year)
    if not data:
        raise ValueError(f"해당 년도의 절기 데이터가 없습니다. {solar_year}년")
    for x in data:
        if x.value == "입춘":
            return x.절입일시
    raise ValueError(f"{solar_year}년 입춘 데이터를 찾을 수 없습니다.")


def get절기년도(birth_datetime: datetime) -> int:
    year = birth_datetime.year
    입춘 = get입춘(year)
    if birth_datetime < 입춘:
        return year - 1
    return year


def findMonthOffset(birth_datetime: datetime) -> int:
    year = birth_datetime.year
    data = 절기데이터.get(year)
    if not data:
        raise ValueError(f"{year}년 절기 데이터가 없습니다.")
    first = None
    for x in data:
        if x.절입일시.month == birth_datetime.month:
            first = x
            break
    if first is None:
        raise ValueError(
            f"해당 양력 달의 절기 데이터가 없습니다. {year}년 {birth_datetime.month}월"
        )
    절기Index = (data.index(first) - 2 + 24) % 24
    month_offset = 절기Index // 2
    if birth_datetime < first.절입일시:
        month_offset -= 1
    return month_offset


# 절기데이터: 1992, 2024, 2025, 2026 (love-teller와 동일한 입춘/절입 시각)
절기데이터: Dict[int, List[절기]] = {
    1992: [
        절기("소한", datetime(1992, 1, 6, 11, 8)),
        절기("대한", datetime(1992, 1, 21, 4, 32)),
        절기("입춘", datetime(1992, 2, 4, 22, 48)),
        절기("우수", datetime(1992, 2, 19, 18, 43)),
        절기("경칩", datetime(1992, 3, 5, 16, 52)),
        절기("춘분", datetime(1992, 3, 20, 17, 48)),
        절기("청명", datetime(1992, 4, 4, 21, 45)),
        절기("곡우", datetime(1992, 4, 20, 4, 56)),
        절기("입하", datetime(1992, 5, 5, 15, 8)),
        절기("소만", datetime(1992, 5, 21, 4, 12)),
        절기("망종", datetime(1992, 6, 5, 19, 22)),
        절기("하지", datetime(1992, 6, 21, 12, 14)),
        절기("소서", datetime(1992, 7, 7, 5, 40)),
        절기("대서", datetime(1992, 7, 22, 23, 8)),
        절기("입추", datetime(1992, 8, 7, 15, 27)),
        절기("처서", datetime(1992, 8, 23, 6, 10)),
        절기("백로", datetime(1992, 9, 7, 18, 18)),
        절기("추분", datetime(1992, 9, 23, 3, 42)),
        절기("한로", datetime(1992, 10, 8, 9, 51)),
        절기("상강", datetime(1992, 10, 23, 12, 57)),
        절기("입동", datetime(1992, 11, 7, 12, 57)),
        절기("소설", datetime(1992, 11, 22, 10, 25)),
        절기("대설", datetime(1992, 12, 7, 5, 44)),
        절기("동지", datetime(1992, 12, 21, 23, 43)),
    ],
    2024: [
        절기("소한", datetime(2024, 1, 6, 5, 49)),
        절기("대한", datetime(2024, 1, 20, 23, 7)),
        절기("입춘", datetime(2024, 2, 4, 17, 27)),
        절기("우수", datetime(2024, 2, 19, 13, 13)),
        절기("경칩", datetime(2024, 3, 5, 11, 22)),
        절기("춘분", datetime(2024, 3, 20, 12, 6)),
        절기("청명", datetime(2024, 4, 4, 16, 2)),
        절기("곡우", datetime(2024, 4, 19, 22, 59)),
        절기("입하", datetime(2024, 5, 5, 9, 10)),
        절기("소만", datetime(2024, 5, 20, 21, 59)),
        절기("망종", datetime(2024, 6, 5, 13, 9)),
        절기("하지", datetime(2024, 6, 21, 5, 51)),
        절기("소서", datetime(2024, 7, 6, 23, 20)),
        절기("대서", datetime(2024, 7, 22, 16, 44)),
        절기("입추", datetime(2024, 8, 7, 9, 9)),
        절기("처서", datetime(2024, 8, 22, 23, 55)),
        절기("백로", datetime(2024, 9, 7, 12, 11)),
        절기("추분", datetime(2024, 9, 22, 21, 43)),
        절기("한로", datetime(2024, 10, 8, 3, 59)),
        절기("상강", datetime(2024, 10, 23, 7, 14)),
        절기("입동", datetime(2024, 11, 7, 7, 20)),
        절기("소설", datetime(2024, 11, 22, 4, 56)),
        절기("대설", datetime(2024, 12, 7, 0, 17)),
        절기("동지", datetime(2024, 12, 21, 18, 20)),
    ],
    2025: [
        절기("소한", datetime(2025, 1, 5, 11, 32)),
        절기("대한", datetime(2025, 1, 20, 5, 0)),
        절기("입춘", datetime(2025, 2, 3, 23, 10)),
        절기("우수", datetime(2025, 2, 18, 19, 6)),
        절기("경칩", datetime(2025, 3, 5, 17, 7)),
        절기("춘분", datetime(2025, 3, 20, 18, 1)),
        절기("청명", datetime(2025, 4, 4, 21, 48)),
        절기("곡우", datetime(2025, 4, 20, 4, 56)),
        절기("입하", datetime(2025, 5, 5, 14, 57)),
        절기("소만", datetime(2025, 5, 21, 3, 54)),
        절기("망종", datetime(2025, 6, 5, 18, 56)),
        절기("하지", datetime(2025, 6, 21, 11, 42)),
        절기("소서", datetime(2025, 7, 7, 5, 4)),
        절기("대서", datetime(2025, 7, 22, 22, 29)),
        절기("입추", datetime(2025, 8, 7, 14, 51)),
        절기("처서", datetime(2025, 8, 23, 5, 33)),
        절기("백로", datetime(2025, 9, 7, 17, 51)),
        절기("추분", datetime(2025, 9, 23, 3, 19)),
        절기("한로", datetime(2025, 10, 8, 9, 41)),
        절기("상강", datetime(2025, 10, 23, 12, 50)),
        절기("입동", datetime(2025, 11, 7, 13, 4)),
        절기("소설", datetime(2025, 11, 22, 10, 35)),
        절기("대설", datetime(2025, 12, 7, 6, 4)),
        절기("동지", datetime(2025, 12, 22, 0, 3)),
    ],
    2026: [
        절기("소한", datetime(2026, 1, 5, 17, 23)),
        절기("대한", datetime(2026, 1, 20, 10, 44)),
        절기("입춘", datetime(2026, 2, 4, 5, 2)),
        절기("우수", datetime(2026, 2, 19, 0, 51)),
        절기("경칩", datetime(2026, 3, 5, 22, 58)),
        절기("춘분", datetime(2026, 3, 20, 23, 45)),
        절기("청명", datetime(2026, 4, 5, 3, 39)),
        절기("곡우", datetime(2026, 4, 20, 10, 39)),
        절기("입하", datetime(2026, 5, 5, 20, 48)),
        절기("소만", datetime(2026, 5, 21, 9, 36)),
        절기("망종", datetime(2026, 6, 6, 0, 48)),
        절기("하지", datetime(2026, 6, 21, 17, 24)),
        절기("소서", datetime(2026, 7, 7, 10, 56)),
        절기("대서", datetime(2026, 7, 23, 4, 13)),
        절기("입추", datetime(2026, 8, 7, 20, 42)),
        절기("처서", datetime(2026, 8, 23, 11, 18)),
        절기("백로", datetime(2026, 9, 7, 23, 41)),
        절기("추분", datetime(2026, 9, 23, 9, 5)),
        절기("한로", datetime(2026, 10, 8, 15, 28)),
        절기("상강", datetime(2026, 10, 23, 18, 32)),
        절기("입동", datetime(2026, 11, 7, 18, 51)),
        절기("소설", datetime(2026, 11, 22, 16, 20)),
        절기("대설", datetime(2026, 12, 7, 11, 41)),
        절기("동지", datetime(2026, 12, 22, 5, 35)),
    ],
}
