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

    # 이미 수집된 정보 정리
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

    # 돌림자 받침 여부 계산 (받침 있으면 받침 선호 질문 생략 지시)
    has_받침 = False
    if 돌림자:
        code = ord(돌림자[0]) - 0xAC00
        if 0 <= code <= 11171:
            has_받침 = (code % 28) != 0

    받침_지시 = ""
    if 돌림자:
        if has_받침:
            받침_지시 = f"※ 돌림자 '{돌림자}'에 받침이 있으므로 받침 선호는 이미 결정된 것이나 다름없습니다. 받침에 대해 다시 묻지 마세요."
        else:
            받침_지시 = f"※ 돌림자 '{돌림자}'에 받침이 없으므로, 나머지 글자의 받침 선호만 자연스럽게 물어볼 수 있습니다."

    돌림자_지시 = ""
    if 돌림자:
        돌림자_지시 = f"※ 돌림자는 이미 {돌림자_한자}({돌림자})자로 확정되어 있습니다. 돌림자에 대해 다시 묻거나 확인하지 마세요."

    return f"""
[현재 단계: 취향 인터뷰]{사주_text}

이미 수집된 정보:
{known_info_text}

{돌림자_지시}
{받침_지시}

아이 이름에 대한 부모님의 취향과 바람을 자연스럽게 인터뷰하세요.
아래 항목 중 아직 파악되지 않은 것만 대화 흐름에 맞게 물어보세요:
- 이름의 느낌 (부드러운/강한/중성적 등)
- 받침 선호 (이미 결정된 경우 생략)
- 특별히 좋아하거나 싫어하는 발음
- 이름에 담고 싶은 의미나 가치
- 피하고 싶은 이름의 특징

최소 3번의 대화를 나눈 후, 충분히 파악이 됐다고 판단되면 JSON으로 신호를 보내세요.
취향 파악이 충분하면:
<json>
{{"ready_to_proceed": true, "preference_profile": {{...수집된 취향...}}}}
</json>
아직 더 물어봐야 한다면:
<json>
{{"ready_to_proceed": false}}
</json>
""".strip()
