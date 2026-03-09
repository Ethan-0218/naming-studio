from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    missing = state.get("missing_info_fields", [])
    user_info = state.get("user_info", {})

    collected_text = ""
    if user_info:
        parts = []
        if user_info.get("surname"):
            parts.append(f"성씨: {user_info['surname']}")
        if user_info.get("gender"):
            parts.append(f"성별: {user_info['gender']}")
        if user_info.get("birth_date"):
            parts.append(f"생년월일: {user_info['birth_date']}")
        if user_info.get("birth_time"):
            parts.append(f"출생시간: {user_info['birth_time']}")
        if parts:
            collected_text = f"\n현재 수집된 정보: {', '.join(parts)}"

    missing_text = ""
    if missing:
        field_names = {
            "surname": "성씨",
            "gender": "성별",
            "birth_date": "생년월일(양력/음력 구분 포함)",
            "birth_time": "출생시간(모르면 '모름' 응답 가능)",
        }
        missing_korean = [field_names.get(f, f) for f in missing]
        missing_text = f"\n아직 수집 안 된 정보: {', '.join(missing_korean)}"

    return f"""
[현재 단계: 기본 정보 수집]{collected_text}{missing_text}

아직 받지 못한 정보를 자연스러운 대화로 물어보세요.
한 번에 너무 많이 묻지 말고, 자연스럽게 한두 가지씩 여쭤보세요.
성별은 "아들"/"딸" 등 자연스러운 표현도 인식하세요.
생년월일은 양력/음력 여부도 함께 확인하세요.
출생시간은 "모름"도 허용됩니다.
돌림자가 있다면 알려달라고 부탁하세요.

수집한 정보는 반드시 아래 JSON 형식으로 응답 마지막에 포함하세요:
<json>
{{
  "user_info_update": {{
    "surname": "김",
    "gender": "남",
    "birth_date": "2024-03-15",
    "birth_time": "14:30",
    "is_lunar": false,
    "돌림자": ""
  }}
}}
</json>
수집되지 않은 필드는 포함하지 마세요.
""".strip()
