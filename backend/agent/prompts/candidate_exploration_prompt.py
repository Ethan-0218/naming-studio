from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    import json
    from agent import name_store

    session_id = state.get("session_id", "")
    liked = name_store.get_liked(session_id)
    disliked = name_store.get_disliked(session_id)
    requirement_summary = state.get("requirement_summary", "")
    direction = state.get("naming_direction", "")
    candidates = state.get("current_candidates", [])
    preference = state.get("preference_profile", {})
    sibling_names = preference.get("sibling_names") if preference else None

    liked_text = f"좋아요한 이름: {', '.join(liked)}" if liked else "좋아요한 이름: 없음"
    disliked_text = f"싫어요한 이름: {', '.join(disliked)}" if disliked else "싫어요한 이름: 없음"
    summary_text = f"누적 요구사항 요약: {requirement_summary}" if requirement_summary else "누적 요구사항 요약: (아직 없음)"
    sibling_text = f"\n형제자매 이름: {', '.join(sibling_names)}" if sibling_names else ""

    return f"""
[현재 단계: 이름 탐색]

작명 방향: {direction}
{liked_text}
{disliked_text}
{summary_text}{sibling_text}

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
- updated_requirement_summary를 매 턴마다 최신 누적 요약으로 업데이트하세요.
  예: "부드럽고 받침 없는 이름을 선호하며, 너무 흔한 이름은 피하고 싶어함."
""".strip()
