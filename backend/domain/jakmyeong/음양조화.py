# 성명학의 음양 조화 판단. (입력은 인명용 한자 등에서 제공하는 음양을 받음.)
#
# [참고 1] 성명학의 음양오행론 (박재범작명역학연구원)
# http://www.finename.co.kr/gnu/bbs/tb.php/m21/7
# - 이름 석자의 한자 획수로 음양 구분: 홀수=양, 짝수=음.
# - 음음음 또는 양양양으로만 구성되면 음양이 한쪽으로 치우쳐 좋지 않음.
#   예: 김명수(金明洙) 8·8·10획 → 모두 짝수(음) → 피해야 하는 구성.
#
# [참고 2] 제값하는이름 (우먼센스)
# https://www.womansense.co.kr/news/articleView.html?idxno=12157
# - 획수음양: 각 글자 획수 홀수=양, 짝수=음. 음과 양이 섞여 조화를 이룰 때 좋은 이름.

from dataclasses import dataclass
from typing import Optional

from domain.saju.음양 import 음양
from domain.jakmyeong.음양조화_데이터 import get_음양조화_데이터


@dataclass(frozen=True)
class 음양조화:
    """이름(성+이름1+이름2 또는 성+이름1)의 음양 조화 여부. 인명용 한자 등에서 제공하는 음양을 받아 판단."""

    harmonious: bool
    글자별_음양: tuple[음양, ...]
    reason: str
    level: str        # 吉 / 凶
    description: str

    @classmethod
    def from_yin_yang(
        cls,
        성_음양: 음양,
        이름1_음양: 음양,
        이름2_음양: Optional[음양] = None,
    ) -> "음양조화":
        """
        성·이름1·이름2(선택)의 음양으로 조화 여부를 판단합니다.
        - 이름2_음양이 None이면 외자: 성+이름1 두 글자 기준. 1:1(음양/양음)이면 조화.
        - 그렇지 않으면 세 글자 기준. 2:1 비율(음양이 섞인 경우)이면 조화, 음음음/양양양은 불조화.
        """
        if 이름2_음양 is None:
            글자별 = (성_음양, 이름1_음양)
            # 2글자: (음,양) 또는 (양,음) → 조화
            harmonious = 성_음양 != 이름1_음양
            if harmonious:
                reason = "두 글자 음양 1:1 조화"
            else:
                same = "음" if 성_음양 == 음양.음 else "양"
                reason = f"두 글자 모두 {same}({same}{same})으로 불조화"
        else:
            글자별 = (성_음양, 이름1_음양, 이름2_음양)
            음수 = sum(1 for y in 글자별 if y == 음양.음)
            양수 = sum(1 for y in 글자별 if y == 음양.양)
            # 2:1 비율이면 조화, 3:0이면 불조화
            harmonious = (음수 == 2 and 양수 == 1) or (음수 == 1 and 양수 == 2)
            if harmonious:
                reason = "세 글자 음양 2:1 조화"
            else:
                if 음수 == 3:
                    reason = "세 글자 모두 음(음음음)으로 불조화"
                else:
                    reason = "세 글자 모두 양(양양양)으로 불조화"
        key = "".join(y.value for y in 글자별)
        data = get_음양조화_데이터(key)
        level = data["rating"] if data else ("吉" if harmonious else "凶")
        description = data["description"] if data else ""
        return cls(harmonious=harmonious, 글자별_음양=글자별, reason=reason, level=level, description=description)
