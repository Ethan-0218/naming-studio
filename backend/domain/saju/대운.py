# 대운 (love-teller 대운.ts) — 스텁. 이번 단계에서는 최소 구현만.

from typing import List, Optional

from . import 성별


class 대운:
    def __init__(self, 순번: int, 십간: object, 십이지: object, 시작나이: int):
        self.순번 = 순번
        self.십간 = 십간
        self.십이지 = 십이지
        self.시작나이 = 시작나이


class 대운흐름:
    def __init__(self, 대운수: int, 흐름: List[대운], birth_date: str):
        self.대운수 = 대운수
        self.흐름 = 흐름
        self.birthDate = birth_date

    @staticmethod
    def create(gender: 성별.성별, birth_date: str, birth_time: Optional[str] = None) -> "대운흐름":
        return 대운흐름(0, [], birth_date)
