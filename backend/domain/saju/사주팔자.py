# 사주팔자 (love-teller 사주팔자.ts)

from datetime import datetime
from typing import List, Optional

from . import 간지
from . import 성별
from . import 신강신약
from . import 억부용신
from . import 기신
from . import 희신
from . import 십신
from . import 십간
from . import 십이지
from . import 오행
from . import 천간
from . import 천간충
from . import 천간합
from . import 지지
from . import 지지충
from . import 지지반합
from . import 지지방합
from . import 지지삼합
from . import 지지육합
from . import 원진살
from . import 공망
from . import 신살
from . import 대운


class 사주팔자:
    def __init__(
        self,
        name: str,
        gender: 성별.성별,
        birth_date: str,  # yyyy-MM-dd
        birth_time: Optional[str] = None,  # HH:mm
    ):
        self.name = name
        self.gender = gender
        self.birthDate = datetime.strptime(birth_date, "%Y-%m-%d").date()
        if birth_time is not None:
            self.birthTime = datetime.strptime(
                f"{birth_date} {birth_time}", "%Y-%m-%d %H:%M"
            ).time()
        else:
            self.birthTime = None
        self.birthDatetime = datetime.combine(
            self.birthDate,
            self.birthTime if self.birthTime is not None else datetime.min.time(),
        )

        self.연주 = 간지.간지.연주(self.birthDatetime)
        self.월주 = 간지.간지.월주(self.birthDatetime)
        self.일주 = 간지.간지.일주(self.birthDatetime)
        self.시주 = 간지.간지.시주(self.birthDatetime) if self.birthTime is not None else None

        self.신강신약 = 신강신약.신강신약.from사주팔자(self)
        억부용신_결과 = 억부용신.억부용신.from사주팔자(self)
        if 억부용신_결과 is None:
            raise ValueError("억부용신 계산 결과가 없습니다.")
        self.억부용신 = 억부용신_결과
        self.기신 = 기신.기신.from억부용신(self.억부용신)
        self.희신 = 희신.희신.from억부용신(self.억부용신)

        self.천간합 = 천간합.천간합.find(self.천간목록)
        self.지지반합 = 지지반합.지지반합.find(self.지지목록)
        self.지지방합 = 지지방합.지지방합.find(self.지지목록)
        self.지지삼합 = 지지삼합.지지삼합.find(self.지지목록)
        self.지지육합 = 지지육합.지지육합.find(self.지지목록)
        self.천간충 = 천간충.천간충.find(self.천간목록)
        self.지지충 = 지지충.지지충.find(self.지지목록)

        self.연주.지지.신살 = 신살.find(self.연주.지지.십이지, self.사주)
        self.월주.지지.신살 = 신살.find(self.월주.지지.십이지, self.사주)
        self.일주.지지.신살 = 신살.find(self.일주.지지.십이지, self.사주)
        if self.시주 is not None:
            self.시주.지지.신살 = 신살.find(self.시주.지지.십이지, self.사주)

        self.원진살 = 원진살.원진살.find(self.지지목록)
        self.일주공망 = 공망.공망.from_(
            {"십간": self.일주.천간.십간, "십이지": self.일주.지지.십이지},
            self.지지목록,
        )

        birth_date_str = self.birthDate.strftime("%Y-%m-%d")
        birth_time_str = self.birthTime.strftime("%H:%M") if self.birthTime else None
        self.대운흐름 = 대운.대운흐름.create(self.gender, birth_date_str, birth_time_str)

    @property
    def 사주(self) -> dict:
        return {
            "연주": self.연주,
            "월주": self.월주,
            "일주": self.일주,
            "시주": self.시주,
        }

    @property
    def 천간목록(self) -> List[천간.천간]:
        return [self.연주.천간, self.월주.천간, self.일주.천간] + (
            [self.시주.천간] if self.시주 else []
        )

    @property
    def 지지목록(self) -> List[지지.지지]:
        return [self.연주.지지, self.월주.지지, self.일주.지지] + (
            [self.시주.지지] if self.시주 else []
        )

    @property
    def 십신목록(self) -> List[십신.십신]:
        result = [
            self.연주.천간.십신,
            self.월주.천간.십신,
            self.일주.천간.십신,
            self.연주.지지.십신,
            self.월주.지지.십신,
            self.일주.지지.십신,
        ]
        if self.시주:
            result.append(self.시주.천간.십신)
            result.append(self.시주.지지.십신)
        return result

    @property
    def 연간(self) -> 십간.십간:
        return self.연주.천간.십간

    @property
    def 연지(self) -> 십이지.십이지:
        return self.연주.지지.십이지

    @property
    def 월간(self) -> 십간.십간:
        return self.월주.천간.십간

    @property
    def 월지(self) -> 십이지.십이지:
        return self.월주.지지.십이지

    @property
    def 일간(self) -> 십간.십간:
        return self.일주.천간.십간

    @property
    def 일지(self) -> 십이지.십이지:
        return self.일주.지지.십이지

    @property
    def 시간(self) -> Optional[십간.십간]:
        return self.시주.천간.십간 if self.시주 else None

    @property
    def 시지(self) -> Optional[십이지.십이지]:
        return self.시주.지지.십이지 if self.시주 else None

    def find오행From십신(self, 십신: 십신.십신) -> Optional[오행.오행]:
        for 천간 in self.천간목록:
            if 천간.십신 == 십신:
                return 천간.십간.오행
        for 지지 in self.지지목록:
            if 지지.십신 == 십신:
                return 지지.십이지.오행
        return None

    def count십신(self, 십신: 십신.십신) -> int:
        return sum(1 for s in self.십신목록 if s == 십신)
