from agent.state import NamingState

# score_breakdown 항목 이름 → 한국어 레이블 매핑
_SCORE_LABELS = {
    "용신": "사주 균형",
    "자원오행": "한자 기운",
    "수리격": "획수 흐름",
    "발음오행": "소리 기운",
    "발음음양": "소리 균형",
    "획수음양": "획수 균형",
    "취향_발음느낌": "발음 취향 일치",
    "취향_희귀도": "희귀도 취향 일치",
    "취향_받침수": "받침 취향 일치",
    "취향_발음이유": "발음 이유 반영",
    "취향_의미이유": "의미 이유 반영",
    "취향_적합도": "취향 적합도",
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


_MODE_GUIDE = {
    "안정형": "익숙하고 수용도 높은 이름 중심. 등록 빈도 보통~높은 이름, 친숙한 한자 구성 우선.",
    "확장형": "세련되고 개성 있는 이름 탐색. 등록 빈도 낮은 희귀 이름, 독특하고 신선한 조합 우선.",
    "발음형": "소리 흐름과 부르기 편한 발음 중심. 성씨와 발음 조화가 좋고, 소리 기운 점수 높은 이름 우선. reason에 발음 흐름 구체적으로 설명 필수.",
    "의미형": "한자 뜻과 사주 기운 중심. 사주 균형이 좋고 한자 의미가 뚜렷한 이름 우선. reason에 한자 뜻 반드시 설명 필수.",
    "가족조화형": "형제자매 이름, 성씨와의 조화 중심. 계열 연속성 또는 보완 관계를 고려한 이름 우선. reason에 가족 연결성 설명 필수.",
}


def build_stage_prompt(state: NamingState) -> str:
    from agent import name_store

    session_id = state.get("session_id", "")
    liked = name_store.get_liked(session_id)
    disliked = name_store.get_disliked(session_id)
    direction = state.get("naming_direction", "")
    preference = state.get("preference_profile", {})
    sibling_names = preference.get("sibling_names") if preference else None
    shown_name_scores: dict = state.get("shown_name_scores") or {}

    exploration_mode = state.get("exploration_mode") or "안정형"
    mode_guide = _MODE_GUIDE.get(exploration_mode, "")
    mode_reason = state.get("_exploration_mode_reason")

    사주 = state.get("사주_summary") or {}
    사주_text = ""
    if 사주:
        부족한 = 사주.get("부족한_오행", [])
        일간 = 사주.get("일간_오행", "")
        신강신약 = 사주.get("신강신약", "")
        if 부족한:
            사주_text = f"\n아이 사주: {일간} 계열({신강신약}), 보완 필요 기운: {', '.join(부족한)}"

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

    # 명시적 이유 기반 취향 분석
    reason_profile = state.get("reason_taste_profile") or {}
    narrative_hints = reason_profile.get("narrative_hints", [])
    other_like_texts: list[str] = reason_profile.get("other_like_texts", [])
    other_dislike_texts: list[str] = reason_profile.get("other_dislike_texts", [])
    total_reactions = reason_profile.get("total_reactions_with_reasons", 0)

    reason_parts: list[str] = []
    if narrative_hints:
        hints_text = "\n".join(f"  · {h}" for h in narrative_hints)
        reason_parts.append(f"취향 분석 (이유 기반):\n{hints_text}")
    if other_like_texts:
        texts = ", ".join(f'"{t}"' for t in other_like_texts)
        reason_parts.append(f"기타 좋아요 의견: {texts}")
    if other_dislike_texts:
        texts = ", ".join(f'"{t}"' for t in other_dislike_texts)
        reason_parts.append(f"기타 싫어요 의견: {texts}")

    if reason_parts:
        body = "\n".join(reason_parts)
        reason_taste_text = (
            f"\n{body}\n"
            "[이름 추천 시 위 취향을 자연스럽게 언급하세요. "
            "예: \"발음이 중요하다고 하셨는데, 이 이름은 ㄴ·ㅇ·ㄹ이 이어져서 굉장히 부드럽게 느껴져요.\"]"
        )
    else:
        reason_taste_text = ""

    mode_context = f"\n현재 탐색 모드: {exploration_mode} — {mode_guide}"
    mode_transition_instruction = (
        f"\n⚡ 탐색 모드가 방금 전환되었습니다. 첫 번째 TEXT 블록에 다음 문장을 자연스럽게 포함하세요: \"{mode_reason}\""
        if mode_reason else ""
    )

    return f"""
[현재 단계: 이름 탐색]

현재 작명 방향: {direction}{사주_text}{pref_text}{section3_text}{mode_context}{mode_transition_instruction}{reason_taste_text}
{liked_text}
{disliked_text}{sibling_text}

사용자의 반응을 분석해 취향을 파악하고, 그에 맞는 이름을 자연스럽게 추천하거나 대화를 이어가세요. 한 번에 최대 3개의 이름만 추천하세요.

후보 조회 (get_name_candidates 툴):
- 이름을 추천할 때는 반드시 툴을 호출해 후보 pool을 확보하세요.
- 파라미터별 설정 기준:
  · max_받침_count: 받침 제한 선호도가 있으면 설정 (0=받침 없음, 1=최대 1개)
  · name_feel_preference: 발음 느낌 선호도가 있으면 설정 (soft=ㅅㄴㅁㅇㅎㄹ 계열 / strong=ㅂㄱㄷㅈㅊ 계열)
  · rarity_preference: 희귀도 선호도가 있으면 설정 (희귀/보통/흔한)
  · preferred_오행: 사용자가 특정 자원오행(한자 오행) 계열을 원할 때 설정 (목/화/토/금/수)
- 파라미터 미지정 시, 현재 설정된 선호도가 자동 적용됩니다.
- 이미 본 이름은 툴이 자동으로 제외합니다.
- 후보 pool이 충분하면(12개 이상) 툴 재호출 없이 바로 최종 추천으로 넘어가세요. 최대 3회 호출.

score_breakdown 활용:
- 위 좋아요/싫어요 이름에 점수가 표시된 경우, 패턴을 파악해 추천에 반영하세요.
  예: 좋아요 이름들의 "한자 기운(자원오행)" 점수가 높으면 → 한자 기운이 잘 어우러지는 이름 우선
  예: 싫어요 이름들의 "획수 흐름(수리격)" 점수가 낮으면 → 수리격이 좋은 이름 우선
- score_breakdown 패턴을 툴 파라미터에도 반영하세요:
  예: 싫어요 이름들에 받침이 많으면 → max_받침_count=0 또는 1 설정
  예: 싫어요 이름들의 발음 느낌이 강하면 → name_feel_preference="soft" 설정
- 단, 사주 균형(용신) 점수는 아이의 사주에서 객관적으로 도출되는 값이므로 취향으로 조정하지 마세요.
- 각 NAME_REF의 reason에 score_breakdown의 높은 항목을 쉬운 말로 반영하세요.
- syllables의 hanja_options를 참고해 한자 선택지를 안내할 수 있습니다.

취향 차원 점수 활용 (취향_* 키):
- score_breakdown에 취향_* 키가 있으면, 해당 항목이 어떻게 맞는지 reason에서 **구체적으로** 짚어주세요.
  · 취향_발음느낌=1.0 → 발음 느낌 선호가 무엇이었는지 명시하고 이 이름의 초성이 왜 그 느낌인지 설명
    예: "부드러운 발음을 원하셨는데, 이 이름은 첫 소리가 'ㅅ'으로 시작해 정말 부드럽게 들려요"
  · 취향_희귀도=1.0 → 희귀도 선호와 이름의 실제 등록 빈도를 연결해서 설명
    예: "독특한 이름을 원하셨는데, 이 이름은 전국 등록 빈도가 매우 낮아 희귀해요"
  · 취향_받침수=1.0 → 받침 조건과 실제 이름의 받침 구조를 구체적으로 언급
    예: "받침 없는 이름을 선호하신다고 하셨는데, 이 이름은 두 글자 모두 받침이 없어요"
  · 취향_발음이유=높음 → 발음을 중요하게 생각하신다고 했으니, 소리 기운 점수와 실제 발음 흐름을 연결
    예: "발음이 중요하다고 하셨는데, 이 이름은 소리 기운 점수가 높고 성씨와도 부드럽게 이어져요"
  · 취향_의미이유=높음 → 이름 뜻을 중시하신다고 했으니, 한자 기운과 구체적인 의미를 연결
    예: "뜻이 좋은 이름을 원하셨는데, 한자 기운이 잘 어우러지고 '○○'은 '~'를 뜻해요"
  · 점수가 0.0이면(취향 불일치) reason에 해당 항목을 언급하지 마세요.
- "취향에도 잘 맞아요"처럼 뭉뚱그리는 표현은 금지입니다. 어떤 취향의 어떤 요소가 맞는지 콕 집어 말하세요.
{f"- 형제자매 이름({', '.join(sibling_names)})과 계열 연속성 또는 다양성 선호를 파악해 반영하세요." if sibling_names else ""}
{("- 부모님 취향 메모의 '원하는 이름 느낌', '담고 싶은 의미', '피하고 싶은 조건'을 이름 선택과 reason 작성 시 반영하세요." if section3_lines else "")}

expert_commentary 작성 규칙:
- content 블록과 별개로, 세션 흐름을 해석하는 전문가 해설입니다. 응답 맨 앞에 표시됩니다.
- 포함해야 할 내용 (2~4문장):
  1. 취향 패턴: 지금까지 좋아요/싫어요에서 읽히는 패턴 (반응이 없으면 생략)
  2. 이번 방향 이유: 왜 이번에 이 방향으로 이름을 찾았는지
  3. 모드 전환이 있었다면: 전환 이유와 새 전략
- 신뢰도 조정 (현재 반응 수: {total_reactions}회):
  · 1~3회: "~인 것 같아요", "~처럼 보여요"
  · 4~7회: "~하시는 것 같아요", "~를 선호하시는 편이에요"
  · 8회 이상: "~을 확실히 좋아하세요", "지금까지 보면 분명히 ~"
- 반응이 없으면: 작명 방향 소개에 집중하세요. 예: "{direction} 방향으로 찾아봤어요. 마음에 드시는 이름엔 좋아요를 눌러주세요."
- 금지: 이름 직접 나열, 기계적 항목 반복, content 블록에 나올 이름을 미리 언급

응답 구성:
- content 배열에 TEXT 블록과 NAME_REF 블록을 섞어 자연스러운 대화 흐름을 만드세요. NAME_REF 블록은 최대 3개만 넣으세요.
- NAME_REF 블록 작성 규칙:
  · type은 반드시 "NAME_REF"로 설정하세요.
  · id는 툴이 반환한 후보 목록의 id 값을 그대로 사용하세요. 한자/의미/음절 등은 직접 생성하지 마세요.
  · reason에 이름 추천 이유를 쉬운 말로 작성하세요. score_breakdown의 높은 항목을 반영하세요.

사주 기운 프레이밍 (이름을 처음 추천할 때 첫 TEXT 블록에 포함):
- 사주 정보(보완 필요 기운)가 있으면, 이름 소개 전에 1~2문장으로 사주 맥락을 짚어주세요.
  예: "아이의 사주를 보면 금(金) 기운이 조금 부족한 편이라, 이름에서 금 기운을 담은 한자를 포함하는 쪽으로 찾아봤어요."
- 매 턴마다 반복하지 말고, 첫 추천이나 방향이 크게 바뀐 경우에만 언급하세요.
- 사주 정보가 없으면 생략하세요.

이름 reason 작성:
- score_breakdown 높은 항목 외에, 부모님이 원하는 느낌·의미와 어떻게 연결되는지도 포함하세요.
  예: "맑고 자연스러운 느낌을 원하셨는데, 소리가 부드럽고 받침이 없어 딱 맞아요."
  예: "강인하고 또렷한 느낌을 좋아하신다고 하셨는데, 초성이 힘차고 뜻도 '굳세다'는 의미예요."

마지막 CTA:
- NAME_REF 블록 이후 마지막 TEXT 블록에 반드시 다음 행동을 한 문장으로 제안하세요.
  예: "비슷한 느낌의 이름을 더 찾아드릴 수도 있고, 아예 새로운 방향으로 다시 찾아드릴 수도 있어요. 어떻게 해드릴까요?"
""".strip()
