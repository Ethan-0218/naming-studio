# 지지삼합 (love-teller 지지삼합.ts)

from typing import List

from . import 십이지
from . import 오행
from . import 지지


class 지지삼합:
    def __init__(self, 십이지목록: List[십이지.십이지], 극: 오행.오행, 해석: str = ""):
        self.십이지목록 = 십이지목록
        self.극 = 극
        self.해석 = 해석

    @staticmethod
    def list() -> List["지지삼합"]:
        return [
            지지삼합.해묘미삼합,
            지지삼합.인오술삼합,
            지지삼합.사유축삼합,
            지지삼합.신자진삼합,
        ]

    @staticmethod
    def find(target: List[지지.지지]) -> List["지지삼합"]:
        target_십이지 = [t.십이지 for t in target]
        return [
            h for h in 지지삼합.list()
            if all(s in target_십이지 for s in h.십이지목록)
        ]


지지삼합.해묘미삼합 = 지지삼합([십이지.십이지.해, 십이지.십이지.묘, 십이지.십이지.미], 오행.오행.목)  # type: ignore[attr-defined]
지지삼합.인오술삼합 = 지지삼합([십이지.십이지.인, 십이지.십이지.오, 십이지.십이지.술], 오행.오행.화)  # type: ignore[attr-defined]
지지삼합.사유축삼합 = 지지삼합([십이지.십이지.사, 십이지.십이지.유, 십이지.십이지.축], 오행.오행.금)  # type: ignore[attr-defined]
지지삼합.신자진삼합 = 지지삼합([십이지.십이지.신, 십이지.십이지.자, 십이지.십이지.진], 오행.오행.수)  # type: ignore[attr-defined]
