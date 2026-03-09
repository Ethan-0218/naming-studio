"""LLM 응답 → ContentBlock 배열 파싱."""

import json
import re


def parse_content_blocks(llm_response: str) -> list[dict]:
    """LLM 응답에서 JSON 객체를 추출하고 content 배열을 반환합니다.
    파싱 실패 시 텍스트 전체를 TEXT 블록 하나로 반환.
    """
    # JSON 코드 블록 시도
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", llm_response, re.DOTALL)
    if match:
        json_str = match.group(1)
    else:
        # 응답 전체가 JSON인 경우 시도
        stripped = llm_response.strip()
        if stripped.startswith("{"):
            json_str = stripped
        else:
            return [{"type": "TEXT", "data": {"text": llm_response}}]

    try:
        data = json.loads(json_str)
        content = data.get("content", [])
        if isinstance(content, list) and content:
            return content
        return [{"type": "TEXT", "data": {"text": llm_response}}]
    except (json.JSONDecodeError, ValueError):
        return [{"type": "TEXT", "data": {"text": llm_response}}]


def extract_meta(llm_response: str) -> dict:
    """LLM 응답에서 content 외 메타 필드를 추출합니다.
    반환: {request_new_candidates, candidate_filters, updated_requirement_summary, confirmed, ready_to_proceed}
    """
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", llm_response, re.DOTALL)
    if match:
        json_str = match.group(1)
    else:
        stripped = llm_response.strip()
        json_str = stripped if stripped.startswith("{") else ""

    if not json_str:
        return {}

    try:
        data = json.loads(json_str)
        return {k: v for k, v in data.items() if k != "content"}
    except (json.JSONDecodeError, ValueError):
        return {}
