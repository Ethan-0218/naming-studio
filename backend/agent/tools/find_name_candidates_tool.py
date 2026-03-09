"""이름 후보 검색 툴."""

from domain.saju.성별 import 성별
from domain.jakmyeong.발음오행 import 발음오행_from_초성
from domain.jakmyeong.오행조화 import 오행조화
from domain.jakmyeong.음양조화 import 음양조화
from domain.numerology.이름수리격 import 이름수리격
from domain.saju.오행 import 오행
from domain.saju.음양 import 음양
from db.registered_name_repository import RegisteredNameRepository
from db.hanja_repository import HanjaRepository
from db.hanja_model import Hanja
from agent import name_store


def _get_surname_오행(surname: str) -> 오행 | None:
    if not surname:
        return None
    return 발음오행_from_초성(surname[0])


def _best_hanja_for(syllable: str, hanja_repo: HanjaRepository) -> Hanja | None:
    """음절에 맞는 최적 한자를 usage_count 기준으로 선택합니다."""
    results = hanja_repo.search_by_eum(syllable, limit=20)
    name_hanja = [h for h in results if not h.is_family_hanja] or results
    if not name_hanja:
        return None
    return max(name_hanja, key=lambda h: h.usage_count or 0)


def _get_surname_hanja(surname_hanja_char: str, hanja_repo: HanjaRepository) -> Hanja | None:
    if not surname_hanja_char:
        return None
    return hanja_repo.get_by_hanja(surname_hanja_char)


def _parse_음양(s: str) -> 음양 | None:
    if s == "음":
        return 음양.음
    if s == "양":
        return 음양.양
    return None


def _자원오행_score(성_hanja: Hanja | None, name_hanjas: list[Hanja | None]) -> float:
    """한자 자원오행 조화 점수 (0~1). character_five_elements 기준."""
    성_오행 = 오행.from_string(성_hanja.character_five_elements) if 성_hanja else None
    name_오행s = [오행.from_string(h.character_five_elements) if h else None for h in name_hanjas]

    성_o = 성_오행
    이름1_o = name_오행s[0] if name_오행s else None
    이름2_o = name_오행s[1] if len(name_오행s) >= 2 else None

    if 성_o is None or 이름1_o is None:
        return 0.5

    try:
        harmony = 오행조화.from_오행(성_o, 이름1_o, 이름2_o)
        return (harmony.total_score + 4) / 8
    except Exception:
        return 0.5


def _수리격_score(성_hanja: Hanja | None, name_hanjas: list[Hanja | None], gender: str) -> float:
    """81수리 이름수리격 점수 (0~1)."""
    def _stroke(h: Hanja | None) -> int | None:
        if h is None:
            return None
        return h.original_stroke_count if h.original_stroke_count is not None else h.dictionary_stroke_count

    성_s = _stroke(성_hanja)
    이름1_s = _stroke(name_hanjas[0]) if name_hanjas else None
    이름2_s = _stroke(name_hanjas[1]) if len(name_hanjas) >= 2 else None

    if 성_s is None or 이름1_s is None:
        return 0.5

    gender_key = "female" if gender == "여" else "male"
    try:
        nr = 이름수리격.from_strokes(성_s, 이름1_s, 이름2_s, gender_key)
        if nr.has_worst_numerology():
            return 0.0
        if nr.has_bad_numerology():
            return 0.2
        return (nr.total_score + 20) / 60
    except Exception:
        return 0.5


def _발음음양_score(성_hanja: Hanja | None, name_hanjas: list[Hanja | None]) -> float:
    """발음 음양 조화 점수 (0 or 1)."""
    성_yin = _parse_음양(성_hanja.sound_based_yin_yang) if 성_hanja else None
    name_yins = [_parse_음양(h.sound_based_yin_yang) if h else None for h in name_hanjas]

    이름1_yin = name_yins[0] if name_yins else None
    이름2_yin = name_yins[1] if len(name_yins) >= 2 else None

    if 성_yin is None or 이름1_yin is None:
        return 0.5

    try:
        harmony = 음양조화.from_yin_yang(성_yin, 이름1_yin, 이름2_yin)
        return 1.0 if harmony.harmonious else 0.0
    except Exception:
        return 0.5


def _획수음양_score(성_hanja: Hanja | None, name_hanjas: list[Hanja | None]) -> float:
    """획수 음양 조화 점수 (0 or 1)."""
    성_yin = _parse_음양(성_hanja.stroke_based_yin_yang) if 성_hanja else None
    name_yins = [_parse_음양(h.stroke_based_yin_yang) if h else None for h in name_hanjas]

    이름1_yin = name_yins[0] if name_yins else None
    이름2_yin = name_yins[1] if len(name_yins) >= 2 else None

    if 성_yin is None or 이름1_yin is None:
        return 0.5

    try:
        harmony = 음양조화.from_yin_yang(성_yin, 이름1_yin, 이름2_yin)
        return 1.0 if harmony.harmonious else 0.0
    except Exception:
        return 0.5


def _용신_score(
    name_hanjas: list[Hanja | None],
    syllable_오행_list: list,
    부족한_오행: list[str],
) -> float:
    """사주 부족 오행 보완 점수 (0 or 1). 부족한 오행이 없으면 중립 0.5."""
    if not 부족한_오행:
        return 0.5

    name_오행_set: set[str] = set()
    for h in name_hanjas:
        if h and h.character_five_elements:
            name_오행_set.add(h.character_five_elements)
    for o in syllable_오행_list:
        if o is not None:
            name_오행_set.add(o.value)

    return 1.0 if any(o in name_오행_set for o in 부족한_오행) else 0.0


def find_name_candidates(
    surname: str,
    gender: str,  # "남" | "여"
    session_id: str,
    surname_hanja: str = "",
    부족한_오행: list[str] | None = None,
    preferred_오행: str | None = None,
    require_받침: str | None = None,  # "있음" | "없음" | None
    rarity_preference: str | None = None,  # "희귀" | "보통" | "흔한"
    limit: int = 8,
    pool_size: int = 500,
) -> list[dict]:
    """등록명 DB에서 이름 후보를 가져와 종합 점수 계산 후 상위 후보를 반환합니다."""
    gender_obj = 성별.여 if gender == "여" else 성별.남
    name_repo = RegisteredNameRepository()
    hanja_repo = HanjaRepository()

    disliked = set(name_store.get_disliked(session_id))
    liked = set(name_store.get_liked(session_id))
    exclude = disliked | liked

    pool = name_repo.find_by_gender(gender_obj, limit=pool_size)

    surname_오행 = _get_surname_오행(surname)
    성_hanja_obj = _get_surname_hanja(surname_hanja, hanja_repo)
    부족한_오행_list = 부족한_오행 or []

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

        # 발음오행 조화 계산 (성씨 기준)
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

        # 희귀도 tiebreak
        rarity_tiebreak = 0.0
        if rarity_preference == "희귀":
            rarity_tiebreak = -rn.count
        elif rarity_preference == "흔한":
            rarity_tiebreak = rn.count

        # 음절별 한자 선택
        name_hanja_objs: list[Hanja | None] = [_best_hanja_for(c, hanja_repo) for c in name]

        # 개별 점수 계산
        발음오행_norm = (harmony_score + 4) / 8
        자원오행_norm = _자원오행_score(성_hanja_obj, name_hanja_objs)
        수리격_norm = _수리격_score(성_hanja_obj, name_hanja_objs, gender)
        발음음양_norm = _발음음양_score(성_hanja_obj, name_hanja_objs)
        획수음양_norm = _획수음양_score(성_hanja_obj, name_hanja_objs)
        용신_norm = _용신_score(name_hanja_objs, syllable_오행_list, 부족한_오행_list)

        total_score = (
            용신_norm * 0.35
            + 수리격_norm * 0.25
            + 발음오행_norm * 0.10
            + 자원오행_norm * 0.10
            + 발음음양_norm * 0.10
            + 획수음양_norm * 0.10
            + rarity_tiebreak * 0.001
        )

        # 음절별 정보 구성
        syllables = []
        for i, char in enumerate(name):
            h = name_hanja_objs[i]
            s_오행 = syllable_오행_list[i]
            syllables.append({
                "한글": char,
                "한자": h.hanja if h else "",
                "meaning": h.mean if h else "",
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
            "score_breakdown": {
                "발음오행": round(발음오행_norm, 3),
                "자원오행": round(자원오행_norm, 3),
                "수리격": round(수리격_norm, 3),
                "획수음양": round(획수음양_norm, 3),
                "발음음양": round(발음음양_norm, 3),
                "용신": round(용신_norm, 3),
            },
        }
        scored.append((total_score, candidate))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:limit]]
