"""System prompt 빌더. stage별 파일에서 함수를 import해 조합."""

from agent.persona import PERSONA_DESCRIPTION, PERSONA_CONSTRAINTS
from agent.state import NamingState


def build_system_prompt(state: NamingState) -> str:
    """현재 stage에 맞는 system prompt를 반환합니다."""
    base = f"{PERSONA_DESCRIPTION}\n\n{PERSONA_CONSTRAINTS}\n\n"
    stage = state.get("stage", "welcome")

    if stage == "welcome":
        from agent.prompts.welcome_prompt import build_stage_prompt
    elif stage == "info_collection":
        from agent.prompts.info_collection_prompt import build_stage_prompt
    elif stage == "preference_interview":
        from agent.prompts.preference_interview_prompt import build_stage_prompt
    elif stage == "direction_briefing":
        from agent.prompts.direction_briefing_prompt import build_stage_prompt
    elif stage == "direction_confirm":
        from agent.prompts.direction_confirm_prompt import build_stage_prompt
    elif stage == "initial_candidates":
        from agent.prompts.initial_candidates_prompt import build_stage_prompt
    elif stage == "payment_gate":
        from agent.prompts.welcome_prompt import build_stage_prompt  # fallback
    elif stage == "candidate_exploration":
        from agent.prompts.candidate_exploration_prompt import build_stage_prompt
    else:
        from agent.prompts.welcome_prompt import build_stage_prompt

    return base + build_stage_prompt(state)
