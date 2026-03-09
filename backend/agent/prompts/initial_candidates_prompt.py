from agent.state import NamingState

_CONTENT_BLOCK_FORMAT = """
응답은 반드시 아래 JSON 형식으로 반환하세요:
{
  "content": [
    {"type": "TEXT", "data": {"text": "자연스러운 대화 텍스트"}},
    {"type": "NAME", "data": {
        "한글": "지우",
        "full_name": "김지우",
        "syllables": [
            {"한글": "지", "한자": "智", "meaning": "지혜", "오행": "금"},
            {"한글": "우", "한자": "宇", "meaning": "우주", "오행": "토"}
        ],
        "발음오행_조화": "대길",
        "rarity_signal": "보통",
        "reason": "맑고 단정한 인상",
        "hanja_options": []
    }},
    ...
  ],
  "request_new_candidates": false,
  "candidate_filters": {},
  "updated_requirement_summary": ""
}
content 배열을 순서대로 읽으면 자연스러운 대화가 되어야 합니다.
"""


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

{_CONTENT_BLOCK_FORMAT}
""".strip()
