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
from db.hanja_combinations_repository import HanjaCombinationsRepository
from db.scored_combinations_repository import ScoredCombinationsRepository
from db.hanja_model import Hanja
from agent import name_store


_초성_table = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]
_SOFT = {"ㅅ", "ㄴ", "ㅁ", "ㅇ", "ㅎ", "ㄹ"}
_STRONG = {"ㅂ", "ㄱ", "ㄷ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ"}


def _get_초성(char: str) -> str | None:
    code = ord(char) - 0xAC00
    return _초성_table[code // 588] if 0 <= code <= 11171 else None


def _get_feel(name: str) -> str:
    초성 = _get_초성(name[0]) if name else None
    if 초성 in _SOFT:
        return "soft"
    if 초성 in _STRONG:
        return "strong"
    return "neutral"


def _diversify(scored: list[tuple[float, dict]], limit: int) -> list[tuple[float, dict]]:
    pool = scored[:limit * 3]
    result = []
    first_syllable_count: dict[str, int] = {}
    for score, cand in pool:
        if len(result) >= limit:
            break
        first = cand["한글"][0] if cand["한글"] else ""
        if first_syllable_count.get(first, 0) >= 2:
            continue
        result.append((score, cand))
        first_syllable_count[first] = first_syllable_count.get(first, 0) + 1
    if len(result) < limit:
        added = {id(c) for _, c in result}
        for score, cand in pool:
            if len(result) >= limit:
                break
            if id(cand) not in added:
                result.append((score, cand))
    return result


def _get_surname_오행(surname: str) -> 오행 | None:
    if not surname:
        return None
    return 발음오행_from_초성(surname[0])


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


def _build_candidate_from_combo(
    name: str,
    surname: str,
    rn_count: int,
    best_name_hanjas: list[Hanja | None],
    syllable_오행_list: list,
    성_hanja_obj: Hanja | None,
    gender: str,
    harmony_level: str,
    harmony_reason: str,
    발음오행_norm: float,
    부족한_오행_list: list[str],
    combos_by_name: dict,
    용신_override: float | None = None,
) -> dict:
    """조합에서 후보 dict를 구성합니다."""
    syllables = []
    for i, char in enumerate(name):
        h = best_name_hanjas[i] if i < len(best_name_hanjas) else None
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
        "rarity_signal": "희귀" if rn_count < 100 else ("보통" if rn_count < 1000 else "흔한"),
        "reason": "",
        "score_breakdown": {
            "발음오행": round(발음오행_norm, 3),
            "자원오행": round(_자원오행_score(성_hanja_obj, best_name_hanjas), 3),
            "수리격": round(_수리격_score(성_hanja_obj, best_name_hanjas, gender), 3),
            "획수음양": round(_획수음양_score(성_hanja_obj, best_name_hanjas), 3),
            "발음음양": round(_발음음양_score(성_hanja_obj, best_name_hanjas), 3),
            "용신": round(
                용신_override if 용신_override is not None
                else _용신_score(best_name_hanjas, syllable_오행_list, 부족한_오행_list),
                3,
            ),
        },
    }

    # hanja_options 채우기 (조합 목록에서 추출)
    name_combos = combos_by_name.get(name, [])
    if name_combos:
        seen1: list[Hanja] = []
        seen1_ids: set[int] = set()
        seen2: list[Hanja] = []
        seen2_ids: set[int] = set()
        for h1, h2 in name_combos:
            if h1.id not in seen1_ids:
                seen1.append(h1)
                seen1_ids.add(h1.id)
            if h2.id not in seen2_ids:
                seen2.append(h2)
                seen2_ids.add(h2.id)

        options_per_syllable = [seen1[:5], seen2[:5]]
        for i, syllable in enumerate(candidate["syllables"]):
            if i < len(options_per_syllable):
                syllable["hanja_options"] = [
                    {
                        "한자": o.hanja,
                        "meaning": o.mean,
                        "오행": o.character_five_elements or "",
                        "stroke_count": (
                            o.original_stroke_count
                            if o.original_stroke_count is not None
                            else o.dictionary_stroke_count
                        ),
                    }
                    for o in options_per_syllable[i]
                ]

    return candidate


def _score_for_sorting(
    성_hanja_obj: Hanja | None,
    best_name_hanjas: list[Hanja | None],
    gender: str,
    발음오행_norm: float,
    syllable_오행_list: list,
    부족한_오행_list: list[str],
    rarity_tiebreak: float,
    sibling_penalty: float,
) -> float:
    return (
        _용신_score(best_name_hanjas, syllable_오행_list, 부족한_오행_list) * 0.40
        + _자원오행_score(성_hanja_obj, best_name_hanjas) * 0.18
        + _수리격_score(성_hanja_obj, best_name_hanjas, gender) * 0.15
        + 발음오행_norm * 0.12
        + _발음음양_score(성_hanja_obj, best_name_hanjas) * 0.08
        + _획수음양_score(성_hanja_obj, best_name_hanjas) * 0.07
        + rarity_tiebreak * 0.001
        + sibling_penalty
    )


def find_name_candidates(
    surname: str,
    gender: str,  # "남" | "여"
    session_id: str,
    surname_hanja: str = "",
    부족한_오행: list[str] | None = None,
    preferred_오행: str | None = None,
    max_받침_count: int | None = None,  # 0/1/2, None=제한 없음
    rarity_preference: str | None = None,  # "희귀" | "보통" | "흔한"
    name_feel_preference: str | None = None,  # "soft" | "strong" | None
    name_length: str | None = None,  # "외자" | "두글자" | "상관없음" | None
    sibling_names: list[str] | None = None,
    limit: int = 8,
    pool_size: int = 500,
    offset: int = 0,
) -> list[dict]:
    """등록명 DB에서 이름 후보를 가져와 종합 점수 계산 후 상위 후보를 반환합니다.

    사전 계산 DB(scored_combinations.sqlite3)에 있는 이름은 즉시 조회,
    없는 이름(하위 ~1.3%)만 기존 런타임 계산 로직으로 폴백한다.
    """
    gender_obj = 성별.여 if gender == "여" else 성별.남
    name_repo = RegisteredNameRepository()
    hanja_repo = HanjaRepository()
    scored_repo = ScoredCombinationsRepository()
    combo_repo = HanjaCombinationsRepository()

    disliked = set(name_store.get_disliked(session_id))
    liked = set(name_store.get_liked(session_id))
    shown = set(name_store.get_shown(session_id))
    exclude = disliked | liked | shown

    sibling_first_syllables: set[str] = set()
    if sibling_names:
        for sn in sibling_names:
            if sn:
                sibling_first_syllables.add(sn[0])

    pool = name_repo.find_by_gender(gender_obj, limit=pool_size, offset=offset)

    surname_오행 = _get_surname_오행(surname)
    성_hanja_obj = _get_surname_hanja(surname_hanja, hanja_repo)
    부족한_오행_list = 부족한_오행 or []

    # 하드 필터링
    filtered_pool = []
    for rn in pool:
        name = rn.name
        if name in exclude:
            continue

        if max_받침_count is not None:
            받침_개수 = sum(
                1 for c in name
                if 0xAC00 <= ord(c) <= 0xD7A3 and (ord(c) - 0xAC00) % 28 != 0
            )
            if 받침_개수 > max_받침_count:
                continue

        if name_length == "외자" and len(name) != 1:
            continue
        elif name_length == "두글자" and len(name) != 2:
            continue

        if preferred_오행:
            syllable_오행s = [발음오행_from_초성(c) for c in name]
            has_preferred = any(
                o is not None and o.value == preferred_오행
                for o in syllable_오행s
            )
            if not has_preferred:
                continue

        filtered_pool.append(rn)

    if not filtered_pool:
        return []

    pool_names = [rn.name for rn in filtered_pool]
    rn_count_by_name = {rn.name: rn.count for rn in filtered_pool}

    # ── 사전 계산 DB 우선 조회 ─────────────────────────────────────────────
    # {이름: (hanja1, hanja2, precomputed_score)} — 이름당 최고점 조합 1개
    precomputed_best: dict[str, tuple[Hanja, Hanja, float]] = {}
    fallback_names: list[str] = list(pool_names)

    use_precomputed = scored_repo.is_available() and surname_hanja
    if use_precomputed:
        required_ohaengs = 부족한_오행_list if 부족한_오행_list else ["목", "화", "토", "금", "수"]
        precomputed_best = scored_repo.get_best_combination(
            surname_hanja=surname_hanja,
            names=pool_names,
            required_ohaengs=required_ohaengs,
        )
        covered = set(precomputed_best.keys())
        fallback_names = [n for n in pool_names if n not in covered]

    # ── 폴백: 기존 런타임 계산 ────────────────────────────────────────────
    fallback_combos: dict[str, list[tuple[Hanja, Hanja]]] = {}
    if fallback_names:
        fallback_combos = combo_repo.get_combinations_bulk(fallback_names)

    # ── 점수 계산 및 정렬 ────────────────────────────────────────────────
    scored: list[tuple[float, dict]] = []

    for rn in filtered_pool:
        name = rn.name
        syllable_오행_list: list[오행 | None] = [발음오행_from_초성(c) for c in name]

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

        발음오행_norm = (harmony_score + 4) / 8

        rarity_tiebreak = 0.0
        if rarity_preference == "희귀":
            rarity_tiebreak = -rn.count
        elif rarity_preference == "흔한":
            rarity_tiebreak = rn.count

        sibling_penalty = -0.03 if name and name[0] in sibling_first_syllables else 0.0

        if name in precomputed_best:
            # 사전 계산 경로: score 재계산 없이 precomputed_score + 발음오행/용신 가산
            h1, h2, pre_score, ohaeng_covered = precomputed_best[name]
            best_name_hanjas: list[Hanja | None] = [h1, h2]
            # precomputed_score = 자원오행(0.18) + 수리격(0.15) + 발음음양(0.08) + 획수음양(0.07)
            용신_val = 1.0 if ohaeng_covered else 0.0
            best_score = (
                pre_score
                + 용신_val * 0.40
                + 발음오행_norm * 0.12
                + rarity_tiebreak * 0.001
                + sibling_penalty
            )
            if name_feel_preference:
                feel = _get_feel(name)
                if name_feel_preference == "soft" and feel == "strong":
                    best_score *= 0.7
                elif name_feel_preference == "strong" and feel == "soft":
                    best_score *= 0.7
            combos_for_options: dict[str, list[tuple[Hanja, Hanja]]] = {name: [(h1, h2)]}
            용신_override_val: float | None = 용신_val
        else:
            # 폴백 경로: 기존 런타임 계산
            name_combos = fallback_combos.get(name, [])
            best_score = -999.0
            best_name_hanjas = [None] * len(name)

            if name_combos:
                for h1f, h2f in name_combos:
                    nh: list[Hanja | None] = [h1f, h2f]
                    s = _score_for_sorting(
                        성_hanja_obj, nh, gender,
                        발음오행_norm, syllable_오행_list, 부족한_오행_list,
                        rarity_tiebreak, sibling_penalty,
                    )
                    if s > best_score:
                        best_score = s
                        best_name_hanjas = nh
            else:
                best_score = _score_for_sorting(
                    성_hanja_obj, [None] * len(name), gender,
                    발음오행_norm, syllable_오행_list, 부족한_오행_list,
                    rarity_tiebreak, sibling_penalty,
                )
            if name_feel_preference:
                feel = _get_feel(name)
                if name_feel_preference == "soft" and feel == "strong":
                    best_score *= 0.7
                elif name_feel_preference == "strong" and feel == "soft":
                    best_score *= 0.7
            combos_for_options = {name: name_combos}
            용신_override_val = None

        candidate = _build_candidate_from_combo(
            name=name,
            surname=surname,
            rn_count=rn.count,
            best_name_hanjas=best_name_hanjas,
            syllable_오행_list=syllable_오행_list,
            성_hanja_obj=성_hanja_obj,
            gender=gender,
            harmony_level=harmony_level,
            harmony_reason=harmony_reason,
            발음오행_norm=발음오행_norm,
            부족한_오행_list=부족한_오행_list,
            combos_by_name=combos_for_options,
            용신_override=용신_override_val,
        )
        scored.append((best_score, candidate))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in _diversify(scored, limit)]
