from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    user_info = state.get("user_info", {})
    사주 = state.get("사주_summary")
    preference = state.get("preference_profile", {})

    surname = user_info.get("surname", "")
    gender = user_info.get("gender", "")

    사주_text = ""
    if 사주:
        사주_text = f"아이의 에너지 성향: {사주.get('일간_오행', '')} 계열, {사주.get('신강신약', '')}, 보완 에너지: {', '.join(사주.get('부족한_오행', []))}"

    돌림자 = user_info.get("돌림자", "")
    돌림자_한자 = user_info.get("돌림자_한자", "")
    돌림자_text = f"{돌림자_한자}({돌림자})자" if 돌림자 else "없음"

    # 구조화 취향만 표시 (서술형 필드는 naming_direction으로 통합됨)
    pref_lines = []
    if preference.get("hanja_preference"):
        pref_lines.append(f"한자/순우리말: {preference['hanja_preference']}")
    if preference.get("rarity_preference") and preference["rarity_preference"] != "상관없음":
        pref_lines.append(f"희귀도: {preference['rarity_preference']}")
    if preference.get("sibling_names"):
        pref_lines.append(f"형제자매 이름: {', '.join(preference['sibling_names'])}")
    if preference.get("max_받침_count") is not None:
        pref_lines.append(f"받침 제한: 최대 {preference['max_받침_count']}개")
    pref_text = "\n".join(f"  - {l}" for l in pref_lines) if pref_lines else "  - (없음)"

    naming_direction = state.get("naming_direction") or ""
    direction_text = f"\n이미 수집된 방향 초안: {naming_direction}" if naming_direction else ""

    return f"""
[현재 단계: 작명 방향 브리핑]

수집된 정보:
- 성씨: {user_info.get('surname_hanja', '')}{surname}씨 / 성별: {'아들' if gender == '남' else '딸'}
- 돌림자: {돌림자_text}
- {사주_text}
- 구조화 취향:
{pref_text}{direction_text}

지금까지 파악한 정보를 종합해 작명 방향성을 새롭게 정리해 설명하세요.
방향성이란 취향 정보를 단순 나열하는 게 아니라, 어떤 느낌·에너지·의미의 이름을 찾을 것인지 전문가적 시각으로 해석한 접근법입니다.
예: "부드러운 울림에 강인한 의미를 담은 이름", "물과 나무의 에너지를 가진 받침 없는 이름"

⚠️ 취향 항목을 그대로 나열하지 마세요. 파악한 취향을 작명 전문가로서 해석해 방향성 문장으로 제시하세요.
⚠️ 절대 구체적인 이름(예: 민준, 서연 등)을 이 단계에서 제안하지 마세요.
방향성을 설명하고, 마지막에 이 방향으로 진행해도 좋을지 부모님께 간단히 확인만 하세요.

naming_direction 필드에 작명 방향을 한 문장으로 요약하세요.
""".strip()
