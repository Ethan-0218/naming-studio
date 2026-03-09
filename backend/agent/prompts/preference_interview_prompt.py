from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    사주 = state.get("사주_summary")
    user_info = state.get("user_info", {})

    사주_text = ""
    if 사주:
        사주_text = f"""
아이의 에너지 성향 분석이 완료되었습니다:
- 일간 에너지: {사주.get('일간_오행', '')} 계열
- 에너지 강도: {사주.get('신강신약', '')}
- 보완이 필요한 에너지: {', '.join(사주.get('부족한_오행', []))}
"""

    surname = user_info.get("surname", "")
    gender = user_info.get("gender", "")
    돌림자 = user_info.get("돌림자", "")
    돌림자_한자 = user_info.get("돌림자_한자", "")

    known_info_lines = []
    if surname:
        known_info_lines.append(f"- 성씨: {user_info.get('surname_hanja', '')}{surname}씨")
    if gender:
        known_info_lines.append(f"- 성별: {'아들' if gender == '남' else '딸'}")
    if 돌림자:
        known_info_lines.append(f"- 돌림자: {돌림자_한자}({돌림자}) — 이미 확정됨")
    known_info_text = "\n".join(known_info_lines)

    has_받침 = False
    if 돌림자:
        code = ord(돌림자[0]) - 0xAC00
        if 0 <= code <= 11171:
            has_받침 = (code % 28) != 0

    받침_지시 = ""
    if 돌림자:
        if has_받침:
            받침_지시 = f"※ 돌림자 '{돌림자}'에 받침이 있으므로 받침에 대해 다시 묻지 마세요."
        else:
            받침_지시 = f"※ 돌림자 '{돌림자}'에 받침이 없으므로, 나머지 글자의 받침 선호만 물어볼 수 있습니다."

    돌림자_지시 = ""
    if 돌림자:
        돌림자_지시 = f"※ 돌림자는 이미 {돌림자_한자}({돌림자})자로 확정되어 있습니다. 돌림자에 대해 다시 묻거나 확인하지 마세요."

    # 현재까지 파악된 취향 프로필
    preference_profile = state.get("preference_profile", {})
    파악된_항목 = []
    남은_항목 = []

    field_labels = {
        "name_feel": "이름의 느낌",
        "받침_preference": "받침 선호",
        "values": "이름에 담고 싶은 의미/가치",
    }

    for field, label in field_labels.items():
        if preference_profile.get(field):
            파악된_항목.append(f"- {label}: {preference_profile[field]}")
        else:
            남은_항목.append(f"- {label}")

    파악된_text = "\n".join(파악된_항목) if 파악된_항목 else "- (아직 없음)"
    남은_text = "\n".join(남은_항목) if 남은_항목 else "- (모두 파악됨)"

    return f"""
[현재 단계: 취향 인터뷰]{사주_text}

아이 기본 정보 (이미 확정 — preference_profile에 넣지 마세요):
{known_info_text}

{돌림자_지시}
{받침_지시}

현재까지 파악된 이름 취향 (preference_profile):
{파악된_text}

아직 파악되지 않은 취향 항목:
{남은_text}

역할: 사용자의 답변에서 이름 취향을 추출하고, 아직 파악되지 않은 항목을 자연스럽게 하나씩 질문하세요.
⚠️ preference_profile에는 이름 취향만 기록하세요 (name_feel, 받침_preference, values, liked_sounds, disliked_sounds, avoid, extra).
   성씨·성별·생년월일 등 기본 정보는 절대 preference_profile에 넣지 마세요.
- 한 번에 하나의 질문만 하세요
- 남은 항목이 있으면 다음 항목을 자연스럽게 이어서 질문하세요
- 남은 항목이 없으면 짧게 마무리 멘트만 하세요 (다음 단계로 넘어가는 것은 시스템이 처리합니다)
""".strip()
