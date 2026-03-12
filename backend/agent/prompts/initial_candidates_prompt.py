from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    candidates = state.get("current_candidates", [])
    direction = state.get("naming_direction", "")
    preference = state.get("preference_profile", {})

    사주 = state.get("사주_summary") or {}
    사주_text = ""
    if 사주:
        부족한 = 사주.get("부족한_오행", [])
        일간 = 사주.get("일간_오행", "")
        신강신약 = 사주.get("신강신약", "")
        if 부족한:
            사주_text = f"\n아이 사주: {일간} 계열({신강신약}), 보완 필요 기운: {', '.join(부족한)}"

    section3_lines = []
    feel = preference.get("_section3_feel", "")
    values = preference.get("_section3_values", "")
    avoid = preference.get("_section3_avoid", "")
    if feel:
        section3_lines.append(f"원하는 이름 느낌: {feel}")
    if values:
        section3_lines.append(f"담고 싶은 의미·가치: {values}")
    if avoid:
        section3_lines.append(f"피하고 싶은 조건: {avoid}")
    section3_text = ("\n부모님 취향 메모:\n" + "\n".join(f"  · {l}" for l in section3_lines)) if section3_lines else ""

    candidates_text = ""
    if candidates:
        import json
        candidates_text = f"\n\n현재 후보 이름들:\n{json.dumps(candidates, ensure_ascii=False, indent=2)}"

    return f"""
[현재 단계: 초기 후보 추천]

작명 방향: {direction}{사주_text}{section3_text}{candidates_text}

위 후보 이름들을 바탕으로 부모님께 이름을 소개하세요.
한 번에 최대 3개의 이름만 추천하세요.
각 이름의 느낌, 의미, 좋은 점을 쉽고 따뜻하게 설명하세요.
전문용어 없이 부모님이 이해하기 쉬운 말로 설명하세요.

expert_commentary 작성 규칙:
- 첫 이름 소개 전 전문가 오리엔테이션 (2~3문장).
- 부모님 취향 인터뷰 내용을 바탕으로 왜 이 방향으로 이름을 골랐는지 설명하세요.
- 아직 반응이 없으므로 확신 없이 제안하는 말투를 사용하세요.
  예: "말씀해 주신 조건들을 바탕으로 {direction} 방향으로 찾아봤어요. 마음에 드는 이름이 있으면 좋아요를, 아닌 이름엔 별로를 눌러주시면 더 잘 맞는 이름으로 좁혀드릴 수 있어요."
- 사주 정보가 있으면 아이의 에너지를 한 문장으로 언급하세요.
- content 블록에 나올 이름을 미리 언급하지 마세요.

사주 기운 프레이밍 (첫 TEXT 블록에 포함):
- 사주 정보(보완 필요 기운)가 있으면, 이름 소개 전에 1~2문장으로 맥락을 짚어주세요.
  예: "아이의 사주를 보면 수(水) 기운이 조금 부족한 편이라, 이름에서 그 기운을 담을 수 있는 한자를 위주로 골랐어요."
- 사주 정보가 없으면 생략하세요.

각 NAME_REF 블록 작성 규칙:
- type은 반드시 "NAME_REF"로 설정하세요.
- id는 위 후보 목록의 id 값을 그대로 사용하세요 (1, 2, 3 ...). 한자/의미/음절 등은 직접 생성하지 마세요.
- reason에 이름 추천 이유를 쉬운 말로 작성하세요. score_breakdown을 참고하세요:
  · 용신 점수가 높으면(≥0.8): "아이의 사주 에너지를 균형있게 채워줘요"
  · 자원오행 점수가 높으면(≥0.7): "한자의 기운이 서로 잘 어우러져요"
  · 수리격 점수가 높으면(≥0.7): "이름의 획수 흐름이 특히 좋아요"
  · 발음오행 점수가 높으면(≥0.7): "소리의 흐름이 부드럽고 힘차요"
  · syllables의 hanja_options를 참고해 "이 글자는 準(기준), 俊(뛰어날) 중 선택 가능해요"처럼 한자 선택지를 언급하세요.
- 부모님 취향 메모가 있으면, 각 이름이 그 취향과 어떻게 연결되는지도 reason에 포함하세요.
  예: "맑고 자연스러운 느낌을 원하셨는데, 소리가 부드럽고 받침이 없어 딱 맞아요."

마지막 CTA:
- NAME_REF 블록 이후 마지막 TEXT 블록에 다음 행동을 한 문장으로 제안하세요.
  예: "비슷한 느낌의 이름을 더 보고 싶으시거나, 아예 다른 방향으로 찾고 싶으시면 말씀해 주세요!"

content 배열에 TEXT 블록과 NAME_REF 블록을 섞어 자연스러운 대화 흐름을 만드세요. NAME_REF 블록은 최대 3개만 넣으세요.
updated_naming_direction는 빈 문자열로 설정하세요.
""".strip()
