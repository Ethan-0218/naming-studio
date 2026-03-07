# 지지방합 (love-teller 지지방합.ts)

from typing import List

from . import 십이지
from . import 지지


class 지지방합:
    def __init__(self, 십이지목록: List[십이지.십이지], 해석: str = ""):
        self.십이지목록 = 십이지목록
        self.해석 = 해석

    @staticmethod
    def list() -> List["지지방합"]:
        return [
            지지방합.인묘진방합,
            지지방합.사오미방합,
            지지방합.신유술방합,
            지지방합.해자축방합,
        ]

    @staticmethod
    def find(target: List[지지.지지]) -> List["지지방합"]:
        target_십이지 = [t.십이지 for t in target]
        return [
            h for h in 지지방합.list()
            if all(s in target_십이지 for s in h.십이지목록)
        ]


지지방합.인묘진방합 = 지지방합([십이지.십이지.인, 십이지.십이지.묘, 십이지.십이지.진])  # type: ignore[attr-defined]
지지방합.사오미방합 = 지지방합([십이지.십이지.사, 십이지.십이지.오, 십이지.십이지.미])  # type: ignore[attr-defined]
지지방합.신유술방합 = 지지방합([십이지.십이지.신, 십이지.십이지.유, 십이지.십이지.술])  # type: ignore[attr-defined]
지지방합.해자축방합 = 지지방합([십이지.십이지.해, 십이지.십이지.자, 십이지.십이지.축])  # type: ignore[attr-defined]
