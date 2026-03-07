# 지지육합 (love-teller 지지육합.ts)

from typing import List

from . import 십이지
from . import 지지


class 지지육합:
    def __init__(self, 십이지목록: List[십이지.십이지], 해석: str = ""):
        self.십이지목록 = 십이지목록
        self.해석 = 해석

    @staticmethod
    def list() -> List["지지육합"]:
        return [
            지지육합.자축육합,
            지지육합.인해육합,
            지지육합.묘술육합,
            지지육합.진유육합,
            지지육합.사신육합,
            지지육합.오미육합,
        ]

    @staticmethod
    def find(target: List[지지.지지]) -> List["지지육합"]:
        target_십이지 = [t.십이지 for t in target]
        return [
            h for h in 지지육합.list()
            if all(s in target_십이지 for s in h.십이지목록)
        ]


지지육합.자축육합 = 지지육합([십이지.십이지.자, 십이지.십이지.축])  # type: ignore[attr-defined]
지지육합.인해육합 = 지지육합([십이지.십이지.인, 십이지.십이지.해])  # type: ignore[attr-defined]
지지육합.묘술육합 = 지지육합([십이지.십이지.묘, 십이지.십이지.술])  # type: ignore[attr-defined]
지지육합.진유육합 = 지지육합([십이지.십이지.진, 십이지.십이지.유])  # type: ignore[attr-defined]
지지육합.사신육합 = 지지육합([십이지.십이지.사, 십이지.십이지.신])  # type: ignore[attr-defined]
지지육합.오미육합 = 지지육합([십이지.십이지.오, 십이지.십이지.미])  # type: ignore[attr-defined]
