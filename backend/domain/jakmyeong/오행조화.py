# 작명학 오행 조화 판단.
# 3글자 이름: naming-studio/data/오행조화.json의 5단계 등급(大吉/吉/平/凶/大凶) 사용.
# 2글자 이름(이름2_오행=None): 인접 쌍 상생/동일/상극 알고리즘 폴백.

from dataclasses import dataclass
from typing import Literal, Optional

import domain.rating_score as rating_score
from domain.saju.오행 import 오행
from domain.jakmyeong.오행조화_데이터 import get_오행조화_데이터


Relation = Literal["상생", "동일", "상극"]
Level = Literal["大吉", "吉", "平", "凶", "大凶"]


@dataclass(frozen=True)
class 쌍별_결과:
    """인접 두 글자의 오행 관계."""

    앞_오행: 오행
    뒤_오행: 오행
    relation: Relation


@dataclass(frozen=True)
class 오행조화:
    """이름(성+이름1+이름2 또는 성+이름1)의 오행 조화."""

    글자별_오행: tuple[오행, ...]
    쌍별_결과: tuple[쌍별_결과, ...]
    total_score: float   # [0, 1] — rating_scores.json 기준
    level: Level
    harmonious: bool   # 상극 없음 여부
    reason: str        # 기계적 이유 (예: "목-화 상생, 화-토 상생")
    description: str   # JSON 기반 한국어 설명 (3글자 이름) 또는 "" (2글자 폴백)

    @classmethod
    def from_오행(
        cls,
        성_오행: 오행,
        이름1_오행: 오행,
        이름2_오행: Optional[오행] = None,
    ) -> "오행조화":
        """
        성·이름1·이름2(선택)의 오행으로 조화를 판단합니다.

        3글자 이름: data/오행조합.json 조회 → 5단계 등급 + 설명 반환.
        2글자 이름: 인접 쌍 알고리즘(상생/동일/상극) 폴백.
        """
        if 이름2_오행 is None:
            # ── 2글자 폴백 ──────────────────────────────────────────────────
            글자별 = (성_오행, 이름1_오행)
            pairs: list[tuple[오행, 오행]] = [(성_오행, 이름1_오행)]

            results: list[쌍별_결과] = []
            for 앞, 뒤 in pairs:
                rel = _relation(앞, 뒤)
                results.append(쌍별_결과(앞_오행=앞, 뒤_오행=뒤, relation=rel))
            쌍별 = tuple(results)

            상생수 = sum(1 for r in 쌍별 if r.relation == "상생")
            상극수 = sum(1 for r in 쌍별 if r.relation == "상극")

            harmonious = 상극수 == 0
            if 상극수 > 0:
                level: Level = "平" if 상극수 < len(쌍별) else "大凶"
            elif 상생수 >= 1:
                level = "大吉"
            else:
                level = "平"

            description = ""

        else:
            # ── 3글자: JSON 조회 ────────────────────────────────────────────
            글자별 = (성_오행, 이름1_오행, 이름2_오행)
            pairs_3: list[tuple[오행, 오행]] = [(성_오행, 이름1_오행), (이름1_오행, 이름2_오행)]

            results_3: list[쌍별_결과] = []
            for 앞, 뒤 in pairs_3:
                rel = _relation(앞, 뒤)
                results_3.append(쌍별_결과(앞_오행=앞, 뒤_오행=뒤, relation=rel))
            쌍별 = tuple(results_3)

            상극수 = sum(1 for r in 쌍별 if r.relation == "상극")
            harmonious = 상극수 == 0

            combo = get_오행조화_데이터(성_오행.value, 이름1_오행.value, 이름2_오행.value)
            if combo:
                level = combo["rating"]  # type: ignore[assignment]
                description = combo["description"]
            else:
                # JSON에서 찾지 못한 경우 알고리즘 폴백
                상생수 = sum(1 for r in 쌍별 if r.relation == "상생")
                if 상극수 > 0:
                    level = "平" if 상극수 < len(쌍별) else "大凶"
                elif 상생수 >= 1:
                    level = "大吉"
                else:
                    level = "平"
                description = ""

        total_score = rating_score.to_score(level)

        reason_parts = [f"{r.앞_오행.value}-{r.뒤_오행.value} {r.relation}" for r in 쌍별]
        reason = ", ".join(reason_parts)

        return cls(
            글자별_오행=글자별,
            쌍별_결과=쌍별,
            total_score=total_score,
            level=level,
            harmonious=harmonious,
            reason=reason,
            description=description,
        )


def _relation(a: 오행, b: 오행) -> Relation:
    if a.equals(b):
        return "동일"
    if b.equals(a.get아생오행()):
        return "상생"
    if b.equals(a.get극아오행()) or a.equals(b.get극아오행()):
        return "상극"
    return "동일"
