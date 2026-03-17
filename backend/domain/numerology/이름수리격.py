# 이름 수리격 (원형이정 4격)

from dataclasses import dataclass
from typing import Optional

from .격 import 격

GenderKey = str  # "male" | "female"


@dataclass
class 이름수리격:
    """원격·형격·이격·정격 4격과 총점. 입력은 획수 3개(외자 시 이름2 생략) + 성별."""

    원격: 격
    형격: 격
    이격: 격
    정격: 격
    total_score: float  # 4格 score [0, 1] 평균

    @classmethod
    def from_strokes(
        cls,
        성_획수: int,
        이름1_획수: int,
        이름2_획수: Optional[int],
        gender: GenderKey,
    ) -> "이름수리격":
        """
        획수 3개와 성별로 이름 수리격을 계산합니다.
        - 이름2_획수가 None이면 외자(이름 한 글자): 원격 = 이름1×2, 형격=이격=정격 = 성+이름1.
        - 그렇지 않으면: 원격 = 이름1+이름2, 형격 = 성+이름1, 이격 = 성+이름2, 정격 = 성+이름1+이름2.
        gender는 'male' 또는 'female'.
        """
        if 이름2_획수 is None:
            # 외자
            원격_합 = 이름1_획수 + 이름1_획수
            형격_합 = 성_획수 + 이름1_획수
            이격_합 = 성_획수 + 이름1_획수
            정격_합 = 성_획수 + 이름1_획수
        else:
            원격_합 = 이름1_획수 + 이름2_획수
            형격_합 = 성_획수 + 이름1_획수
            이격_합 = 성_획수 + 이름2_획수
            정격_합 = 성_획수 + 이름1_획수 + 이름2_획수

        원격 = 격.from_stroke_count(원격_합, gender)
        형격 = 격.from_stroke_count(형격_합, gender)
        이격 = 격.from_stroke_count(이격_합, gender)
        정격 = 격.from_stroke_count(정격_합, gender)
        total_score = (원격.score + 형격.score + 이격.score + 정격.score) / 4
        return cls(원격=원격, 형격=형격, 이격=이격, 정격=정격, total_score=total_score)

    def to_dict(self) -> dict:
        """API 호환 (원격/형격/이격/정격 각각 to_dict)."""
        return {
            "원격": self.원격.to_dict(),
            "형격": self.형격.to_dict(),
            "이격": self.이격.to_dict(),
            "정격": self.정격.to_dict(),
        }
