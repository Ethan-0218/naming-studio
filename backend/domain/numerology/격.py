# 단일 격 (81수리 한 개)

from dataclasses import dataclass
from typing import Literal

Level = Literal["大凶", "凶", "中凶", "中吉", "吉", "大吉"]
GenderKey = Literal["male", "female"]

_SCORE: dict[Level, int] = {
    "大吉": 10,
    "吉": 8,
    "中吉": 4,
    "中凶": 2,
    "凶": 0,
    "大凶": -5,
}


@dataclass(frozen=True)
class 격:
    """81수리 한 개의 격. stroke_count % 81로 수를 정하고, 성별에 따라 level/점수/이름/해석 반환."""

    level: Level
    score: int
    name1: str
    name2: str
    interpretation: str

    @classmethod
    def from_stroke_count(cls, stroke_count: int, gender: GenderKey) -> "격":
        """획수 합계와 성별로 격을 계산합니다. 내부용 성별은 'male'/'female'."""
        from .수리격_데이터 import load_수리격

        data = load_수리격()
        key = str(stroke_count % 81)
        row = data[key]
        level = row["level"][gender]
        score = _SCORE[level]
        return cls(
            level=level,
            score=score,
            name1=row["name1"],
            name2=row["name2"],
            interpretation=row["interpretation"],
        )

    def to_dict(self) -> dict:
        return {
            "level": self.level,
            "name1": self.name1,
            "name2": self.name2,
        }
