from agent.state import NamingState


def build_stage_prompt(state: NamingState) -> str:
    사주 = state.get("사주_summary")
    사주_text = ""
    if 사주:
        사주_text = f"""
아이의 에너지 성향 분석이 완료되었습니다:
- 일간 에너지: {사주.get('일간_오행', '')} 계열
- 에너지 강도: {사주.get('신강신약', '')}
- 보완이 필요한 에너지: {', '.join(사주.get('부족한_오행', []))}
"""

    return f"""
[현재 단계: 취향 인터뷰]{사주_text}

아이 이름에 대한 부모님의 취향과 바람을 자연스럽게 인터뷰하세요.
다음 항목들을 대화 흐름에 맞게 자연스럽게 물어보세요:
- 이름의 느낌 (부드러운/강한/중성적 등)
- 받침 선호 (있는 이름/없는 이름/상관없음)
- 특별히 좋아하거나 싫어하는 발음
- 이름에 담고 싶은 의미나 가치
- 돌림자 사용 여부 (이미 수집됐다면 확인)
- 피하고 싶은 이름의 특징

최소 3번의 대화를 나눈 후, 충분히 파악이 됐다고 판단되면 JSON으로 신호를 보내세요.
취향 파악이 충분하면:
<json>
{{"ready_to_proceed": true, "preference_profile": {{...수집된 취향...}}}}
</json>
아직 더 물어봐야 한다면:
<json>
{{"ready_to_proceed": false}}
</json>
""".strip()
