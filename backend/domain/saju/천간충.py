# 천간충 (love-teller 천간충.ts)

from typing import List

from . import 십간
from . import 천간


class 천간충:
    def __init__(self, 십간목록: List[십간.십간], 해석: str = ""):
        self.십간목록 = 십간목록
        self.해석 = 해석

    @staticmethod
    def list() -> List["천간충"]:
        return [
            천간충.갑경충,
            천간충.을신충,
            천간충.병임충,
            천간충.정계충,
            천간충.무임충,
            천간충.갑무충,
            천간충.기을충,
            천간충.경병충,
            천간충.신정충,
            천간충.계기충,
        ]

    @staticmethod
    def find(target: List[천간.천간]) -> List["천간충"]:
        target_십간 = [t.십간 for t in target]
        return [
            c
            for c in 천간충.list()
            if all(s in target_십간 for s in c.십간목록)
        ]


천간충.갑경충 = 천간충([십간.십간.갑, 십간.십간.경])  # type: ignore[attr-defined]
천간충.을신충 = 천간충([십간.십간.을, 십간.십간.신])  # type: ignore[attr-defined]
천간충.병임충 = 천간충([십간.십간.병, 십간.십간.임])  # type: ignore[attr-defined]
천간충.정계충 = 천간충([십간.십간.정, 십간.십간.계])  # type: ignore[attr-defined]
천간충.무임충 = 천간충([십간.십간.무, 십간.십간.임])  # type: ignore[attr-defined]
천간충.갑무충 = 천간충([십간.십간.갑, 십간.십간.무])  # type: ignore[attr-defined]
천간충.기을충 = 천간충([십간.십간.기, 십간.십간.을])  # type: ignore[attr-defined]
천간충.경병충 = 천간충([십간.십간.경, 십간.십간.병])  # type: ignore[attr-defined]
천간충.신정충 = 천간충([십간.십간.신, 십간.십간.정])  # type: ignore[attr-defined]
천간충.계기충 = 천간충([십간.십간.계, 십간.십간.기])  # type: ignore[attr-defined]
