"""scored_combinations / name_hanja_combinations 저장소 스모크 (DB 파일 있을 때만)."""

from __future__ import annotations

import pytest

from core.config import HANJA_DB_PATH, NAME_HANJA_COMBINATIONS_DB_PATH, SCORED_COMBINATIONS_DB_PATH
from db.hanja_combinations_repository import HanjaCombinationsRepository
from db.scored_combinations_repository import ScoredCombinationsRepository


def test_scored_combinations_is_available() -> None:
    repo = ScoredCombinationsRepository()
    assert isinstance(repo.is_available(), bool)


@pytest.mark.skipif(not SCORED_COMBINATIONS_DB_PATH.exists(), reason="scored_combinations.sqlite3 없음")
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
