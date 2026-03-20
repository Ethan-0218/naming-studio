# scored_combinations.sqlite3 접근 레포지토리

import sqlite3
from pathlib import Path

from core.config import HANJA_DB_PATH, SCORED_COMBINATIONS_DB_PATH, REGISTERED_NAME_DB_PATH
from db.hanja_model import Hanja
from db.hanja_repository import _row_to_hanja


class ScoredCombinationsRepository:
    """scored_combinations.sqlite3 접근 레포지토리.

    (surname_hanja, name, yongshin) 키로 사전 계산된 상위 한자 조합을
    단일 SQL 조회로 반환한다. hanja 객체는 hanja_cache를 통해 조회한다.
    """

    _hanja_cache: dict[int, Hanja] | None = None

    def __init__(
        self,
        scored_db_path: Path | None = None,
        hanja_db_path: Path | None = None,
        registered_name_db_path: Path | None = None,
    ) -> None:
        self._scored_db_path = scored_db_path or SCORED_COMBINATIONS_DB_PATH
        self._hanja_db_path = hanja_db_path or HANJA_DB_PATH
        self._registered_name_db_path = registered_name_db_path or REGISTERED_NAME_DB_PATH

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
        gender: str = "male",  # "male" | "female"
    ) -> dict[str, tuple["Hanja", "Hanja", float, bool]]:
        """(성씨, 이름 목록, 용신 오행)으로 이름별 최고점 한자 조합을 반환합니다.

        required_ohaengs: 억부용신 등 조회할 yongshin 값(보통 1개). 비어 있으면 {} 반환.
        yongshin IN (required_ohaengs) 인 행 중 rank=1 조합의 MAX(score)를 이름별로 반환.

        Returns:
            {이름: (hanja1, hanja2, precomputed_score, ohaeng_covered)} 형태.
            ohaeng_covered는 호환용으로 항상 True.
            사전 DB에 없는 이름은 결과에 포함되지 않음.
        """
        if not names or not required_ohaengs:
            return {}

        cache = self._ensure_hanja_cache(self._hanja_db_path)
        name_placeholders = ",".join("?" * len(names))

        result: dict[str, tuple[Hanja, Hanja, float, bool]] = {}

        with sqlite3.connect(self._scored_db_path) as conn:
            conn.row_factory = sqlite3.Row

            ohaeng_placeholders = ",".join("?" * len(required_ohaengs))
            params_ohaeng: list = [surname_hanja, gender] + names + required_ohaengs
            ohaeng_rows = conn.execute(
                f"""
                SELECT name, hanja1_id, hanja2_id, MAX(score) as score
                FROM scored_combinations
                WHERE surname_hanja = ?
                  AND gender = ?
                  AND name IN ({name_placeholders})
                  AND yongshin IN ({ohaeng_placeholders})
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

        return result

    @staticmethod
    def _build_filter_clauses(
        min_rn_count: int,
        max_받침_count: int | None,
        anchor_patterns: list[str] | None,
        exclude_names: set[str] | None,
    ) -> tuple[str, list]:
        """동적 WHERE 절과 파라미터를 반환한다."""
        clauses: list[str] = []
        params: list = []

        if min_rn_count > 0:
            clauses.append("sc.rn_count >= ?")
            params.append(min_rn_count)

        if max_받침_count is not None:
            clauses.append("sc.받침_count <= ?")
            params.append(max_받침_count)

        if anchor_patterns:
            like_parts = ["sc.name LIKE ?" for _ in anchor_patterns]
            clauses.append(f"({' OR '.join(like_parts)})")
            params.extend(anchor_patterns)

        if exclude_names:
            placeholders = ",".join("?" * len(exclude_names))
            clauses.append(f"sc.name NOT IN ({placeholders})")
            params.extend(list(exclude_names))

        sql = (" AND " + " AND ".join(clauses)) if clauses else ""
        return sql, params

    def get_top_names(
        self,
        surname_hanja: str,
        gender: str,           # "male" | "female"
        required_ohaengs: list[str],  # 억부용신 등 yongshin (비어 있으면 [] 반환)
        limit: int = 200,
        offset: int = 0,
        min_rn_count: int = 0,
        max_받침_count: int | None = None,
        anchor_patterns: list[str] | None = None,
        exclude_names: set[str] | None = None,
    ) -> list[tuple[str, int, int, float, bool, int]]:
        """scored_combinations에서 필터 조건을 적용해 점수 내림차순 상위 이름 목록 반환.

        required_ohaengs가 비어 있으면 [] 반환.

        반환: [(name, hanja1_id, hanja2_id, score, ohaeng_covered, rn_count), ...]
        ohaeng_covered는 호환용으로 항상 True.
        """
        if not required_ohaengs:
            return []

        cache = self._ensure_hanja_cache(self._hanja_db_path)
        filter_sql, filter_params = self._build_filter_clauses(
            min_rn_count, max_받침_count, anchor_patterns, exclude_names
        )

        covered_rows: list[tuple[str, int, int, float, bool, int]] = []

        with sqlite3.connect(self._scored_db_path) as conn:
            conn.row_factory = sqlite3.Row

            ohaeng_placeholders = ",".join("?" * len(required_ohaengs))
            params: list = [surname_hanja, gender] + required_ohaengs + filter_params + [limit, offset]
            rows = conn.execute(
                f"""
                SELECT sc.name, sc.hanja1_id, sc.hanja2_id, MAX(sc.score) AS score,
                       sc.rn_count
                FROM scored_combinations sc
                WHERE sc.surname_hanja = ?
                  AND sc.gender = ?
                  AND sc.yongshin IN ({ohaeng_placeholders})
                  AND sc.rank = 1
                  {filter_sql}
                GROUP BY sc.name
                ORDER BY score DESC
                LIMIT ? OFFSET ?
                """,
                params,
            ).fetchall()
            for row in rows:
                h1 = cache.get(row["hanja1_id"])
                h2 = cache.get(row["hanja2_id"])
                if h1 and h2:
                    covered_rows.append(
                        (row["name"], row["hanja1_id"], row["hanja2_id"], row["score"], True, row["rn_count"])
                    )

        covered_rows.sort(key=lambda r: r[3], reverse=True)
        return covered_rows
