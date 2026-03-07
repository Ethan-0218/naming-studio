# 성별 (love-teller 성별.ts)

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class 성별:
    value: Literal["남", "여"]

    def toPrompt(self) -> str:
        return self.value

    @staticmethod
    def fromString(value: Literal["남", "여"]) -> "성별":
        if value == "남":
            return 성별.남
        return 성별.여


성별.남 = 성별("남")  # type: ignore[misc]
성별.여 = 성별("여")  # type: ignore[misc]
