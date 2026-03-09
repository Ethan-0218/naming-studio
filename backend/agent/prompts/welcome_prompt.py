from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    return """
[현재 단계: 환영 인사]

사용자를 따뜻하게 환영하고, 아이 이름을 함께 찾아드릴 것을 소개하세요.
다음에 성씨, 성별, 생년월일을 여쭤볼 것임을 자연스럽게 안내하세요.
한두 문장으로 짧고 친근하게 인사하세요.
""".strip()
