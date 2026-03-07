# 억부용신 (love-teller 억부용신.ts)

from typing import TYPE_CHECKING, Optional

from . import 오행
from . import 십신

if TYPE_CHECKING:
    from .사주팔자 import 사주팔자


class 억부용신:
    def __init__(self, 오행: 오행.오행, 근거: str):
        self.오행 = 오행
        self.근거 = 근거

    @staticmethod
    def from사주팔자(사주: "사주팔자") -> Optional["억부용신"]:
        def find오행(label: str) -> Optional[오행.오행]:
            values = 십신.십신.findPair(label)  # type: ignore[arg-type]
            for v in values:
                오 = 사주.find오행From십신(v)
                if 오 is not None:
                    return 오
            return None

        신강신약 = 사주.신강신약
        if 신강신약.신강한가():
            인성Count = 사주.count십신(십신.십신.편인) + 사주.count십신(십신.십신.정인)
            비겁Count = 사주.count십신(십신.십신.비견) + 사주.count십신(십신.십신.겁재)

            if 인성Count > 비겁Count:
                reason = f"인성이 비겁보다 많습니다. 인성: {인성Count}, 비겁: {비겁Count}"
                재성오행 = find오행("재성")
                if 재성오행 is not None:
                    return 억부용신(재성오행, reason)
                식상오행 = find오행("식상")
                if 식상오행 is not None:
                    return 억부용신(식상오행, reason)

            if 비겁Count > 인성Count:
                reason = f"비겁이 인성보다 많습니다. 비겁: {비겁Count}, 인성: {인성Count}"
                관성오행 = find오행("관성")
                if 관성오행 is not None:
                    return 억부용신(관성오행, reason)
                식상오행 = find오행("식상")
                if 식상오행 is not None:
                    return 억부용신(식상오행, reason)
                재성오행 = find오행("재성")
                if 재성오행 is not None:
                    return 억부용신(재성오행, reason)

            reason = f"인성과 비겁의 수가 같습니다. 인성: {인성Count}, 비겁: {비겁Count}"
            식상오행 = find오행("식상")
            if 식상오행 is not None:
                return 억부용신(식상오행, reason)
            재성오행 = find오행("재성")
            if 재성오행 is not None:
                return 억부용신(재성오행, reason)
            관성오행 = find오행("관성")
            if 관성오행 is not None:
                return 억부용신(관성오행, reason)
        else:
            관성Count = 사주.count십신(십신.십신.정관) + 사주.count십신(십신.십신.편관)
            식상Count = 사주.count십신(십신.십신.식신) + 사주.count십신(십신.십신.상관)
            재성Count = 사주.count십신(십신.십신.정재) + 사주.count십신(십신.십신.편재)

            def isMax(count: int) -> bool:
                return count == max(관성Count, 식상Count, 재성Count)

            if isMax(관성Count) or isMax(식상Count):
                reason = f"관성이나 식상이 가장 많습니다. 관성: {관성Count}, 식상: {식상Count}"
                인성오행 = find오행("인성")
                if 인성오행 is not None:
                    return 억부용신(인성오행, reason)
                비겁오행 = find오행("비겁")
                if 비겁오행 is not None:
                    return 억부용신(비겁오행, reason)
            else:
                reason = f"재성이 가장 많습니다. 재성: {재성Count}"
                비겁오행 = find오행("비겁")
                if 비겁오행 is not None:
                    return 억부용신(비겁오행, reason)
                인성오행 = find오행("인성")
                if 인성오행 is not None:
                    return 억부용신(인성오행, reason)
        return None
