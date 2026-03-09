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
각 이름의 느낌, 의미, 좋은 점을 쉽고 따뜻하게 설명하세요.
전문용어 없이 부모님이 이해하기 쉬운 말로 설명하세요.

content 배열에 TEXT 블록과 NAME 블록을 섞어 자연스러운 대화 흐름을 만드세요.
각 NAME 블록의 syllables에는 한글/한자/meaning/오행을 정확히 채워주세요.
request_new_candidates는 false로, updated_requirement_summary는 빈 문자열로 설정하세요.
""".strip()
