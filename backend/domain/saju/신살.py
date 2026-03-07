# 신살 (love-teller 신살.ts)

from typing import List, TYPE_CHECKING

from . import 십이지
from . import 십간

if TYPE_CHECKING:
    from .간지 import 간지


class 신살:
    def __init__(self, value: str):
        self.value = value

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, 신살):
            return False
        return self.value == other.value


class 도화살(신살):
    def __init__(self):
        super().__init__("도화살")

    @staticmethod
    def 해당십이지() -> List[십이지.십이지]:
        return [십이지.십이지.묘, 십이지.십이지.유, 십이지.십이지.오, 십이지.십이지.자]

    @staticmethod
    def 해당하는가(target: 십이지.십이지) -> bool:
        return target in 도화살.해당십이지()


class 홍염살(신살):
    def __init__(self):
        super().__init__("홍염살")

    @staticmethod
    def 해당십이지() -> List[십이지.십이지]:
        return [십이지.십이지.묘, 십이지.십이지.유, 십이지.십이지.오, 십이지.십이지.자]

    @staticmethod
    def 해당하는가(target: 십이지.십이지, 일간: 십간.십간) -> bool:
        if 일간 == 십간.십간.갑:
            return target in [십이지.십이지.오, 십이지.십이지.신]
        if 일간 == 십간.십간.을:
            return target == 십이지.십이지.오
        if 일간 == 십간.십간.병:
            return target == 십이지.십이지.인
        if 일간 == 십간.십간.정:
            return target == 십이지.십이지.미
        if 일간 == 십간.십간.무:
            return target == 십이지.십이지.진
        if 일간 == 십간.십간.기:
            return target == 십이지.십이지.진
        if 일간 == 십간.십간.경:
            return target in [십이지.십이지.신, 십이지.십이지.술]
        if 일간 == 십간.십간.신:
            return target == 십이지.십이지.유
        if 일간 == 십간.십간.임:
            return target == 십이지.십이지.자
        if 일간 == 십간.십간.계:
            return target == 십이지.십이지.신
        return False


def find(
    target: 십이지.십이지,
    사주: "dict",
) -> List[신살]:
    """사주는 { 연주, 월주, 일주, 시주? } 형태."""
    result: List[신살] = []
    if 도화살.해당하는가(target):
        result.append(도화살())
    일주 = 사주["일주"]
    일간 = 일주.천간.십간
    if 홍염살.해당하는가(target, 일간):
        result.append(홍염살())
    return result
