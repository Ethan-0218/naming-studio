from agent.state import NamingState

# score_breakdown 항목 이름 → 한국어 레이블 매핑
_SCORE_LABELS = {
    "용신": "사주 균형",
    "자원오행": "한자 기운",
    "수리격": "획수 흐름",
    "발음오행": "소리 기운",
    "발음음양": "소리 균형",
    "획수음양": "획수 균형",
}

# section3 feel 칩 → DB name_feel_preference 매핑
# 발음/초성 느낌이 명확한 경우에만 soft/strong 적용
_FEEL_TO_DB = {
    "강인한": "strong",
    "밝고 사랑스러운": "soft",
    "맑고 자연스러운": "soft",
}


def _format_score_breakdown(name: str, breakdown: dict) -> str:
    """score_breakdown을 읽기 좋은 문자열로 변환합니다."""
    if not breakdown:
        return name
    parts = []
    for key, label in _SCORE_LABELS.items():
        val = breakdown.get(key)
        if val is not None:
            parts.append(f"{label} {val:.2f}")
    score_str = ", ".join(parts) if parts else "점수 없음"
    return f"{name} ({score_str})"


def build_stage_prompt(state: NamingState) -> str:
    from agent import name_store

    session_id = state.get("session_id", "")
    liked = name_store.get_liked(session_id)
    disliked = name_store.get_disliked(session_id)
    direction = state.get("naming_direction", "")
    preference = state.get("preference_profile", {})
    sibling_names = preference.get("sibling_names") if preference else None
    shown_name_scores: dict = state.get("shown_name_scores") or {}

    # liked/disliked 이름의 score_breakdown 포함
    if liked:
        liked_lines = [
            _format_score_breakdown(name, shown_name_scores.get(name, {}))
            for name in liked
        ]
        liked_text = "좋아요한 이름:\n" + "\n".join(f"  · {l}" for l in liked_lines)
    else:
        liked_text = "좋아요한 이름: 없음"

    if disliked:
        disliked_lines = [
            _format_score_breakdown(name, shown_name_scores.get(name, {}))
            for name in disliked
        ]
        disliked_text = "싫어요한 이름:\n" + "\n".join(f"  · {l}" for l in disliked_lines)
    else:
        disliked_text = "싫어요한 이름: 없음"

    sibling_text = f"\n형제자매 이름: {', '.join(sibling_names)}" if sibling_names else ""

    pref_lines = []
    if preference.get("max_받침_count") is not None:
        pref_lines.append(f"받침 제한: 최대 {preference['max_받침_count']}개")
    if preference.get("name_length"):
        pref_lines.append(f"이름 길이: {preference['name_length']}")
    if preference.get("rarity_preference") and preference["rarity_preference"] != "상관없음":
        pref_lines.append(f"희귀도: {preference['rarity_preference']}")
    if preference.get("name_feel_preference"):
        feel_label = "부드러운 발음(ㅅㄴㅁㅇㅎㄹ 계열)" if preference["name_feel_preference"] == "soft" else "강한 발음(ㅂㄱㄷㅈㅊ 계열)"
        pref_lines.append(f"발음 느낌: {feel_label}")
    pref_text = ("\n" + "\n".join(pref_lines)) if pref_lines else ""

    # section3 취향 칩 — LLM 평가 기준
    section3_lines = []
    feel = preference.get("_section3_feel", "")
    values = preference.get("_section3_values", "")
    avoid = preference.get("_section3_avoid", "")
    if feel:
        section3_lines.append(f"원하는 이름 느낌: {feel}")
    if values:
        section3_lines.append(f"담고 싶은 의미·가치: {values}")
    if avoid:
        section3_lines.append(f"피하고 싶은 조건: {avoid}")
    section3_text = ("\n부모님 취향 메모:\n" + "\n".join(f"  · {l}" for l in section3_lines)) if section3_lines else ""

    return f"""
[현재 단계: 이름 탐색]

현재 작명 방향: {direction}{pref_text}{section3_text}
{liked_text}
{disliked_text}{sibling_text}

사용자의 반응을 분석해 취향을 파악하고, 그에 맞는 이름을 자연스럽게 추천하거나 대화를 이어가세요. 한 번에 최대 3개의 이름만 추천하세요.

후보 조회 (get_name_candidates 툴):
- 현재 대화 맥락에서 추천할 만한 이름이 충분하지 않으면 툴을 호출하세요.
- 툴 파라미터로 취향을 반영하세요:
  · 받침 제한 있으면 max_받침_count 설정
  · 발음 느낌 조건(soft/strong)이 있으면 name_feel_preference 설정
- 이미 본 이름은 툴이 자동으로 제외합니다.
- 한 번 조회로 충분하면 툴 없이 바로 추천 가능. 최대 3회 호출.

score_breakdown 활용:
- 위 좋아요/싫어요 이름에 점수가 표시된 경우, 패턴을 파악해 추천에 반영하세요.
  예: 좋아요 이름들의 "한자 기운(자원오행)" 점수가 높으면 → 한자 기운이 잘 어우러지는 이름 우선
  예: 싫어요 이름들의 "획수 흐름(수리격)" 점수가 낮으면 → 수리격이 좋은 이름 우선
- 단, 사주 균형(용신) 점수는 아이의 사주에서 객관적으로 도출되는 값이므로 취향으로 조정하지 마세요.
- 각 NAME_REF의 reason에 score_breakdown의 높은 항목을 쉬운 말로 반영하세요.
- syllables의 hanja_options를 참고해 한자 선택지를 안내할 수 있습니다.
{f"- 형제자매 이름({', '.join(sibling_names)})과 계열 연속성 또는 다양성 선호를 파악해 반영하세요." if sibling_names else ""}
{("- 부모님 취향 메모의 '원하는 이름 느낌', '담고 싶은 의미', '피하고 싶은 조건'을 이름 선택과 reason 작성 시 반영하세요." if section3_lines else "")}

응답 구성:
- content 배열에 TEXT 블록과 NAME_REF 블록을 섞어 자연스러운 대화 흐름을 만드세요. NAME_REF 블록은 최대 3개만 넣으세요.
- NAME_REF 블록 작성 규칙:
  · type은 반드시 "NAME_REF"로 설정하세요.
  · id는 툴이 반환한 후보 목록의 id 값을 그대로 사용하세요. 한자/의미/음절 등은 직접 생성하지 마세요.
  · reason에 이름 추천 이유를 쉬운 말로 작성하세요. score_breakdown의 높은 항목을 반영하세요.
""".strip()
