from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    direction = state.get("naming_direction", "")
    return f"""
[현재 단계: 방향 확인]

작명 방향: {direction}

사용자에게 이 방향으로 진행할지 물어보세요.
- 동의하면: <json>{{"confirmed": true}}</json>
- 수정 요청이면: <json>{{"confirmed": false, "feedback": "수정 내용"}}</json>

수정 요청이 있을 경우 피드백을 반영해 방향을 조정하겠다고 안내하세요.
""".strip()
