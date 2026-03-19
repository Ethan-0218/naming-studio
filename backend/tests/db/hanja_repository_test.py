# hanja.sqlite3 기반 HanjaRepository 통합 테스트

import pytest

from core.config import HANJA_DB_PATH
from db import Hanja, HanjaRepository


def _hanja_db_exists() -> bool:
    return HANJA_DB_PATH.exists()


@pytest.mark.skipif(not _hanja_db_exists(), reason="hanja.sqlite3 not found")
class TestHanjaRepository:
    def test_get_by_id(self) -> None:
        repo = HanjaRepository()
        row = repo.get_by_id(1)
        assert row is not None
        assert row.id == 1
        assert row.hanja == "可"
        assert "옳을" in row.mean
        assert row.eum == "가"
        assert row.original_stroke_count == 5
        assert row.sound_based_yin_yang == "양"
        assert row.is_family_hanja is False

    def test_get_by_id_missing(self) -> None:
        repo = HanjaRepository()
        assert repo.get_by_id(999999) is None

    def test_get_by_hanja(self) -> None:
        repo = HanjaRepository()
        row = repo.get_by_hanja("可")
        assert row is not None
        assert row.hanja == "可"
        assert "옳을" in row.mean
        assert row.eum == "가"

    def test_get_by_hanja_missing(self) -> None:
        repo = HanjaRepository()
        assert repo.get_by_hanja("A") is None  # 한자 테이블에 없는 문자

    def test_search_by_mean(self) -> None:
        repo = HanjaRepository()
        results = repo.search_by_mean("가", limit=10)
        assert isinstance(results, list)
        assert len(results) <= 10
        for h in results:
            assert isinstance(h, Hanja)
            assert "가" in h.mean

    def test_search_by_eum(self) -> None:
        repo = HanjaRepository()
        results = repo.search_by_eum("가", limit=5)
        assert isinstance(results, list)
        assert len(results) <= 5
        for h in results:
            assert isinstance(h, Hanja)
            assert "가" in h.eum

    def test_search_by_mean_limit(self) -> None:
        repo = HanjaRepository()
        results = repo.search_by_mean("다", limit=3)
        assert len(results) <= 3
