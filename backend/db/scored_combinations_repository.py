# scored_combinations.sqlite3 접근 레포지토리

import sqlite3
from pathlib import Path

from core.config import HANJA_DB_PATH, SCORED_COMBINATIONS_DB_PATH
from db.hanja_model import Hanja
from db.hanja_repository import _row_to_hanja


class ScoredCombinationsRepository:
    """scored_combinations.sqlite3 접근 레포지토리.

    (surname_hanja, name, required_ohaeng) 키로 사전 계산된 상위 한자 조합을
    단일 SQL 조회로 반환한다. hanja 객체는 hanja_cache를 통해 조회한다.
    """

    _hanja_cache: dict[int, Hanja] | None = None

    def __init__(
        self,
        scored_db_path: Path | None = None,
        hanja_db_path: Path | None = None,
    ) -> None:
        self._scored_db_path = scored_db_path or SCORED_COMBINATIONS_DB_PATH
        self._hanja_db_path = hanja_db_path or HANJA_DB_PATH

    @classmethod
    def _ensure_hanja_cache(cls, hanja_db_path: Path) -> dict[int, Hanja]:
        """hanja 전체를 메모리에 로드 (프로세스당 1회)."""
        if cls._hanja_cache is None:
            conn = sqlite3.connect(hanja_db_path)
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM hanja").fetchall()
            conn.close()
            cls._hanja_cache = {row["id"]: _row_to_hanja(row) for row in rows}
        return cls._hanja_cache

    def is_available(self) -> bool:
        """scored_combinations DB 파일이 존재하는지 확인합니다."""
        return self._scored_db_path.exists()

    def get_best_combination(
        self,
        surname_hanja: str,
        names: list[str],
        required_ohaengs: list[str],
    ) -> dict[str, tuple["Hanja", "Hanja", float, bool]]:
        """(성씨, 이름 목록, 용신오행 목록)으로 이름별 최고점 한자 조합을 반환합니다.

        1) required_ohaengs 중 하나를 커버하는 조합 중 MAX(score) rank=1 조합 우선.
        2) 없으면 '_all' (오행 무관 최상위 조합) 반환.

        Returns:
            {이름: (hanja1, hanja2, precomputed_score, ohaeng_covered)} 형태.
            ohaeng_covered=True이면 용신 커버됨, False이면 커버 안 됨.
            사전 DB에 없는 이름은 결과에 포함되지 않음.
        """
        if not names:
            return {}

        cache = self._ensure_hanja_cache(self._hanja_db_path)
        name_placeholders = ",".join("?" * len(names))

        result: dict[str, tuple[Hanja, Hanja, float, bool]] = {}

        with sqlite3.connect(self._scored_db_path) as conn:
            conn.row_factory = sqlite3.Row

            # 1단계: 용신 오행 커버 조합 조회
            if required_ohaengs:
                ohaeng_placeholders = ",".join("?" * len(required_ohaengs))
                params_ohaeng: list = [surname_hanja] + names + required_ohaengs
                ohaeng_rows = conn.execute(
                    f"""
                    SELECT name, hanja1_id, hanja2_id, MAX(score) as score
                    FROM scored_combinations
                    WHERE surname_hanja = ?
                      AND name IN ({name_placeholders})
                      AND required_ohaeng IN ({ohaeng_placeholders})
                      AND rank = 1
                    GROUP BY name
                    """,
                    params_ohaeng,
                ).fetchall()
                for row in ohaeng_rows:
                    h1 = cache.get(row["hanja1_id"])
                    h2 = cache.get(row["hanja2_id"])
                    if h1 and h2:
                        result[row["name"]] = (h1, h2, row["score"], True)

            # 2단계: 커버 못 된 이름은 '_all' 조합으로 폴백
            uncovered = [n for n in names if n not in result]
            if uncovered:
                all_placeholders = ",".join("?" * len(uncovered))
                params_all: list = [surname_hanja] + uncovered
                all_rows = conn.execute(
                    f"""
                    SELECT name, hanja1_id, hanja2_id, score
                    FROM scored_combinations
                    WHERE surname_hanja = ?
                      AND name IN ({all_placeholders})
                      AND required_ohaeng = '_all'
                      AND rank = 1
                    """,
                    params_all,
                ).fetchall()
                for row in all_rows:
                    h1 = cache.get(row["hanja1_id"])
                    h2 = cache.get(row["hanja2_id"])
                    if h1 and h2:
                        result[row["name"]] = (h1, h2, row["score"], False)

        return result

    def get_covered_names(
        self,
        surname_hanja: str,
        names: list[str],
    ) -> set[str]:
        """사전 DB에 존재하는 이름 집합을 반환합니다 (폴백 대상 식별용)."""
        if not names:
            return set()

        placeholders = ",".join("?" * len(names))
        with sqlite3.connect(self._scored_db_path) as conn:
            rows = conn.execute(
                f"SELECT DISTINCT name FROM scored_combinations "
                f"WHERE surname_hanja = ? AND name IN ({placeholders})",
                [surname_hanja] + names,
            ).fetchall()
        return {r[0] for r in rows}
