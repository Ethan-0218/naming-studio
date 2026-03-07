# 지지 (love-teller 지지.ts)

from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from . import 십이지 as 십이지모듈
from .십신 import 십신
from . import 십이운성
from . import 지장간
from .절기 import get절기년도

if TYPE_CHECKING:
    from .신살 import 신살


class 지지:
    def __init__(
        self,
        십이지: 십이지모듈.십이지,
        십신: 십신모듈.십신,
        십이운성: 십이운성.십이운성,
        지장간: 지장간.지장간,
        신살: Optional[List["신살"]] = None,
    ):
        self.십이지 = 십이지
        self.십신 = 십신
        self.십이운성 = 십이운성
        self.지장간 = 지장간
        self.신살 = 신살 if 신살 is not None else []

    def equals(self, other: "지지") -> bool:
        return self.십이지 == other.십이지

    @staticmethod
    def 연지(birth_datetime: datetime) -> "지지":
        from .십간 import 십간
        year = get절기년도(birth_datetime)
        일간 = 십간.fromDay(birth_datetime)
        인지십이지 = 십이지모듈.십이지.fromYear(year)
        연지운성 = 십이운성.find(인지십이지, 일간)
        return 지지(
            인지십이지,
            십신.from음양오행(일간, 인지십이지),
            연지운성,
            지장간.지장간.from십이지(인지십이지),
        )

    @staticmethod
    def 월지(birth_datetime: datetime) -> "지지":
        from .십간 import 십간
        일간 = 십간.fromDay(birth_datetime)
        월지십이지 = 십이지모듈.십이지.fromMonth(birth_datetime)
        월지운성 = 십이운성.find(월지십이지, 일간)
        return 지지(
            월지십이지,
            십신.from음양오행(일간, 월지십이지),
            월지운성,
            지장간.지장간.from십이지(월지십이지),
        )

    @staticmethod
    def 일지(birth_datetime: datetime) -> "지지":
        from .십간 import 십간
        일간 = 십간.fromDay(birth_datetime)
        일지십이지 = 십이지모듈.십이지.fromDay(birth_datetime)
        일지운성 = 십이운성.find(일지십이지, 일간)
        return 지지(
            일지십이지,
            십신.from음양오행(일간, 일지십이지),
            일지운성,
            지장간.지장간.from십이지(일지십이지),
        )

    @staticmethod
    def 시지(birth_datetime: datetime) -> "지지":
        from .십간 import 십간
        일간 = 십간.fromDay(birth_datetime)
        시지십이지 = 십이지모듈.십이지.fromHour(birth_datetime)
        시지운성 = 십이운성.find(시지십이지, 일간)
        return 지지(
            시지십이지,
            십신.from음양오행(일간, 시지십이지),
            시지운성,
            지장간.지장간.from십이지(시지십이지),
        )
