from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    """취향 인터뷰 완료 후 naming_direction 초안 생성용 프롬프트."""
    사주 = state.get("사주_summary")
    user_info = state.get("user_info", {})
    profile = state.get("preference_profile", {})

    사주_text = ""
    if 사주:
        사주_text = f"""
아이의 사주 에너지 성향:
- 일간: {사주.get('일간_오행', '')} 계열, {사주.get('신강신약', '')}
- 보완이 필요한 오행: {', '.join(사주.get('부족한_오행', []))}
"""

    surname = user_info.get("surname", "")
    gender = "아들" if user_info.get("gender") == "남" else "딸"
    돌림자 = user_info.get("돌림자", "")
    돌림자_text = f"돌림자: {user_info.get('돌림자_한자', '')}({돌림자})" if 돌림자 else ""

    # 구조화 취향
    struct_lines = []
    if profile.get("name_length"):
        struct_lines.append(f"이름 길이: {profile['name_length']}")
    if profile.get("hanja_preference"):
        struct_lines.append(f"한자/순우리말: {profile['hanja_preference']}")
    if profile.get("rarity_preference") and profile["rarity_preference"] != "상관없음":
        struct_lines.append(f"이름 희귀도: {profile['rarity_preference']}")
    if profile.get("sibling_names"):
        sibling_line = f"형제자매 이름: {', '.join(profile['sibling_names'])}"
        anchors = profile.get("sibling_anchor_syllables")
        if anchors:
            sibling_line += f" (공통 앵커: {'·'.join(anchors)} → 이름에 포함 우선)"
        struct_lines.append(sibling_line)
    elif profile.get("sibling_names") == []:
        struct_lines.append("형제자매: 없음")

    # 서술형 취향 (Section 3 칩 선택값)
    feel = profile.get("_section3_feel", "")
    values = profile.get("_section3_values", "")
    avoid = profile.get("_section3_avoid", "")

    struct_text = "\n".join(f"- {l}" for l in struct_lines) if struct_lines else "- (없음)"

    return f"""
[취향 인터뷰 완료 — 작명 방향 초안 생성]
{사주_text}
아이 정보: {user_info.get('surname_hanja', '')}{surname}씨 {gender}{(', ' + 돌림자_text) if 돌림자_text else ''}

구조화된 취향:
{struct_text}

부모님이 선택한 이름 느낌: {feel or '(선택 없음)'}
부모님이 선택한 담고 싶은 의미: {values or '(선택 없음)'}
부모님이 선택한 피하고 싶은 조건: {avoid or '(선택 없음)'}

위 정보를 종합해 작명 방향을 한 문장으로 요약하세요.
단순 취향 나열이 아니라, 아이의 사주 에너지와 부모님의 바람을 녹여낸 방향성 문장이어야 합니다.
예: "물과 나무 기운을 보완해주는 받침 없는 부드러운 이름" / "밝고 지적인 느낌에 건강과 지혜를 담은 두 글자 이름"
""".strip()
