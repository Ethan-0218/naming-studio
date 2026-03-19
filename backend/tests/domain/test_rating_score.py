"""domain.rating_score 단위 테스트."""

from __future__ import annotations

import domain.rating_score as rating_score


def test_load_and_cache() -> None:
    rating_score._캐시 = None  # noqa: SLF001
    a = rating_score.load()
    b = rating_score.load()
    assert a is b
    assert isinstance(a, dict)


def test_to_score_known() -> None:
    d = rating_score.load()
    if not d:
        return
    first_key = next(iter(d))
    assert rating_score.to_score(first_key) == d[first_key]


def test_to_score_unknown_returns_neutral() -> None:
    assert rating_score.to_score("__no_such_rating_key__") == 0.5
