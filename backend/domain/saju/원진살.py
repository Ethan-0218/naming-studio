# 원진살 (love-teller 원진살.ts)

from typing import List, Optional

from . import 십이지
from . import 지지


class 원진살:
    def __init__(self, 지지1: 십이지.십이지, 지지2: 십이지.십이지):
        self.지지1 = 지지1
        self.지지2 = 지지2

    @staticmethod
    def from_(지지1: 십이지.십이지, 지지2: 십이지.십이지) -> Optional["원진살"]:
        if (지지1 == 십이지.십이지.자 and 지지2 == 십이지.십이지.미) or (지지1 == 십이지.십이지.미 and 지지2 == 십이지.십이지.자):
            return 원진살.자미원진
        if (지지1 == 십이지.십이지.축 and 지지2 == 십이지.십이지.오) or (지지1 == 십이지.십이지.오 and 지지2 == 십이지.십이지.축):
            return 원진살.축오원진
        if (지지1 == 십이지.십이지.인 and 지지2 == 십이지.십이지.유) or (지지1 == 십이지.십이지.유 and 지지2 == 십이지.십이지.인):
            return 원진살.인유원진
        if (지지1 == 십이지.십이지.묘 and 지지2 == 십이지.십이지.신) or (지지1 == 십이지.십이지.신 and 지지2 == 십이지.십이지.묘):
            return 원진살.묘신원진
        if (지지1 == 십이지.십이지.진 and 지지2 == 십이지.십이지.해) or (지지1 == 십이지.십이지.해 and 지지2 == 십이지.십이지.진):
            return 원진살.진해원진
        if (지지1 == 십이지.십이지.사 and 지지2 == 십이지.십이지.술) or (지지1 == 십이지.십이지.술 and 지지2 == 십이지.십이지.사):
            return 원진살.사술원진
        return None

    @staticmethod
    def find(지지목록: List[지지.지지]) -> List["원진살"]:
        result: List[원진살] = []
        for i in range(len(지지목록)):
            for j in range(i + 1, len(지지목록)):
                지지1 = 지지목록[i].십이지
                지지2 = 지지목록[j].십이지
                v = 원진살.from_(지지1, 지지2)
                if v is not None:
                    result.append(v)
        return result


원진살.자미원진 = 원진살(십이지.십이지.자, 십이지.십이지.미)  # type: ignore[attr-defined]
원진살.축오원진 = 원진살(십이지.십이지.축, 십이지.십이지.오)  # type: ignore[attr-defined]
원진살.인유원진 = 원진살(십이지.십이지.인, 십이지.십이지.유)  # type: ignore[attr-defined]
원진살.묘신원진 = 원진살(십이지.십이지.묘, 십이지.십이지.신)  # type: ignore[attr-defined]
원진살.진해원진 = 원진살(십이지.십이지.진, 십이지.십이지.해)  # type: ignore[attr-defined]
원진살.사술원진 = 원진살(십이지.십이지.사, 십이지.십이지.술)  # type: ignore[attr-defined]
