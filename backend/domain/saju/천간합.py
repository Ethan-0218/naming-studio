# 천간합 (love-teller 천간합.ts)

from typing import List

from . import 십간
from . import 천간


class 천간합:
    def __init__(self, 십간목록: List[십간.십간], 해석: str = ""):
        self.십간목록 = 십간목록
        self.해석 = 해석

    @staticmethod
    def list() -> List["천간합"]:
        return [
            천간합.갑기합,
            천간합.을경합,
            천간합.병신합,
            천간합.정임합,
            천간합.무계합,
        ]

    @staticmethod
    def find(target: List[천간.천간]) -> List["천간합"]:
        target_십간 = [t.십간 for t in target]
        return [
            h for h in 천간합.list()
            if all(s in target_십간 for s in h.십간목록)
        ]


천간합.갑기합 = 천간합([십간.십간.갑, 십간.십간.기])  # type: ignore[attr-defined]
천간합.을경합 = 천간합([십간.십간.을, 십간.십간.경])  # type: ignore[attr-defined]
천간합.병신합 = 천간합([십간.십간.병, 십간.십간.신])  # type: ignore[attr-defined]
천간합.정임합 = 천간합([십간.십간.정, 십간.십간.임])  # type: ignore[attr-defined]
천간합.무계합 = 천간합([십간.십간.무, 십간.십간.계])  # type: ignore[attr-defined]
