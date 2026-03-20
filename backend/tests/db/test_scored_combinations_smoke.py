"""scored_combinations / name_hanja_combinations 저장소 스모크 (DB 파일 있을 때만)."""

from __future__ import annotations

import sqlite3

import pytest

from core.config import HANJA_DB_PATH, NAME_HANJA_COMBINATIONS_DB_PATH, SCORED_COMBINATIONS_DB_PATH
from db.hanja_combinations_repository import HanjaCombinationsRepository
from db.scored_combinations_repository import ScoredCombinationsRepository


def _scored_db_has_yongshin_column() -> bool:
    if not SCORED_COMBINATIONS_DB_PATH.exists():
        return False
    with sqlite3.connect(SCORED_COMBINATIONS_DB_PATH) as conn:
        rows = conn.execute("PRAGMA table_info(scored_combinations)").fetchall()
    return any(r[1] == "yongshin" for r in rows)


def test_scored_combinations_is_available() -> None:
    repo = ScoredCombinationsRepository()
    assert isinstance(repo.is_available(), bool)


def test_get_best_combination_empty_required_ohaengs() -> None:
    repo = ScoredCombinationsRepository()
    assert repo.get_best_combination("金", ["민수"], [], gender="male") == {}


def test_get_top_names_empty_required_ohaengs() -> None:
    repo = ScoredCombinationsRepository()
    assert repo.get_top_names("金", "male", [], limit=5) == []


@pytest.mark.skipif(not SCORED_COMBINATIONS_DB_PATH.exists(), reason="scored_combinations.sqlite3 없음")
@pytest.mark.skipif(not _scored_db_has_yongshin_column(), reason="scored_combinations 스키마에 yongshin 없음(재생성 필요)")
@pytest.mark.skipif(not HANJA_DB_PATH.exists(), reason="hanja.sqlite3 없음")
def test_get_best_combination_minimal() -> None:
    ScoredCombinationsRepository._hanja_cache = None  # noqa: SLF001
    repo = ScoredCombinationsRepository()
    if not repo.is_available():
        return
    out = repo.get_best_combination(
        surname_hanja="金",
        names=["민수"],
        required_ohaengs=["수"],
        gender="male",
    )
    assert isinstance(out, dict)


@pytest.mark.skipif(not NAME_HANJA_COMBINATIONS_DB_PATH.exists(), reason="name_hanja_combinations.sqlite3 없음")
@pytest.mark.skipif(not HANJA_DB_PATH.exists(), reason="hanja.sqlite3 없음")
def test_hanja_combinations_bulk() -> None:
    HanjaCombinationsRepository._hanja_cache = None  # noqa: SLF001
    repo = HanjaCombinationsRepository()
    out = repo.get_combinations_bulk(["민수"])
    assert isinstance(out, dict)
