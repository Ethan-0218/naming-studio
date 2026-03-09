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

    feedback_text = ""
    if existing_direction:
        feedback_text = f"\n\n이전에 제안한 방향: {existing_direction}\n사용자가 수정을 요청했습니다. 피드백을 반영해 새로운 방향을 제안하세요."

    return f"""
[현재 단계: 방향 확인]

수집된 정보:
- 성씨: {user_info.get('surname_hanja', '')}{surname}씨 / 성별: {'아들' if gender == '남' else '딸'}{돌림자_text}{사주_text}
- 취향 프로필: {preference}
{feedback_text}

지금까지 수집한 정보를 바탕으로 작명 방향을 제안하고 부모님의 확인을 받으세요.

방향 제안 방법:
- 취향 항목을 그대로 나열하지 말고, 전문가적 시각으로 해석해 방향성 문장으로 제시하세요.
- 예: "물과 나무 에너지가 조화된 강하고 독특한 이름", "받침 없이 부드럽게 울리는 따뜻한 이름"
- ⚠️ 절대 구체적인 이름을 제안하지 마세요.
- 방향 설명 후 "이 방향으로 진행해도 괜찮으신가요?" 라고 확인하세요.

사용자 응답 판단:
- 이전에 제안한 방향(naming_direction)이 없으면 → 이번이 첫 제안이므로 반드시 confirmed=False
- 이전 방향이 있고 사용자가 "좋아", "괜찮아", "그렇게 해줘", "응", "레쓰고", "가보자" 등 긍정 → confirmed=True
- 수정 요청이나 다른 방향 언급 → confirmed=False, feedback에 내용 기록
- 이전 방향이 있고 애매한 경우 → confirmed=True로 처리 (우선 진행)

naming_direction 필드에 이번에 제안하는 방향을 한 문장으로 요약하세요.
""".strip()
