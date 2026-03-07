# 십신 (love-teller 십신.ts)

from dataclasses import dataclass
from typing import Literal, Protocol

from .음양 import 음양
from .오행 import 오행


class 음양오행(Protocol):
    """십간/십이지 공통 (음양, 오행 속성)."""
    음양: 음양
    오행: 오행


@dataclass(frozen=True)
class 십신:
    value: Literal[
        "비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"
    ]

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, 십신):
            return False
        return self.value == other.value

    @staticmethod
    def from음양오행(나: "음양오행", 상대: "음양오행") -> "십신":
        from .오행 import 오행
        equalList = [십신.비견, 십신.식신, 십신.편재, 십신.편관, 십신.편인]
        diffList = [십신.겁재, 십신.상관, 십신.정재, 십신.정관, 십신.정인]
        나인덱스 = 오행.list().index(나.오행)
        상대인덱스 = 오행.list().index(상대.오행)
        diff = ((상대인덱스 - 나인덱스) % 5 + 5) % 5
        십신목록 = equalList if 나.음양 == 상대.음양 else diffList
        return 십신목록[diff]

    @staticmethod
    def findPair(pair: Literal["인성", "재성", "관성", "식상", "비겁"]) -> list["십신"]:
        if pair == "인성":
            return [십신.편인, 십신.정인]
        if pair == "재성":
            return [십신.정재, 십신.편재]
        if pair == "관성":
            return [십신.정관, 십신.편관]
        if pair == "식상":
            return [십신.식신, 십신.상관]
        if pair == "비겁":
            return [십신.비견, 십신.겁재]
        raise ValueError(f"Unknown pair: {pair}")


# 인스턴스
십신.비견 = 십신("비견")  # type: ignore[misc]
십신.겁재 = 십신("겁재")  # type: ignore[misc]
십신.식신 = 십신("식신")  # type: ignore[misc]
십신.상관 = 십신("상관")  # type: ignore[misc]
십신.편재 = 십신("편재")  # type: ignore[misc]
십신.정재 = 십신("정재")  # type: ignore[misc]
십신.편관 = 십신("편관")  # type: ignore[misc]
십신.정관 = 십신("정관")  # type: ignore[misc]
십신.편인 = 십신("편인")  # type: ignore[misc]
십신.정인 = 십신("정인")  # type: ignore[misc]
