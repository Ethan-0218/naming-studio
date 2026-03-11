from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    """탐색 중 유저 메시지에서 취향 변경을 감지하고 naming_direction을 갱신."""
    direction = state.get("naming_direction", "")
    preference = state.get("preference_profile", {})

    pref_lines = []
    if preference.get("name_length"):
        pref_lines.append(f"이름 길이: {preference['name_length']}")
    if preference.get("max_받침_count") is not None:
        pref_lines.append(f"받침 제한: 최대 {preference['max_받침_count']}개")
    if preference.get("rarity_preference") and preference["rarity_preference"] != "상관없음":
        pref_lines.append(f"희귀도: {preference['rarity_preference']}")
    pref_text = "\n".join(f"  · {l}" for l in pref_lines) if pref_lines else "  · (없음)"

    return f"""
[역할: 취향 변경 감지]

현재 작명 방향: {direction}
구조화 취향:
{pref_text}

유저의 마지막 메시지를 분석해 naming_direction을 갱신하세요.

【갱신 규칙】
- 이름 방향·느낌·기운·스타일·의미 등 취향을 언급하면 기존 방향에 반영해 갱신
- "도 추천해봐", "추가해줘" 등 추가 요청 → 기존 방향과 통합 (예: "A하거나 B한 이름")
- "바꿔줘", "로 해줘" 등 교체 요청 → 새 방향으로 교체 (구조 조건은 유지)
- 좋아요/싫어요/재추천/새 이름 요청 등 반응만 → 기존 방향 그대로

【구조화 조건 갱신 규칙】
- 받침 조건 변경 요청 → max_받침_count 설정
- 이름 길이 변경 요청 → name_length 설정
- 변경 없으면 null

【예시】
현재: "강인한 느낌의 두 글자 이름"
유저: "부드럽고 여성스러운 이름도 추천해봐"
→ naming_direction: "강인하거나 부드럽고 여성스러운 느낌의 두 글자 이름"

현재: "강인한 느낌의 두 글자 이름"
유저: "이번엔 부드러운 이름으로 바꿔줘"
→ naming_direction: "부드러운 느낌의 두 글자 이름"

현재: "부드러운 두 글자 이름"
유저: "받침 없는 이름으로 해줘"
→ naming_direction: "부드러운 받침 없는 두 글자 이름", max_받침_count: 0

현재: "부드러운 이름"
유저: "이 이름은 마음에 드는데 이건 별로야" (반응만)
→ naming_direction: "부드러운 이름" (변경 없음)
""".strip()
