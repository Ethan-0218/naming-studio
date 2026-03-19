# registered_name.sqlite3 기반 RegisteredNameRepository 통합 테스트

import pytest

from core.config import REGISTERED_NAME_DB_PATH
from db import RegisteredName, RegisteredNameRepository
from domain.saju.성별 import 성별


def _registered_name_db_exists() -> bool:
    return REGISTERED_NAME_DB_PATH.exists()


@pytest.mark.skipif(
    not _registered_name_db_exists(), reason="registered_name.sqlite3 not found"
)
class TestRegisteredNameRepository:
    def test_get_by_id(self) -> None:
        repo = RegisteredNameRepository()
        row = repo.get_by_id(1)
        assert row is not None
        assert row.id == 1
        assert row.name == "서준"
        assert row.count == 25043
        assert row.gender == 성별.남
        assert row.gender.value == "남"

    def test_get_by_id_missing(self) -> None:
        repo = RegisteredNameRepository()
        assert repo.get_by_id(999999) is None

    def test_find_by_name(self) -> None:
        repo = RegisteredNameRepository()
        results = repo.find_by_name("서준")
        assert isinstance(results, list)
        assert len(results) >= 1
        first = results[0]
        assert isinstance(first, RegisteredName)
        assert first.name == "서준"
        assert first.count == 25043
        assert first.gender == 성별.남

    def test_find_by_name_limit(self) -> None:
        repo = RegisteredNameRepository()
        results = repo.find_by_name("서준", limit=1)
        assert len(results) <= 1

    def test_find_by_gender_male(self) -> None:
        repo = RegisteredNameRepository()
        results = repo.find_by_gender(성별.남, limit=5)
        assert isinstance(results, list)
        assert len(results) <= 5
        for r in results:
            assert isinstance(r, RegisteredName)
            assert r.gender == 성별.남
            assert r.gender.value == "남"

    def test_find_by_gender_female(self) -> None:
        repo = RegisteredNameRepository()
        results = repo.find_by_gender(성별.여, limit=5)
        assert isinstance(results, list)
        assert len(results) <= 5
        for r in results:
            assert isinstance(r, RegisteredName)
            assert r.gender == 성별.여
            assert r.gender.value == "여"

    def test_find_by_gender_limit(self) -> None:
        repo = RegisteredNameRepository()
        results = repo.find_by_gender(성별.남, limit=2)
        assert len(results) <= 2

    def test_find_by_gender_ordered_by_count_desc(self) -> None:
        repo = RegisteredNameRepository()
        results = repo.find_by_gender(성별.남, limit=10)
        if len(results) >= 2:
            assert results[0].count >= results[1].count
