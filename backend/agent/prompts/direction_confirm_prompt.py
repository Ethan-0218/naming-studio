from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    user_info = state.get("user_info", {})
    사주 = state.get("사주_summary")
    preference = state.get("preference_profile", {})
    existing_direction = state.get("naming_direction")

    surname = user_info.get("surname", "")
    gender = user_info.get("gender", "")
    돌림자 = user_info.get("돌림자", "")
    돌림자_한자 = user_info.get("돌림자_한자", "")

    사주_text = ""
    if 사주:
        사주_text = f"\n- 에너지 성향: {사주.get('일간_오행', '')} 계열, {사주.get('신강신약', '')}, 보완 에너지: {', '.join(사주.get('부족한_오행', []))}"

    돌림자_text = f"\n- 돌림자: {돌림자_한자}({돌림자})" if 돌림자 else ""

    # 구조화 취향만 표시 (서술형 취향은 naming_direction으로 통합됨)
    pref_lines = []
    if preference.get("hanja_preference"):
        pref_lines.append(f"한자/순우리말: {preference['hanja_preference']}")
    if preference.get("rarity_preference") and preference["rarity_preference"] != "상관없음":
        pref_lines.append(f"희귀도: {preference['rarity_preference']}")
    if preference.get("max_받침_count") is not None:
        pref_lines.append(f"받침 제한: 최대 {preference['max_받침_count']}개")
    pref_text = "\n".join(f"  · {l}" for l in pref_lines) if pref_lines else "  · (없음)"

    sibling_names = preference.get("sibling_names")
    sibling_text = f"\n  · 형제자매 이름: {', '.join(sibling_names)}" if sibling_names else ""

    if existing_direction:
        mode = "revision"
        mode_text = f"""
이전에 제안한 방향: {existing_direction}
사용자가 수정을 요청했습니다. 피드백을 반영해 새로운 방향을 제안하고, 반드시 "이 방향으로 진행할까요?" 로 확인받으세요.
"""
    else:
        mode = "first"
        mode_text = ""

    return f"""
[현재 단계: 방향 확인]

지금까지 파악한 내용:
- 아이: {user_info.get('surname_hanja', '')}{surname}씨 {'아들' if gender == '남' else '딸'}{돌림자_text}{사주_text}
- 이름 취향:
{pref_text}{sibling_text}
{mode_text}
작명 방향을 제안하고 부모님의 확인을 받으세요.

[메시지 작성 지침]
message 필드는 마크다운을 사용해 아래 구조로 작성하세요:

1. 먼저 "### 파악한 취향" 헤더와 함께 취향을 불릿 포인트로 정리하세요.
   - 이름 느낌, 아이의 모습, 피하고 싶은 것, 형제자매 이름 등 파악된 항목만 포함하세요.
   - 해당하는 항목이 없으면 그 항목은 생략하세요.
2. 빈 줄 후, 2~3문장으로 작명 방향을 자연스럽게 설명하세요.
   - 사주·에너지 정보가 있으면: 아이에게 어떤 에너지가 부족하고, 이름이 그걸 어떻게 채워줄 수 있는지 쉬운 말로 설명하세요.
   - 취향 정보가 있으면: 느낌, 받침, 의미 선호가 어떻게 이름에 반영될지 연결해서 설명하세요.
   ⚠️ 구체적인 이름(예: 준서, 하은)은 절대 언급하지 마세요.
3. 빈 줄 후, 마지막 줄은 반드시 "이 방향으로 진행할까요?" 또는 "이렇게 찾아드릴까요?"로 마무리하세요.

[좋은 예시]
### 파악한 취향
- 이름 느낌: 지적인, 강인한
- 아이의 모습: 총명하게, 리더십 있게
- 피하고 싶은 것: 받침 많은 이름

아드님의 사주를 보니 화(火) 에너지가 강한 편이라, 이름에서 물(水)이나 나무(木) 기운을 보완해주면 균형이 잡힐 것 같아요. 또렷하고 강인한 느낌의 소리에, 지혜롭고 기개 있는 한자 뜻을 담아 찾아드리겠습니다.

이 방향으로 진행할까요?

[confirmed 판단 규칙]
- 이전에 제안한 방향(naming_direction)이 없으면 → 첫 제안이므로 반드시 confirmed=False
- 이전 방향이 있고 사용자가 "좋아", "응", "괜찮아", "그렇게 해줘", "가보자" 등 긍정 → confirmed=True
- 수정 요청이나 다른 방향 요청 → confirmed=False, feedback에 요청 내용 기록
- 이전 방향이 있고 애매한 경우 → confirmed=True

naming_direction 필드에 이번 제안 방향을 한 문장으로 요약하세요.
""".strip()
