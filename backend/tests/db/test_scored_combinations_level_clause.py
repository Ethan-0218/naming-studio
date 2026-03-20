"""ScoredCombinationsRepository 등급 과락 SQL 조각 (DB 불필요)."""

from db.scored_combinations_repository import ScoredCombinationsRepository


def test_level_exclude_clause_empty() -> None:
    sql, params = ScoredCombinationsRepository._level_exclude_clause(None)
    assert sql == ""
    assert params == []


def test_level_exclude_clause_ignores_unknown_column() -> None:
    sql, params = ScoredCombinationsRepository._level_exclude_clause({"not_a_column": {"凶"}})
    assert sql == ""
    assert params == []


def test_level_exclude_clause_single_column() -> None:
    sql, params = ScoredCombinationsRepository._level_exclude_clause(
        {"jawon_ohaeng_level": {"凶", "大凶"}},
    )
    assert "sc.jawon_ohaeng_level NOT IN" in sql
    assert set(params) == {"凶", "大凶"}
