# 지지반합 (love-teller 지지반합.ts)

from typing import List

from . import 십이지
from . import 지지


class 지지반합:
    def __init__(self, 십이지목록: List[십이지.십이지], 해석: str = ""):
        self.십이지목록 = 십이지목록
        self.해석 = 해석

    @staticmethod
    def list() -> List["지지반합"]:
        return [
            지지반합.해묘반합,
            지지반합.묘미반합,
            지지반합.인오반합,
            지지반합.오술반합,
            지지반합.사유반합,
            지지반합.유축반합,
            지지반합.신자반합,
            지지반합.자진반합,
        ]

    @staticmethod
    def find(target: List[지지.지지]) -> List["지지반합"]:
        target_십이지 = [t.십이지 for t in target]
        return [
            h for h in 지지반합.list()
            if all(s in target_십이지 for s in h.십이지목록)
        ]


지지반합.해묘반합 = 지지반합([십이지.십이지.해, 십이지.십이지.묘])  # type: ignore[attr-defined]
지지반합.묘미반합 = 지지반합([십이지.십이지.묘, 십이지.십이지.미])  # type: ignore[attr-defined]
지지반합.인오반합 = 지지반합([십이지.십이지.인, 십이지.십이지.오])  # type: ignore[attr-defined]
지지반합.오술반합 = 지지반합([십이지.십이지.오, 십이지.십이지.술])  # type: ignore[attr-defined]
지지반합.사유반합 = 지지반합([십이지.십이지.사, 십이지.십이지.유])  # type: ignore[attr-defined]
지지반합.유축반합 = 지지반합([십이지.십이지.유, 십이지.십이지.축])  # type: ignore[attr-defined]
지지반합.신자반합 = 지지반합([십이지.십이지.신, 십이지.십이지.자])  # type: ignore[attr-defined]
지지반합.자진반합 = 지지반합([십이지.십이지.자, 십이지.십이지.진])  # type: ignore[attr-defined]
