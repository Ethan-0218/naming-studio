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

    liked_text = f"좋아요한 이름: {', '.join(liked)}" if liked else "좋아요한 이름: 없음"
    disliked_text = f"싫어요한 이름: {', '.join(disliked)}" if disliked else "싫어요한 이름: 없음"
    summary_text = f"누적 요구사항 요약: {requirement_summary}" if requirement_summary else "누적 요구사항 요약: (아직 없음)"
    candidates_text = f"\n현재 후보들:\n{json.dumps(candidates, ensure_ascii=False, indent=2)}" if candidates else ""

    return f"""
[현재 단계: 이름 탐색]

작명 방향: {direction}
{liked_text}
{disliked_text}
{summary_text}{candidates_text}

사용자의 반응을 분석해 취향을 파악하고, 그에 맞는 이름을 자연스럽게 추천하거나 대화를 이어가세요.

응답 구성:
- content 배열에 TEXT 블록과 NAME 블록을 섞어 자연스러운 대화 흐름을 만드세요.
- 새로운 이름이 필요하면 request_new_candidates=True, candidate_filters에 필터 지정.
- updated_requirement_summary를 매 턴마다 최신 누적 요약으로 업데이트하세요.
  예: "부드럽고 받침 없는 이름을 선호하며, 너무 흔한 이름은 피하고 싶어함."
""".strip()
