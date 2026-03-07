# hanja 테이블 1행을 표현하는 모델

from dataclasses import dataclass


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
