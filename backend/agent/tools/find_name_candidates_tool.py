"""이름 후보 검색 툴."""

from domain.saju.성별 import 성별
from domain.jakmyeong.발음오행 import 발음오행_from_초성
from domain.jakmyeong.오행조화 import 오행조화
from domain.saju.오행 import 오행
from db.registered_name_repository import RegisteredNameRepository
from db.hanja_repository import HanjaRepository
from agent import name_store


def _get_surname_오행(surname: str) -> 오행 | None:
    from domain.jakmyeong.발음오행 import 발음오행_from_초성
    if not surname:
        return None
    return 발음오행_from_초성(surname[0])


def _best_hanja_for(syllable: str, hanja_repo: HanjaRepository) -> dict | None:
    """음절에 맞는 최적 한자를 usage_count 기준으로 선택합니다."""
    results = hanja_repo.search_by_eum(syllable, limit=20)
    # 이름용 한자만 필터 (is_family_hanja=False)
    name_hanja = [h for h in results if not h.is_family_hanja]
    if not name_hanja:
        name_hanja = results
    if not name_hanja:
        return None
    best = max(name_hanja, key=lambda h: h.usage_count or 0)
    return {
        "한자": best.hanja,
        "meaning": best.mean,
        "오행": best.pronunciation_five_elements or "",
        "stroke": best.original_stroke_count,
    }


def find_name_candidates(
    surname: str,
    gender: str,  # "남" | "여"
    session_id: str,
    preferred_오행: str | None = None,
    require_받침: str | None = None,  # "있음" | "없음" | None
    rarity_preference: str | None = None,  # "희귀" | "보통" | "흔한"
    limit: int = 8,
    pool_size: int = 500,
) -> list[dict]:
    """등록명 DB에서 이름 후보를 가져와 발음오행/조화 계산 후 상위 후보를 반환합니다."""
    gender_obj = 성별.여 if gender == "여" else 성별.남
    name_repo = RegisteredNameRepository()
    hanja_repo = HanjaRepository()

    disliked = set(name_store.get_disliked(session_id))
    liked = set(name_store.get_liked(session_id))
    exclude = disliked | liked  # 이미 반응한 이름은 제외

    pool = name_repo.find_by_gender(gender_obj, limit=pool_size)

    surname_오행 = _get_surname_오행(surname)

    scored: list[tuple[float, dict]] = []
    for rn in pool:
        name = rn.name
        if name in exclude:
            continue

        # 받침 필터
        if require_받침 == "없음":
            if any((ord(c) - 0xAC00) % 28 != 0 for c in name if 0xAC00 <= ord(c) <= 0xD7A3):
                continue
        elif require_받침 == "있음":
            if not any((ord(c) - 0xAC00) % 28 != 0 for c in name if 0xAC00 <= ord(c) <= 0xD7A3):
                continue

        # 음절별 발음오행 계산
        syllable_오행_list: list[오행 | None] = [발음오행_from_초성(c) for c in name]

        # 오행 조화 계산 (성씨 기준)
        harmony_score = 0
        harmony_level = "반길"
        harmony_reason = ""
        if surname_오행 and len(name) >= 1:
            첫음절_오행 = syllable_오행_list[0]
            두번째_오행 = syllable_오행_list[1] if len(name) >= 2 else None
            if 첫음절_오행:
                harmony = 오행조화.from_오행(surname_오행, 첫음절_오행, 두번째_오행)
                harmony_score = harmony.total_score
                harmony_level = harmony.level
                harmony_reason = harmony.reason

        # preferred_오행 필터
        if preferred_오행:
            has_preferred = any(
                o is not None and o.value == preferred_오행
                for o in syllable_오행_list
            )
            if not has_preferred:
                continue

        # 희귀도 기준 점수 (count가 낮을수록 희귀)
        rarity_score = 0.0
        if rarity_preference == "희귀":
            rarity_score = -rn.count
        elif rarity_preference == "흔한":
            rarity_score = rn.count
        else:
            rarity_score = 0.0

        total_score = harmony_score + rarity_score * 0.001

        # 음절별 한자 선택
        syllables = []
        for i, char in enumerate(name):
            hanja_info = _best_hanja_for(char, hanja_repo)
            s_오행 = syllable_오행_list[i]
            syllables.append({
                "한글": char,
                "한자": hanja_info["한자"] if hanja_info else "",
                "meaning": hanja_info["meaning"] if hanja_info else "",
                "오행": s_오행.value if s_오행 else "",
                "hanja_options": [],
            })

        candidate = {
            "한글": name,
            "full_name": surname + name,
            "syllables": syllables,
            "발음오행_조화": harmony_level,
            "발음오행_조화_이유": harmony_reason,
            "rarity_signal": "희귀" if rn.count < 100 else ("보통" if rn.count < 1000 else "흔한"),
            "reason": "",
        }
        scored.append((total_score, candidate))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:limit]]
