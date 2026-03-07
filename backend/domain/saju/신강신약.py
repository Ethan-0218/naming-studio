# 신강신약 (love-teller 신강신약.ts)

from typing import TYPE_CHECKING

from . import 십신

if TYPE_CHECKING:
    from .사주팔자 import 사주팔자


class 신강신약:
    def __init__(self, type_: str, 해석: str = ""):
        self.type = type_
        self.해석 = 해석

    def 신강한가(self) -> bool:
        return self in [
            신강신약.극왕,
            신강신약.태강,
            신강신약.신강,
            신강신약.중화신강,
        ]

    def 신약한가(self) -> bool:
        return self in [
            신강신약.중화신약,
            신강신약.신약,
            신강신약.태약,
            신강신약.극약,
        ]

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, 신강신약):
            return False
        return self.type == other.type

    @staticmethod
    def from사주팔자(사주: "사주팔자") -> "신강신약":
        신강_십신_list = [십신.십신.비견, 십신.십신.겁재, 십신.십신.정인, 십신.십신.편인]
        신약_십신_list = [
            십신.십신.식신,
            십신.십신.상관,
            십신.십신.정재,
            십신.십신.편재,
            십신.십신.정관,
            십신.십신.편관,
        ]

        월지 = 사주.월주.지지
        일지 = 사주.일주.지지
        연지 = 사주.연주.지지
        시지 = 사주.시주.지지 if 사주.시주 else None
        월간 = 사주.월주.천간
        연간 = 사주.연주.천간
        시간 = 사주.시주.천간 if 사주.시주 else None

        def check득세() -> bool:
            score = 0
            if 월지.십신 in 신강_십신_list:
                score += 1
            elif 월지.십신 in 신약_십신_list:
                score -= 1
            if 일지.십신 in 신강_십신_list:
                score += 1
            elif 일지.십신 in 신약_십신_list:
                score -= 1
            if 연지.십신 in 신강_십신_list:
                score += 1
            elif 연지.십신 in 신약_십신_list:
                score -= 1
            if 시지 and 시지.십신 in 신강_십신_list:
                score += 1
            elif 시지 and 시지.십신 in 신약_십신_list:
                score -= 1
            if 월간.십신 in 신강_십신_list:
                score += 1
            elif 월간.십신 in 신약_십신_list:
                score -= 1
            if 연간.십신 in 신강_십신_list:
                score += 1
            elif 연간.십신 in 신약_십신_list:
                score -= 1
            if 시간 and 시간.십신 in 신강_십신_list:
                score += 1
            elif 시간 and 시간.십신 in 신약_십신_list:
                score -= 1
            return score > 0

        is득령 = 월지.십신 in 신강_십신_list
        is득지 = 일지.십신 in 신강_십신_list
        is득세 = check득세()

        if is득령 and is득지 and is득세:
            return 신강신약.극왕
        if is득령 and is득지:
            return 신강신약.태강
        if is득령 and is득세:
            return 신강신약.신강
        if is득지 and is득세:
            return 신강신약.중화신강
        if is득령:
            return 신강신약.중화신약
        if is득지:
            return 신강신약.신약
        if is득세:
            return 신강신약.태약
        return 신강신약.극약


신강신약.극왕 = 신강신약("극왕")  # type: ignore[attr-defined]
신강신약.태강 = 신강신약("태강")  # type: ignore[attr-defined]
신강신약.신강 = 신강신약("신강")  # type: ignore[attr-defined]
신강신약.중화신강 = 신강신약("중화신강")  # type: ignore[attr-defined]
신강신약.중화신약 = 신강신약("중화신약")  # type: ignore[attr-defined]
신강신약.신약 = 신강신약("신약")  # type: ignore[attr-defined]
신강신약.태약 = 신강신약("태약")  # type: ignore[attr-defined]
신강신약.극약 = 신강신약("극약")  # type: ignore[attr-defined]
