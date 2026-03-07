# 오행 (love-teller 오행.ts)

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class 오행:
    value: Literal["목", "화", "토", "금", "수"]
    한자: Literal["木", "火", "土", "金", "水"]
    의미: str

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, 오행):
            return False
        return self.value == other.value

    def equals(self, other: "오행") -> bool:
        return self.value == other.value

    def get아생오행(self) -> "오행":
        if self.value == "목":
            return 오행.화
        if self.value == "화":
            return 오행.토
        if self.value == "토":
            return 오행.금
        if self.value == "금":
            return 오행.수
        return 오행.목

    def get아극오행(self) -> "오행":
        if self.value == "목":
            return 오행.수
        if self.value == "화":
            return 오행.목
        if self.value == "토":
            return 오행.화
        if self.value == "금":
            return 오행.토
        return 오행.금

    def get생아오행(self) -> "오행":
        if self.value == "목":
            return 오행.수
        if self.value == "화":
            return 오행.목
        if self.value == "토":
            return 오행.화
        if self.value == "금":
            return 오행.토
        return 오행.금

    def get극아오행(self) -> "오행":
        if self.value == "목":
            return 오행.금
        if self.value == "화":
            return 오행.수
        if self.value == "토":
            return 오행.목
        if self.value == "금":
            return 오행.화
        return 오행.토

    @staticmethod
    def list() -> list["오행"]:
        return [오행.목, 오행.화, 오행.토, 오행.금, 오행.수]


# 십간/십이지에서 참조하므로 여기서 인스턴스 생성
오행.목 = 오행("목", "木", "성장, 생명력, 교육, 인자함, 계획")  # type: ignore[misc]
오행.화 = 오행("화", "火", "열정, 밝음, 예의 창조력, 추진력")  # type: ignore[misc]
오행.토 = 오행("토", "土", "중앙, 중재, 안정성, 신용")  # type: ignore[misc]
오행.금 = 오행("금", "金", "결실, 의리, 강인함, 권위")  # type: ignore[misc]
오행.수 = 오행("수", "水", "지혜, 유연성, 흐름, 활동성, 역마")  # type: ignore[misc]
