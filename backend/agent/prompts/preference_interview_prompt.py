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
        val = preference_profile.get(field)
        if val is not None:
            display = val if val else "(없음/상관없음으로 답변)"
            파악된_항목.append(f"- {label}: {display}")
        else:
            남은_항목.append(f"- {label}")

    # 선택적 취향 항목
    선택적_파악 = []
    if preference_profile.get("name_length"):
        선택적_파악.append(f"- 이름 글자 수: {preference_profile['name_length']}")
    if preference_profile.get("sibling_names"):
        선택적_파악.append(f"- 형제자매 이름: {', '.join(preference_profile['sibling_names'])}")

    파악된_text = "\n".join(파악된_항목) if 파악된_항목 else "- (아직 없음)"
    남은_text = "\n".join(남은_항목) if 남은_항목 else "- (모두 파악됨)"
    선택적_text = "\n".join(선택적_파악) if 선택적_파악 else ""

    # 돌림자가 있으면 이름 글자 수는 이미 결정됨 — 질문 불필요
    name_length_지시 = ""
    if not 돌림자 and not preference_profile.get("name_length"):
        name_length_지시 = "- 이름 글자 수(외자 vs 두글자) 선호도 대화 흐름에서 자연스럽게 파악하면 name_length에 저장하세요. 필수 질문은 아닙니다."

    sibling_지시 = ""
    if not preference_profile.get("sibling_names"):
        sibling_지시 = "- 형제자매가 있다면 이름을 파악해 sibling_names 목록에 저장하세요. 없으면 스킵합니다."

    return f"""
[현재 단계: 취향 인터뷰]{사주_text}

아이 기본 정보 (이미 확정 — preference_profile에 넣지 마세요):
{known_info_text}

{돌림자_지시}
{받침_지시}

현재까지 파악된 이름 취향 (preference_profile):
{파악된_text}
{선택적_text}

아직 파악되지 않은 취향 항목:
{남은_text}

역할: 사용자의 답변에서 이름 취향을 추출하고, 아직 파악되지 않은 항목을 자연스럽게 하나씩 질문하세요.
⚠️ preference_profile에는 이름 취향만 기록하세요 (name_feel, 받침_preference, max_받침_count, values, liked_sounds, disliked_sounds, avoid, extra, name_length, sibling_names).
   성씨·성별·생년월일 등 기본 정보는 절대 preference_profile에 넣지 마세요.
- 한 번에 하나의 질문만 하세요
- 남은 항목이 있으면 다음 항목을 자연스럽게 이어서 질문하세요
- 남은 항목이 없으면 짧게 마무리 멘트만 하세요 (다음 단계로 넘어가는 것은 시스템이 처리합니다)

⚠️ 필드 수집 규칙 — 중요:
- 사용자가 답변하면 반드시 해당 필드를 non-null 값으로 설정하세요. null/None으로 두면 아직 물어보지 않은 것으로 간주합니다.
  · "없어", "딱히 없어", "상관없어" → 빈 문자열 "" 또는 "상관없음" 등으로 설정
  · 값을 모르거나 애매하면 사용자 말 그대로 저장하세요

- 받침_preference는 "있음/없음/상관없음" 3가지로 제한하지 마세요. 사용자 표현을 그대로 담아 저장하세요.
  좋은 예: "두 글자 모두 받침 있는 건 피함", "한 글자만 받침 허용", "받침 없는 게 좋음", "상관없음"
  나쁜 예: null, ""
- 받침 관련 답변을 받으면 max_받침_count도 반드시 설정하세요 (실제 필터링에 사용됨):
  · 받침 없음 선호 → 0
  · 최대 1글자만 받침 허용 ("두 글자 모두 받침 있는 건 피함", "한 글자만 받침 허용" 등) → 1
  · 둘 다 받침 있어도 됨 / 상관없음 → 2 또는 null

⚠️ 수정(correction) 발생 시 처리:
- "아니아니", "잠깐만", "그게 아니라", "다시 말하면" 등 수정 표현이 나오면:
  1. 수정된 내용으로 해당 필드를 즉시 덮어쓰세요
  2. 수정이 완료되면 그 항목에 대해 다시 묻지 마세요
  3. 아직 파악 안 된 다음 항목으로 자연스럽게 넘어가세요
- 수정 후에도 null로 남기면 루프가 반복됩니다 — 반드시 업데이트된 값을 저장하세요
{name_length_지시}
{sibling_지시}
""".strip()
