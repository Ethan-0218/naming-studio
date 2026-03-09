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
  "candidate_filters": {
    "preferred_오행": null,
    "require_받침": null,
    "rarity_preference": null
  },
  "updated_requirement_summary": "누적 요약 텍스트"
}
request_new_candidates가 true이면 새로운 후보를 불러옵니다.
candidate_filters는 새 후보 검색 시 적용할 필터입니다.
updated_requirement_summary는 이번 대화를 반영한 누적 요약입니다.
"""


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

사용자의 반응(좋아요/싫어요)을 분석해 취향을 파악하고,
그에 맞는 이름을 자연스럽게 추천하거나 대화를 이어가세요.

새로운 이름이 필요하면 request_new_candidates를 true로 설정하고
candidate_filters에 원하는 필터를 지정하세요.

매 응답마다 updated_requirement_summary를 업데이트해
누적된 취향 요약을 최신 상태로 유지하세요.
예: "부드럽고 받침 없는 이름을 선호하며, 너무 흔한 이름은 피하고 싶어함."

{_CONTENT_BLOCK_FORMAT}
""".strip()
