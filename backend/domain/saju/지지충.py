# 지지충 (love-teller 지지충.ts)

from typing import List

from . import 십이지
from . import 지지


class 지지충:
    def __init__(self, 십이지목록: List[십이지.십이지], 해석: str = ""):
        self.십이지목록 = 십이지목록
        self.해석 = 해석

    @staticmethod
    def list() -> List["지지충"]:
        return [
            지지충.자오충,
            지지충.축미충,
            지지충.인신충,
            지지충.묘유충,
            지지충.진술충,
            지지충.사해충,
        ]

    @staticmethod
    def find(target: List[지지.지지]) -> List["지지충"]:
        target_십이지 = [t.십이지 for t in target]
        return [
            c for c in 지지충.list()
            if all(s in target_십이지 for s in c.십이지목록)
        ]


지지충.자오충 = 지지충([십이지.십이지.자, 십이지.십이지.오])  # type: ignore[attr-defined]
지지충.축미충 = 지지충([십이지.십이지.축, 십이지.십이지.미])  # type: ignore[attr-defined]
지지충.인신충 = 지지충([십이지.십이지.인, 십이지.십이지.신])  # type: ignore[attr-defined]
지지충.묘유충 = 지지충([십이지.십이지.묘, 십이지.십이지.유])  # type: ignore[attr-defined]
지지충.진술충 = 지지충([십이지.십이지.진, 십이지.십이지.술])  # type: ignore[attr-defined]
지지충.사해충 = 지지충([십이지.십이지.사, 십이지.십이지.해])  # type: ignore[attr-defined]
