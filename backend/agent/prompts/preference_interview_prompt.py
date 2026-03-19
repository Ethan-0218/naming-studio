from agent.state import NamingState


def build_welcome_message_prompt(state: NamingState) -> str:
    """세션 시작 시 사주 기반 개인화 환영인사 생성용 프롬프트.

    submit_info로 사주가 이미 주어진 상태에서 preference_interview 첫 턴에 호출된다.
    LLM이 사주 에너지를 쉬운 말로 풀어 2~3문장의 따뜻한 환영인사를 생성해야 한다.
    """
    from agent.persona import PERSONA_DESCRIPTION, PERSONA_CONSTRAINTS

    사주 = state.get("사주_summary")
    user_info = state.get("user_info", {})

    surname = user_info.get("surname", "")
    gender = "아들" if user_info.get("gender") == "남" else "딸"

    오행_한글 = {"목": "나무", "화": "불", "토": "흙", "금": "금", "수": "물"}

    사주_lines = []
    if 사주:
        일간_오행 = 사주.get("일간_오행", "")
        신강신약 = 사주.get("신강신약", "")
        억부용신 = 사주.get("억부용신", "")
        부족한_오행 = 사주.get("부족한_오행", [])

        if 일간_오행:
            사주_lines.append(f"- 타고난 기운: {오행_한글.get(일간_오행, 일간_오행)} 기운 ({신강신약})")
        if 억부용신:
            사주_lines.append(f"- 이름으로 채워주면 좋은 기운: {오행_한글.get(억부용신, 억부용신)} 기운")
        if 부족한_오행:
            부족_설명 = ", ".join(오행_한글.get(o, o) for o in 부족한_오행)
            사주_lines.append(f"- 부족한 기운: {부족_설명}")

    사주_section = (
        "아이의 에너지 정보 (전문용어를 쓰지 말고 쉬운 말로만 풀어서 활용하세요):\n"
        + "\n".join(사주_lines)
        if 사주_lines
        else ""
    )

    return f"""{PERSONA_DESCRIPTION}

{PERSONA_CONSTRAINTS}

당신의 역할: 아래 아이 정보와 에너지 정보를 바탕으로, 부모님께 직접 따뜻한 환영 인사말을 작성하세요.

아이 정보:
- 성씨: {surname}씨
- 성별: {gender}

{사주_section}

작성 규칙:
- 지금 바로 부모님께 말을 건네듯 자연스럽게 작성하세요 (설명이나 요약이 아닌 실제 인사말).
- 2~3문장으로 짧고 친근하게 작성하세요.
- 사주 전문용어(일간, 신강신약, 억부용신 등)는 절대 쓰지 마세요.
- 아이의 타고난 에너지를 일상적인 언어로 한 문장에 녹이세요.
- 이름짓기를 함께 시작하겠다는 말과, 이어서 몇 가지 취향을 여쭤볼 것임을 자연스럽게 안내하며 마무리하세요.
""".strip()


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
