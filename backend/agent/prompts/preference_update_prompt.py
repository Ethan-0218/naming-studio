from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    """탐색 중 유저 메시지에서 취향 변경을 감지하고 naming_direction과 탐색 모드를 갱신."""
    direction = state.get("naming_direction", "")
    preference = state.get("preference_profile", {})
    current_mode = state.get("exploration_mode") or "안정형"

    pref_lines = []
    if preference.get("max_받침_count") is not None:
        pref_lines.append(f"받침 제한: 최대 {preference['max_받침_count']}개")
    if preference.get("rarity_preference") and preference["rarity_preference"] != "상관없음":
        pref_lines.append(f"희귀도: {preference['rarity_preference']}")
    if preference.get("name_feel_preference"):
        feel_label = "부드러운 발음" if preference["name_feel_preference"] == "soft" else "강한 발음"
        pref_lines.append(f"발음 느낌: {feel_label}")
    pref_text = "\n".join(f"  · {l}" for l in pref_lines) if pref_lines else "  · (없음)"

    reason_profile = state.get("reason_taste_profile") or {}
    narrative_hints = reason_profile.get("narrative_hints", [])
    dominant_likes = reason_profile.get("dominant_like", [])
    dominant_dislikes = reason_profile.get("dominant_dislike", [])
    hints_text = "\n".join(f"  · {h}" for h in narrative_hints) if narrative_hints else "  · (없음)"

    return f"""
[역할: 취향 변경 감지]

현재 작명 방향: {direction}
구조화 취향:
{pref_text}
현재 탐색 모드: {current_mode}

이유 기반 취향 분석:
{hints_text}

유저의 마지막 메시지를 분석해 naming_direction, 구조화 조건, 탐색 모드를 갱신하세요.

【naming_direction 갱신 규칙】
- 이름 방향·느낌·기운·스타일·의미 등 취향을 언급하면 기존 방향에 반영해 갱신
- "도 추천해봐", "추가해줘" 등 추가 요청 → 기존 방향과 통합 (예: "A하거나 B한 이름")
- "바꿔줘", "로 해줘" 등 교체 요청 → 새 방향으로 교체 (구조 조건은 유지)
- 좋아요/싫어요/재추천/새 이름 요청 등 반응만 → 기존 방향 그대로

【구조화 조건 갱신 규칙】
- 받침 조건 변경 요청 → max_받침_count 설정
- "희귀한", "독특한", "특이한" 등 요청 → rarity_preference: "독특한"
- "흔한", "평범한", "친숙한" 등 요청 → rarity_preference: "평범한"
- "부드러운 발음", "부드러운 느낌의 이름" 등 발음 자체가 부드럽길 요청 → name_feel_preference: "soft"
- "강한 발음", "강인한 발음", "또렷한 발음" 등 발음 자체가 강하길 요청 → name_feel_preference: "strong"
- ⚠️ name_feel_preference는 발음/초성 느낌을 명시적으로 언급할 때만 설정. 이름의 이미지·느낌·스타일 전반을 말하는 것은 naming_direction에만 반영.
- 변경 없으면 null

【탐색 모드 전환 규칙】
탐색 모드는 사용자의 반복 피드백 패턴이나 이유 기반 취향 분석을 바탕으로 전환합니다.
현재 대화 흐름과 위 이유 기반 취향 분석을 종합해 판단하세요.

모드 전환 기준:
- "흔하다", "다 비슷하다", "너무 평범하다" 등 반응이 반복되면 → "확장형"
- "낯설다", "어렵다", "부르기 불편하다", "너무 특이하다" 등이 반복되면 → "안정형"
- dominant_like 또는 dominant_dislike에 "pronunciation"(발음) 관련이 포함되면 → "발음형"
- dominant_like 또는 dominant_dislike에 "meaning"(의미/뜻) 관련이 포함되면 → "의미형"
- dominant_like 또는 dominant_dislike에 "surname_harmony"(성씨·가족 조화) 관련이 포함되면 → "가족조화형"
- 이미 현재 모드와 동일한 방향이거나 뚜렷한 패턴이 없으면 → null (유지)
- 유저가 명시적으로 방향 전환을 요청한 경우 우선 적용

현재 dominant_like: {dominant_likes}
현재 dominant_dislike: {dominant_dislikes}

모드 전환 시 exploration_mode_reason에 자연스러운 한 문장 방향 전환 제안을 작성하세요.
  예: "지금까지 반응을 보면 조금 더 독특하고 세련된 방향으로 넓혀보는 게 좋겠어요."
  예: "발음을 중요하게 생각하시는 것 같아서, 이제 소리 흐름이 좋은 이름 위주로 찾아볼게요."
exploration_mode가 null이면 exploration_mode_reason도 반드시 null로 설정하세요.

【예시】
현재: "강인한 느낌의 두 글자 이름"
유저: "부드럽고 여성스러운 이름도 추천해봐"
→ naming_direction: "강인하거나 부드럽고 여성스러운 느낌의 두 글자 이름", name_feel_preference: null (이미지 표현이지 발음 요청 아님)

현재: "강인한 느낌의 두 글자 이름"
유저: "받침 없는 부드러운 발음의 이름으로 해줘"
→ naming_direction: "부드러운 발음의 받침 없는 두 글자 이름", max_받침_count: 0, name_feel_preference: "soft"

현재: "부드러운 두 글자 이름"
유저: "좀 더 희귀한 이름으로 해줘"
→ naming_direction: "부드러운 두 글자 이름", rarity_preference: "독특한"

현재: "부드러운 이름", 모드: "안정형", dominant_dislike: ["pronunciation"]
유저: "이번에도 발음이 좀 별로인 것 같아요"
→ naming_direction: "부드러운 이름" (변경 없음), exploration_mode: "발음형",
   exploration_mode_reason: "발음에 신경 쓰시는 것 같아서, 소리 흐름이 좋은 이름 위주로 찾아볼게요."

현재: "부드러운 이름"
유저: "이 이름은 마음에 드는데 이건 별로야" (반응만, 패턴 없음)
→ naming_direction: "부드러운 이름" (변경 없음), 모든 조건 null
""".strip()
