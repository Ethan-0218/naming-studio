from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    import json
    from agent import name_store

    session_id = state.get("session_id", "")
    liked = name_store.get_liked(session_id)
    disliked = name_store.get_disliked(session_id)
    direction = state.get("naming_direction", "")
    candidates = state.get("current_candidates", [])
    preference = state.get("preference_profile", {})
    sibling_names = preference.get("sibling_names") if preference else None

    liked_text = f"좋아요한 이름: {', '.join(liked)}" if liked else "좋아요한 이름: 없음"
    disliked_text = f"싫어요한 이름: {', '.join(disliked)}" if disliked else "싫어요한 이름: 없음"
    sibling_text = f"\n형제자매 이름: {', '.join(sibling_names)}" if sibling_names else ""

    pref_lines = []
    if preference.get("max_받침_count") is not None:
        pref_lines.append(f"받침 제한: 최대 {preference['max_받침_count']}개")
    if preference.get("name_length"):
        pref_lines.append(f"이름 길이: {preference['name_length']}")
    if preference.get("rarity_preference") and preference["rarity_preference"] != "상관없음":
        pref_lines.append(f"희귀도: {preference['rarity_preference']}")
    pref_text = ("\n" + "\n".join(pref_lines)) if pref_lines else ""

    return f"""
[현재 단계: 이름 탐색]

현재 작명 방향: {direction}{pref_text}
{liked_text}
{disliked_text}{sibling_text}

【방향/취향 변경 감지 — 최우선 처리】
유저가 이름 스타일·느낌·기운·의미·받침 조건·이름 길이 중 하나라도 변경 요청하면 반드시 아래를 채우세요:
- updated_naming_direction: 기존 방향에서 변경된 부분만 교체 (증분 업데이트). 나머지는 그대로 유지.
  예: "강한 느낌의 건강한 이름" + "부드럽고 여성스러운 이름으로 바꿔줘" → "부드럽고 여성스러운 느낌의 건강한 이름"
  예: "부드럽고 수기운 이름" + "목기운으로 바꿔줘" → "부드럽고 목기운 이름"
- updated_preference_fields: 변경된 필드만 채우세요 (변경 없으면 null).
  · 받침 조건 변경 → max_받침_count (0=없음, 1=최대1개, 2=제한없음)
  · 이름 길이 변경 → name_length ("외자", "두글자", "상관없음")
  · 느낌/스타일 변경 → name_feel ("부드러운", "강한", "중성적" 등)
변경 없으면 updated_naming_direction은 빈 문자열, updated_preference_fields는 모든 필드 null.

사용자의 반응을 분석해 취향을 파악하고, 그에 맞는 이름을 자연스럽게 추천하거나 대화를 이어가세요. 한 번에 최대 3개의 이름만 추천하세요.

후보 조회 (get_name_candidates 툴):
- 현재 대화 맥락에서 추천할 만한 이름이 충분하지 않으면 툴을 호출하세요.
- 툴 파라미터로 취향을 반영하세요:
  · 좋아요 이름들 초성이 ㅅㄴㅁㅇㅎㄹ → name_feel_preference="soft"
  · 좋아요 이름들 초성이 ㅂㄱㄷㅈㅊ → name_feel_preference="strong"
  · 받침 제한 있으면 max_받침_count 설정
- 이미 본 이름은 툴이 자동으로 제외합니다.
- 한 번 조회로 충분하면 툴 없이 바로 추천 가능. 최대 3회 호출.

score_breakdown 활용:
- 좋아요/싫어요 이름의 score_breakdown을 비교해 취향 패턴을 파악하세요.
  (예: 좋아요한 이름들이 자원오행 점수가 높으면 → 한자 기운을 중시하는 취향)
- 각 NAME 블록의 reason에 score_breakdown의 높은 항목을 쉬운 말로 반영하세요.
- syllables의 hanja_options를 참고해 한자 선택지를 안내할 수 있습니다.
{f"- 형제자매 이름({', '.join(sibling_names)})과 계열 연속성 또는 다양성 선호를 파악해 반영하세요." if sibling_names else ""}

응답 구성:
- content 배열에 TEXT 블록과 NAME_REF 블록을 섞어 자연스러운 대화 흐름을 만드세요. NAME_REF 블록은 최대 3개만 넣으세요.
- NAME_REF 블록 작성 규칙:
  · type은 반드시 "NAME_REF"로 설정하세요.
  · id는 툴이 반환한 후보 목록의 id 값을 그대로 사용하세요. 한자/의미/음절 등은 직접 생성하지 마세요.
  · reason에 이름 추천 이유를 쉬운 말로 작성하세요. score_breakdown의 높은 항목을 반영하세요.
""".strip()
