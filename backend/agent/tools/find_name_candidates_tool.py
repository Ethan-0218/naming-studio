"""이름 후보 검색 툴."""

import logging

logger = logging.getLogger(__name__)

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


def _count_받침(name: str) -> int:
    return sum(1 for c in name if 0xAC00 <= ord(c) <= 0xD7A3 and (ord(c) - 0xAC00) % 28 != 0)


def _compute_preference_score(
    name: str,
    rarity_signal: str,
    trad_components: dict,
    name_feel_preference: str | None,
    rarity_preference: str | None,
    max_받침_count: int | None,
    dominant_like_reasons: list[str],
    dominant_dislike_reasons: list[str],
) -> tuple[float, dict]:
    """취향 적합도 점수를 계산합니다. (aggregate 점수, 차원별 dict) 반환."""
    score = 0.5
    dims: dict = {}

    if name_feel_preference:
        feel = _get_feel(name)
        if feel == name_feel_preference:
            score += 0.15
            dims["취향_발음느낌"] = 1.0
        elif feel != "neutral":
            score -= 0.15
            dims["취향_발음느낌"] = 0.0

    if rarity_preference and rarity_signal:
        _rarity_map = {"희귀": "희귀", "보통": "보통", "흔한": "흔한"}
        pref_norm = _rarity_map.get(rarity_preference)
        if pref_norm:
            match = rarity_signal == pref_norm
            score += 0.15 if match else -0.10
            dims["취향_희귀도"] = 1.0 if match else 0.0

    if max_받침_count is not None:
        받침수 = _count_받침(name)
        if 받침수 <= max_받침_count:
            score += 0.10
            dims["취향_받침수"] = 1.0
        else:
            score -= 0.15
            dims["취향_받침수"] = 0.0

    if "pronunciation" in dominant_like_reasons:
        comp = trad_components.get("발음오행", 0.5)
        score += (comp - 0.5) * 0.15
        dims["취향_발음이유"] = round(comp, 3)
    if "meaning" in dominant_like_reasons:
        comp = trad_components.get("자원오행", 0.5)
        score += (comp - 0.5) * 0.15
        dims["취향_의미이유"] = round(comp, 3)
    if "rarity" in dominant_like_reasons and rarity_signal == "희귀":
        score += 0.05

    if "pronunciation" in dominant_dislike_reasons:
        comp = trad_components.get("발음오행", 0.5)
        score -= (comp - 0.5) * 0.10
    if "meaning" in dominant_dislike_reasons:
        comp = trad_components.get("자원오행", 0.5)
        score -= (comp - 0.5) * 0.10

    return max(0.0, min(1.0, score)), dims


def _pref_weight(
    name_feel_preference: str | None,
    rarity_preference: str | None,
    max_받침_count: int | None,
    dominant_like_reasons: list[str],
    dominant_dislike_reasons: list[str],
    total_reactions: int = 0,
) -> float:
    """취향 신호 개수와 반응 수에 따라 취향 점수 가중치 결정 (0–0.35)."""
    signals = sum([
        name_feel_preference is not None,
        rarity_preference is not None and rarity_preference != "상관없음",
        max_받침_count is not None,
        len(dominant_like_reasons) > 0,
        len(dominant_dislike_reasons) > 0,
    ])
    signal_w = min(0.25, signals * 0.05)
    reaction_w = min(0.10, total_reactions * 0.01)
    return signal_w + reaction_w


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
    harmony_description: str,
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
        "발음오행_조화_설명": harmony_description,
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


def _get_rn_floor(rarity_preference: str | None) -> int:
    """rarity_preference에 따른 최소 rn_count 하한선을 반환."""
    if rarity_preference in ("독특한", "희귀"):
        return 0
    if rarity_preference in ("평범한", "흔한"):
        return 1000
    return 500  # default: 미설정


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
    sibling_names: list[str] | None = None,
    sibling_anchor_syllables: list[str] | None = None,
    sibling_anchor_patterns: list[str] | None = None,
    limit: int = 8,
    pool_size: int = 500,
    offset: int = 0,
    sc_cursor: int = 0,
    dominant_like_reasons: list[str] | None = None,
    dominant_dislike_reasons: list[str] | None = None,
    total_reactions: int = 0,
) -> list[dict]:
    """이름 후보를 가져와 종합 점수 계산 후 상위 후보를 반환합니다.

    surname_hanja가 있으면 scored_combinations에서 점수 내림차순으로 직접 조회.
    없으면 registered_names 기반 기존 로직으로 fallback한다.
    """
    logger.info(
        "[후보검색] 성=%s 성별=%s pool=%d sc_cursor=%d 제약={max_받침=%s, 선호오행=%s}",
        surname, gender, pool_size, sc_cursor, max_받침_count, preferred_오행,
    )

    _dominant_likes = dominant_like_reasons or []
    _dominant_dislikes = dominant_dislike_reasons or []
    w = _pref_weight(
        name_feel_preference=name_feel_preference,
        rarity_preference=rarity_preference,
        max_받침_count=max_받침_count,
        dominant_like_reasons=_dominant_likes,
        dominant_dislike_reasons=_dominant_dislikes,
        total_reactions=total_reactions,
    )
    logger.debug("[취향가중치] w=%.2f (반응수=%d, 선호신호=%s)", w, total_reactions, {
        "feel": name_feel_preference, "rarity": rarity_preference,
        "받침": max_받침_count, "like_reasons": _dominant_likes,
    })

    gender_obj = 성별.여 if gender == "여" else 성별.남
    db_gender = "female" if gender == "여" else "male"
    hanja_repo = HanjaRepository()
    scored_repo = ScoredCombinationsRepository()
    combo_repo = HanjaCombinationsRepository()

    disliked = set(name_store.get_disliked(session_id))
    liked = set(name_store.get_liked(session_id))
    shown = set(name_store.get_shown(session_id))
    exclude = disliked | liked | shown | set(sibling_names or [])

    sibling_first_syllables: set[str] = set()
    if sibling_names:
        for sn in sibling_names:
            if sn:
                sibling_first_syllables.add(sn[0])

    surname_오행 = _get_surname_오행(surname)
    성_hanja_obj = _get_surname_hanja(surname_hanja, hanja_repo)
    부족한_오행_list = 부족한_오행 or []

    # preferred_오행을 enum으로 정규화 (한글 "수" ↔ 한자 "水" 불일치 방지)
    _preferred_오행_obj = 오행.from_string(preferred_오행) if preferred_오행 else None

    # ── scored_combinations 직접 조회 경로 (surname_hanja 있는 경우) ─────────
    use_sc_direct = scored_repo.is_available() and bool(surname_hanja)

    if use_sc_direct:
        required_ohaengs = 부족한_오행_list if 부족한_오행_list else ["_all"]
        rn_floor = _get_rn_floor(rarity_preference)
        sc_rows = scored_repo.get_top_names(
            surname_hanja=surname_hanja,
            gender=db_gender,
            required_ohaengs=required_ohaengs,
            limit=pool_size,
            offset=sc_cursor,
            min_rn_count=rn_floor,
            max_받침_count=max_받침_count,
            anchor_patterns=sibling_anchor_patterns,
            exclude_names=exclude,
        )
        logger.debug("[SC직접조회] %d개 조회 (cursor=%d)", len(sc_rows), sc_cursor)

        # preferred_오행 Python 필터 (hanja 속성 참조 필요)
        filtered_sc: list[tuple[str, int, int, float, bool, int]] = []
        filter_stats = {"오행": 0}
        for name, hanja1_id, hanja2_id, score, ohaeng_covered, rn_count in sc_rows:
            filtered_sc.append((name, hanja1_id, hanja2_id, score, ohaeng_covered, rn_count))

        logger.info(
            "[필터] SQL필터 후 %d개, 오행필터 후 %d개 (오행제외=%d)",
            len(sc_rows), len(filtered_sc), filter_stats["오행"],
        )

        if not filtered_sc:
            return []

        # hanja cache로 precomputed_best dict 구성
        hanja_cache = ScoredCombinationsRepository._ensure_hanja_cache(scored_repo._hanja_db_path)
        precomputed_best: dict[str, tuple[Hanja, Hanja, float, bool]] = {}
        rn_count_by_name: dict[str, int] = {}
        for name, hanja1_id, hanja2_id, score, ohaeng_covered, rn_count in filtered_sc:
            h1 = hanja_cache.get(hanja1_id)
            h2 = hanja_cache.get(hanja2_id)
            if h1 and h2:
                precomputed_best[name] = (h1, h2, score, ohaeng_covered)
                rn_count_by_name[name] = rn_count

        scored: list[tuple[float, dict]] = []
        for name, _, _, pre_score, ohaeng_covered, rn_count in filtered_sc:
            if name not in precomputed_best:
                continue
            h1, h2, pre_score, ohaeng_covered = precomputed_best[name]
            if _preferred_오행_obj:
                hanja_오행_objs = [오행.from_string(h.character_five_elements) for h in [h1, h2] if h]
                if not any(o == _preferred_오행_obj for o in hanja_오행_objs):
                    filter_stats["오행"] += 1
                    continue
            syllable_오행_list: list[오행 | None] = [발음오행_from_초성(c) for c in name]

            harmony_score = 0
            harmony_level = "평"
            harmony_reason = ""
            harmony_description = ""
            if surname_오행 and len(name) >= 1:
                첫음절_오행 = syllable_오행_list[0]
                두번째_오행 = syllable_오행_list[1] if len(name) >= 2 else None
                if 첫음절_오행:
                    harmony = 오행조화.from_오행(surname_오행, 첫음절_오행, 두번째_오행)
                    harmony_score = harmony.total_score
                    harmony_level = harmony.level
                    harmony_reason = harmony.reason
                    harmony_description = harmony.description

            발음오행_norm = (harmony_score + 4) / 8
            용신_val = 1.0 if ohaeng_covered else 0.0

            rarity_tiebreak = 0.0
            if rarity_preference == "희귀":
                rarity_tiebreak = -rn_count
            elif rarity_preference == "흔한":
                rarity_tiebreak = rn_count

            sibling_penalty = 0.0 if sibling_anchor_syllables else (
                -0.03 if sibling_first_syllables and name[0] in sibling_first_syllables else 0.0
            )

            best_score = (
                pre_score
                + 용신_val * 0.40
                + rarity_tiebreak * 0.001
                + sibling_penalty
            )
            if name_feel_preference:
                feel = _get_feel(name)
                if name_feel_preference == "soft" and feel == "strong":
                    best_score *= 0.7
                elif name_feel_preference == "strong" and feel == "soft":
                    best_score *= 0.7

            best_name_hanjas: list[Hanja | None] = [h1, h2]
            candidate = _build_candidate_from_combo(
                name=name,
                surname=surname,
                rn_count=rn_count,
                best_name_hanjas=best_name_hanjas,
                syllable_오행_list=syllable_오행_list,
                성_hanja_obj=성_hanja_obj,
                gender=gender,
                harmony_level=harmony_level,
                harmony_reason=harmony_reason,
                harmony_description=harmony_description,
                발음오행_norm=발음오행_norm,
                부족한_오행_list=부족한_오행_list,
                combos_by_name={name: [(h1, h2)]},
                용신_override=용신_val,
            )
            pref_score, pref_dims = _compute_preference_score(
                name=name,
                rarity_signal=candidate["rarity_signal"],
                trad_components=candidate["score_breakdown"],
                name_feel_preference=name_feel_preference,
                rarity_preference=rarity_preference,
                max_받침_count=max_받침_count,
                dominant_like_reasons=_dominant_likes,
                dominant_dislike_reasons=_dominant_dislikes,
            )
            final_score = best_score * (1 - w) + pref_score * w
            candidate["score_breakdown"].update(pref_dims)
            candidate["score_breakdown"]["취향_적합도"] = round(pref_score, 3)
            if w > 0:
                candidate["score_breakdown"]["pref_weight"] = round(w, 2)
            scored.append((final_score, candidate))

        scored.sort(key=lambda x: x[0], reverse=True)

        for rank, (score, cand) in enumerate(scored[:5], start=1):
            sb = cand.get("score_breakdown", {})
            logger.debug(
                "[순위#%d] 이름=%s 점수=%.3f (용신=%.2f 자원=%.2f 수리=%.2f 발음=%.2f)",
                rank, cand.get("한글", ""), score,
                sb.get("용신", 0), sb.get("자원오행", 0), sb.get("수리격", 0),
                sb.get("발음오행", 0),
            )

        final = [c for _, c in _diversify(scored, limit)]
        for i, c in enumerate(final):
            c["id"] = i + 1
        logger.info("[최종] %d개 반환 (SC직접): %s", len(final), [c.get("한글", "") for c in final])
        return final

    # ── fallback: registered_names 기반 기존 로직 ────────────────────────
    name_repo = RegisteredNameRepository()
    pool = name_repo.find_by_gender(gender_obj, limit=pool_size, offset=offset)
    logger.debug("[풀] registered_names에서 %d개 조회", len(pool))

    # 하드 필터링
    filtered_pool = []
    filter_stats = {"제외(shown/liked/disliked)": 0, "받침": 0, "오행": 0, "희귀도": 0, "앵커": 0}
    rn_floor = _get_rn_floor(rarity_preference)
    for rn in pool:
        name = rn.name
        if name in exclude:
            filter_stats["제외(shown/liked/disliked)"] += 1
            continue

        if rn.count < rn_floor:
            filter_stats["희귀도"] += 1
            continue

        if max_받침_count is not None:
            받침_개수 = sum(
                1 for c in name
                if 0xAC00 <= ord(c) <= 0xD7A3 and (ord(c) - 0xAC00) % 28 != 0
            )
            if 받침_개수 > max_받침_count:
                filter_stats["받침"] += 1
                continue

        if sibling_anchor_patterns:
            def _match_pattern(n: str, patterns: list[str]) -> bool:
                for p in patterns:
                    if p.endswith("%") and n.startswith(p[:-1]):
                        return True
                    if p.startswith("%") and n.endswith(p[1:]):
                        return True
                return False
            if not _match_pattern(name, sibling_anchor_patterns):
                filter_stats["앵커"] += 1
                continue

        filtered_pool.append(rn)

    logger.info(
        "[필터] %d→%d개 통과 (제외=%d 받침=%d 오행=%d 희귀도=%d 앵커=%d)",
        len(pool), len(filtered_pool),
        filter_stats["제외(shown/liked/disliked)"], filter_stats["받침"],
        filter_stats["오행"],
        filter_stats["희귀도"], filter_stats["앵커"],
    )

    if not filtered_pool:
        return []

    pool_names = [rn.name for rn in filtered_pool]
    rn_count_by_name = {rn.name: rn.count for rn in filtered_pool}

    precomputed_best_fb: dict[str, tuple[Hanja, Hanja, float, bool]] = {}
    fallback_names: list[str] = list(pool_names)

    use_precomputed = scored_repo.is_available() and surname_hanja
    if use_precomputed:
        required_ohaengs_fb = 부족한_오행_list if 부족한_오행_list else ["목", "화", "토", "금", "수"]
        precomputed_best_fb = scored_repo.get_best_combination(
            surname_hanja=surname_hanja,
            names=pool_names,
            required_ohaengs=required_ohaengs_fb,
            gender=db_gender,
        )
        covered = set(precomputed_best_fb.keys())
        fallback_names = [n for n in pool_names if n not in covered]
        logger.debug("[사전계산] %d개 hit, %d개 폴백 런타임 계산", len(covered), len(fallback_names))

    fallback_combos: dict[str, list[tuple[Hanja, Hanja]]] = {}
    if fallback_names:
        fallback_combos = combo_repo.get_combinations_bulk(fallback_names)

    scored: list[tuple[float, dict]] = []

    for rn in filtered_pool:
        name = rn.name
        syllable_오행_list: list[오행 | None] = [발음오행_from_초성(c) for c in name]

        harmony_score = 0
        harmony_level = "평"
        harmony_reason = ""
        harmony_description = ""
        if surname_오행 and len(name) >= 1:
            첫음절_오행 = syllable_오행_list[0]
            두번째_오행 = syllable_오행_list[1] if len(name) >= 2 else None
            if 첫음절_오행:
                harmony = 오행조화.from_오행(surname_오행, 첫음절_오행, 두번째_오행)
                harmony_score = harmony.total_score
                harmony_level = harmony.level
                harmony_reason = harmony.reason
                harmony_description = harmony.description

        발음오행_norm = (harmony_score + 4) / 8

        rarity_tiebreak = 0.0
        if rarity_preference == "희귀":
            rarity_tiebreak = -rn.count
        elif rarity_preference == "흔한":
            rarity_tiebreak = rn.count

        sibling_penalty = 0.0 if sibling_anchor_patterns else (
            -0.03 if sibling_first_syllables and name[0] in sibling_first_syllables else 0.0
        )

        if name in precomputed_best_fb:
            # 사전 계산 경로: score 재계산 없이 precomputed_score + 발음오행/용신 가산
            h1, h2, pre_score, ohaeng_covered = precomputed_best_fb[name]
            best_name_hanjas: list[Hanja | None] = [h1, h2]
            # precomputed_score = 자원오행(0.18) + 발음오행(0.12) + 수리격(0.15) + 발음음양(0.08) + 획수음양(0.07)
            용신_val = 1.0 if ohaeng_covered else 0.0
            best_score = (
                pre_score
                + 용신_val * 0.40
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

        if preferred_오행:
            hanja_오행s = [h.character_five_elements for h in best_name_hanjas if h]
            if not any(o and o == preferred_오행 for o in hanja_오행s):
                filter_stats["오행"] += 1
                continue

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
        pref_score, pref_dims = _compute_preference_score(
            name=name,
            rarity_signal=candidate["rarity_signal"],
            trad_components=candidate["score_breakdown"],
            name_feel_preference=name_feel_preference,
            rarity_preference=rarity_preference,
            max_받침_count=max_받침_count,
            dominant_like_reasons=_dominant_likes,
            dominant_dislike_reasons=_dominant_dislikes,
        )
        final_score = best_score * (1 - w) + pref_score * w
        candidate["score_breakdown"].update(pref_dims)
        candidate["score_breakdown"]["취향_적합도"] = round(pref_score, 3)
        if w > 0:
            candidate["score_breakdown"]["pref_weight"] = round(w, 2)
        scored.append((final_score, candidate))

    scored.sort(key=lambda x: x[0], reverse=True)

    for rank, (score, cand) in enumerate(scored[:5], start=1):
        sb = cand.get("score_breakdown", {})
        logger.debug(
            "[순위#%d] 이름=%s 점수=%.3f (용신=%.2f 자원=%.2f 수리=%.2f 발음=%.2f 발음음양=%.2f 획수음양=%.2f)",
            rank, cand.get("한글", ""), score,
            sb.get("용신", 0), sb.get("자원오행", 0), sb.get("수리격", 0),
            sb.get("발음오행", 0), sb.get("발음음양", 0), sb.get("획수음양", 0),
        )

    final = [c for _, c in _diversify(scored, limit)]
    for i, c in enumerate(final):
        c["id"] = i + 1
    logger.info("[최종] %d개 반환: %s", len(final), [c.get("한글", "") for c in final])
    return final
