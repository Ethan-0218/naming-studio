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

    return f"""
[현재 단계: 작명 방향 브리핑]

성씨: {surname}, 성별: {gender}
{사주_text}
취향 프로필: {preference}

지금까지 파악한 정보를 바탕으로 작명 방향을 명확하고 친근하게 브리핑하세요.
다음을 자연스럽게 포함하세요:
- 아이의 타고난 에너지 특성 (쉬운 말로)
- 이름에서 보완하면 좋을 에너지 방향
- 부모님이 원하는 이름의 느낌
- 구체적인 작명 방향 제안 (발음, 느낌, 의미 등)

브리핑 후 확인을 요청하세요. 이 단계에서 JSON 없이 자연스러운 대화만 합니다.

작명 방향을 <naming_direction> 태그 안에 요약해 포함하세요:
<naming_direction>
(작명 방향 요약 텍스트)
</naming_direction>
""".strip()
