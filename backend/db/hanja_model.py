# hanja 테이블 1행을 표현하는 모델
# 수리오행: 원획(原劃) 기준. 일의 자리 1·2→목, 3·4→화, 5·6→토, 7·8→금, 9·0→수

from dataclasses import dataclass, field


def _stroke_to_five_elements(stroke: int) -> str:
    """획수 일의 자리로 수리오행 반환. 1·2=목, 3·4=화, 5·6=토, 7·8=금, 9·0=수."""
    r = stroke % 10
    if r in (1, 2):
        return "목"
    if r in (3, 4):
        return "화"
    if r in (5, 6):
        return "토"
    if r in (7, 8):
        return "금"
    # 9 or 0
    return "수"


@dataclass(frozen=True)
class Hanja:
    id: int
    hanja: str
    mean: str
    eum: str
    sub_hanja: str
    detail: str
    original_stroke_count: int | None
    dictionary_stroke_count: int | None
    sound_based_yin_yang: str
    stroke_based_yin_yang: str
    pronunciation_five_elements: str
    character_five_elements: str
    english: str
    usage_count: int | None
    is_family_hanja: bool
    stroke_five_elements: str = field(default="", init=False)

    def __post_init__(self) -> None:
        # 성명학 수리오행은 원획법 기준(작명 99% 사용). 원획 우선, 없으면 옥편획수 사용
        stroke = self.original_stroke_count if self.original_stroke_count is not None else self.dictionary_stroke_count
        if stroke is not None:
            object.__setattr__(self, "stroke_five_elements", _stroke_to_five_elements(stroke))
