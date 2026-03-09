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

    # 취향 프로필을 사람이 읽기 좋게 정리
    pref_lines = []
    pref_labels = {
        "name_feel": "이름 느낌",
        "받침_preference": "받침 선호",
        "values": "담고 싶은 의미",
        "liked_sounds": "좋아하는 발음",
        "disliked_sounds": "피하는 발음",
        "avoid": "피하고 싶은 특징",
        "name_length": "글자 수",
        "extra": "기타",
    }
    for key, label in pref_labels.items():
        val = preference.get(key)
        if val:
            pref_lines.append(f"  · {label}: {val}")
    pref_text = "\n".join(pref_lines) if pref_lines else "  · (수집된 취향 없음)"

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
message 필드는 반드시 3~5문장 이상의 충분한 분량으로 작성하세요. 한두 문장으로 줄이지 마세요.

1. 대화 내용을 자연스럽게 요약하세요 (1~2문장).
2. 작명 방향을 구체적으로 설명하세요 (2~3문장). 부모님이 "왜 이런 방향인지" 납득할 수 있어야 합니다.
   - 사주·에너지 정보가 있으면: 아이에게 어떤 에너지가 부족하고, 이름이 그걸 어떻게 채워줄 수 있는지 쉬운 말로 설명하세요.
   - 취향 정보가 있으면: 느낌, 받침, 의미 선호가 어떻게 이름에 반영될지 연결해서 설명하세요.
   - 한자의 기운, 소리 흐름, 획수 균형 중 특별히 중요하게 볼 것이 있으면 언급하세요.
   ⚠️ 구체적인 이름(예: 준서, 하은)은 절대 언급하지 마세요.
3. 마지막 문장은 반드시 "이 방향으로 진행할까요?" 또는 "이렇게 찾아드릴까요?"로 마무리하세요.

[좋은 예시]
"잘생기고 세련된 느낌의 이름을 원하시고, 두 글자 모두 받침이 있는 건 피하고 싶다고 하셨죠. 아드님의 사주를 보니 화(火) 에너지가 강한 편이라, 이름에서 물(水)이나 나무(木) 기운을 보완해주면 균형이 잡힐 것 같아요. 소리도 또렷하고 기억에 남으면서, 한자 뜻도 긍정적인 이름을 중심으로 찾아드리겠습니다. 이 방향으로 진행할까요?"

[confirmed 판단 규칙]
- 이전에 제안한 방향(naming_direction)이 없으면 → 첫 제안이므로 반드시 confirmed=False
- 이전 방향이 있고 사용자가 "좋아", "응", "괜찮아", "그렇게 해줘", "가보자" 등 긍정 → confirmed=True
- 수정 요청이나 다른 방향 요청 → confirmed=False, feedback에 요청 내용 기록
- 이전 방향이 있고 애매한 경우 → confirmed=True

naming_direction 필드에 이번 제안 방향을 한 문장으로 요약하세요.
""".strip()
