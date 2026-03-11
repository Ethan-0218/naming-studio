from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    candidates = state.get("current_candidates", [])
    direction = state.get("naming_direction", "")

    candidates_text = ""
    if candidates:
        import json
        candidates_text = f"\n\n현재 후보 이름들:\n{json.dumps(candidates, ensure_ascii=False, indent=2)}"

    return f"""
[현재 단계: 초기 후보 추천]

작명 방향: {direction}{candidates_text}

위 후보 이름들을 바탕으로 부모님께 이름을 소개하세요.
한 번에 최대 3개의 이름만 추천하세요.
각 이름의 느낌, 의미, 좋은 점을 쉽고 따뜻하게 설명하세요.
전문용어 없이 부모님이 이해하기 쉬운 말로 설명하세요.

각 NAME_REF 블록 작성 규칙:
- type은 반드시 "NAME_REF"로 설정하세요.
- id는 위 후보 목록의 id 값을 그대로 사용하세요 (1, 2, 3 ...). 한자/의미/음절 등은 직접 생성하지 마세요.
- reason에 이름 추천 이유를 쉬운 말로 작성하세요. score_breakdown을 참고하세요:
  · 용신 점수가 높으면(≥0.8): "아이의 사주 에너지를 균형있게 채워줘요"
  · 자원오행 점수가 높으면(≥0.7): "한자의 기운이 서로 잘 어우러져요"
  · 수리격 점수가 높으면(≥0.7): "이름의 획수 흐름이 특히 좋아요"
  · 발음오행 점수가 높으면(≥0.7): "소리의 흐름이 부드럽고 힘차요"
  · syllables의 hanja_options를 참고해 "이 글자는 準(기준), 俊(뛰어날) 중 선택 가능해요"처럼 한자 선택지를 언급하세요.

content 배열에 TEXT 블록과 NAME_REF 블록을 섞어 자연스러운 대화 흐름을 만드세요. NAME_REF 블록은 최대 3개만 넣으세요.
updated_naming_direction는 빈 문자열로 설정하세요.
""".strip()
