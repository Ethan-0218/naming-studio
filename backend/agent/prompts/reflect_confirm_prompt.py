from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    direction = state.get("naming_direction", "")
    preference = state.get("preference_profile", {})

    pref_lines = []
    if preference.get("max_받침_count") is not None:
        pref_lines.append(f"받침 제한: 최대 {preference['max_받침_count']}개")
    if preference.get("rarity_preference") and preference["rarity_preference"] != "상관없음":
        pref_lines.append(f"희귀도: {preference['rarity_preference']}")
    if preference.get("name_feel_preference"):
        feel_label = "부드러운 발음(ㅅㄴㅁㅇㅎㄹ 계열)" if preference["name_feel_preference"] == "soft" else "강한 발음(ㅂㄱㄷㅈㅊ 계열)"
        pref_lines.append(f"발음 느낌: {feel_label}")
    pref_text = ("\n업데이트된 선호 사항:\n" + "\n".join(f"  · {l}" for l in pref_lines)) if pref_lines else ""

    exploration_mode = state.get("exploration_mode") or "안정형"
    mode_reason = state.get("_exploration_mode_reason")
    mode_text = f"\n현재 탐색 모드: {exploration_mode}"
    if mode_reason:
        mode_text += f" (전환 이유: {mode_reason})"

    return f"""
[현재 단계: 피드백 반영 확인]

현재 작명 방향: {direction}{pref_text}{mode_text}

사용자가 방금 추천 이름에 대한 피드백을 남겼습니다.
다음 세 가지를 순서대로 담은 2~3문장의 짧은 응답을 작성하세요:

1. 반문 (1문장): 사용자의 피드백을 자연스럽게 해석하는 질문이나 공감
   예: "음... 이름이 조금 강한 느낌이어서 별로라고 하신 걸까요?"
   예: "발음이 딱딱하게 느껴지셨나요?"
   예: "좋아요! 이런 느낌의 이름이 마음에 드시는군요."

2. 방향 설명 (1문장): 다음 이름을 어떤 방향으로 찾을지 한 줄로 설명
   예: "그럼 좀 더 부드럽고 따뜻한 느낌의 이름으로 찾아볼게요."
   예: "이번에는 희귀하고 독특한 이름으로 찾아드릴게요."

3. 확인 질문 (1문장): 새 이름 추천 여부를 확인
   항상 "이 방향으로 새로운 이름을 찾아드릴까요?" 형태로 마무리하세요.

간결하게 2~3문장 이내로 작성하세요. 이름을 직접 언급하거나 추천하지 마세요.
""".strip()
