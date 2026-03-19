"""agent.content_block_parser 단위 테스트."""

from __future__ import annotations

from agent.content_block_parser import extract_meta, parse_content_blocks


def test_parse_json_codeblock() -> None:
    raw = '```json\n{"content": [{"type": "TEXT", "data": {"text": "Hi"}}]}\n```'
    blocks = parse_content_blocks(raw)
    assert len(blocks) == 1
    assert blocks[0]["type"] == "TEXT"


def test_parse_plain_text_fallback() -> None:
    blocks = parse_content_blocks("hello world")
    assert blocks == [{"type": "TEXT", "data": {"text": "hello world"}}]


def test_parse_raw_json() -> None:
    raw = '{"content": [{"type": "TEXT", "data": {"text": "x"}}]}'
    blocks = parse_content_blocks(raw)
    assert len(blocks) == 1


def test_parse_json_invalid_content_fallback() -> None:
    raw = '```json\n{"content": "bad"}\n```'
    blocks = parse_content_blocks(raw)
    assert blocks[0]["type"] == "TEXT"


def test_extract_meta() -> None:
    raw = '```json\n{"content": [], "confirmed": true, "ready_to_proceed": false}\n```'
    meta = extract_meta(raw)
    assert meta.get("confirmed") is True
    assert "content" not in meta


def test_extract_meta_empty() -> None:
    assert extract_meta("no json here") == {}
