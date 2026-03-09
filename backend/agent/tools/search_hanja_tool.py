"""한자 검색 툴."""

from db.hanja_repository import HanjaRepository


def search_hanja(eum: str, limit: int = 20) -> list[dict]:
    """음절(eum)로 한자를 검색합니다.

    반환: hanja, mean, pronunciation_five_elements, stroke 목록
    """
    repo = HanjaRepository()
    results = repo.search_by_eum(eum, limit=limit)
    return [
        {
            "hanja": h.hanja,
            "mean": h.mean,
            "eum": h.eum,
            "pronunciation_five_elements": h.pronunciation_five_elements,
            "stroke": h.original_stroke_count,
            "usage_count": h.usage_count,
            "is_family_hanja": h.is_family_hanja,
        }
        for h in results
    ]
