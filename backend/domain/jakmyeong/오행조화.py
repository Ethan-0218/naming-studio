# 작명학 오행 조화 판단. 인접 쌍(성-이름1, 이름1-이름2)의 상생/동일/상극으로 대길·반길·대흉 판정.
# 계획: 대길(상생 주), 반길(상생·상극 혼합 또는 전부 동일), 대흉(상극만 또는 과다)

from dataclasses import dataclass
from typing import Literal, Optional

from domain.saju.오행 import 오행


Relation = Literal["상생", "동일", "상극"]
Level = Literal["대길", "반길", "대흉"]

_SCORE: dict[Relation, int] = {"상생": 2, "동일": 0, "상극": -2}


def _relation(a: 오행, b: 오행) -> Relation:
    if a.equals(b):
        return "동일"
    if b.equals(a.get아생오행()):
        return "상생"
    # 상극: B가 A를 극(金克木) 또는 A가 B를 극(火克金)
    if b.equals(a.get극아오행()) or a.equals(b.get극아오행()):
        return "상극"
    return "동일"


@dataclass(frozen=True)
class 쌍별_결과:
    """인접 두 글자의 오행 관계와 점수."""

    앞_오행: 오행
    뒤_오행: 오행
    relation: Relation
    score: int


@dataclass(frozen=True)
class 오행조화:
    """이름(성+이름1+이름2 또는 성+이름1)의 오행 조화. 글자별 오행을 받아 쌍별 상생/동일/상극과 대길·반길·대흉 등급 반환."""

    글자별_오행: tuple[오행, ...]
    쌍별_결과: tuple[쌍별_결과, ...]
    total_score: int
    level: Level
    harmonious: bool
    reason: str

    @classmethod
    def from_오행(
        cls,
        성_오행: 오행,
        이름1_오행: 오행,
        이름2_오행: Optional[오행] = None,
    ) -> "오행조화":
        """
        성·이름1·이름2(선택)의 오행으로 조화를 판단합니다.
        인접 쌍: (성, 이름1), (이름1, 이름2). 각 쌍에 상생 +2, 동일 0, 상극 -2.
        등급: 상극 없음+상생 있음 → 대길; 상극 있음 → 전부 상극이면 대흉 else 반길; 전부 동일 → 반길.
        """
        if 이름2_오행 is None:
            글자별 = (성_오행, 이름1_오행)
            pairs: list[tuple[오행, 오행]] = [(성_오행, 이름1_오행)]
        else:
            글자별 = (성_오행, 이름1_오행, 이름2_오행)
            pairs = [(성_오행, 이름1_오행), (이름1_오행, 이름2_오행)]

        results: list[쌍별_결과] = []
        for 앞, 뒤 in pairs:
            rel = _relation(앞, 뒤)
            results.append(쌍별_결과(앞_오행=앞, 뒤_오행=뒤, relation=rel, score=_SCORE[rel]))
        쌍별 = tuple(results)
        total_score = sum(r.score for r in 쌍별)

        상생수 = sum(1 for r in 쌍별 if r.relation == "상생")
        상극수 = sum(1 for r in 쌍별 if r.relation == "상극")

        harmonious = 상극수 == 0
        if 상극수 > 0:
            level: Level = "대흉" if 상극수 == len(쌍별) else "반길"
        elif 상생수 >= 1:
            level = "대길"
        else:
            level = "반길"

        reason_parts = [f"{r.앞_오행.value}-{r.뒤_오행.value} {r.relation}" for r in 쌍별]
        reason = ", ".join(reason_parts)
        return cls(
            글자별_오행=글자별,
            쌍별_결과=쌍별,
            total_score=total_score,
            level=level,
            harmonious=harmonious,
            reason=reason,
        )
