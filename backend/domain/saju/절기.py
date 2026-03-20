# 절기 — 절입 시각은 `절기_데이터.py`(love-teller 절기.ts 동기화).
# 갱신: backend에서 `python3 scripts/generate_jeolgi_data.py <절기.ts 경로>`

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List

from .절기_데이터 import JEOLGI_DATETIMES


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


절기데이터: Dict[int, List[절기]] = {
    year: [절기(name, dt) for name, dt in rows]
    for year, rows in JEOLGI_DATETIMES.items()
}
