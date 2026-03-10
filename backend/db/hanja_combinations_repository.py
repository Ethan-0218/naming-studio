# name_hanja_combinations.sqlite3 접근 레포지토리

import sqlite3
from pathlib import Path

from core.config import HANJA_DB_PATH, NAME_HANJA_COMBINATIONS_DB_PATH
from db.hanja_model import Hanja
from db.hanja_repository import _row_to_hanja


class HanjaCombinationsRepository:
    """name_hanja_combinations.sqlite3 접근 레포지토리.

    _hanja_cache를 클래스 변수로 공유해 프로세스 내 최초 1회만 hanja 전체를 메모리에 로드.
    get_combinations_bulk()로 여러 이름의 조합을 쿼리 1회로 일괄 반환한다.
    """

    _hanja_cache: dict[int, Hanja] | None = None

    def __init__(
        self,
        combinations_db_path: Path | None = None,
        hanja_db_path: Path | None = None,
    ) -> None:
        self._combinations_db_path = combinations_db_path or NAME_HANJA_COMBINATIONS_DB_PATH
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

    def get_combinations_bulk(
        self, names: list[str]
    ) -> dict[str, list[tuple[Hanja, Hanja]]]:
        """여러 이름의 한자 조합을 쿼리 1회로 일괄 반환합니다.

        Returns:
            {이름: [(hanja1, hanja2), ...]} 형태의 딕셔너리.
            조합 DB에 없는 이름(희귀 음절 등)은 빈 리스트로 반환.
        """
        if not names:
            return {}

        cache = self._ensure_hanja_cache(self._hanja_db_path)
        placeholders = ",".join("?" * len(names))

        with sqlite3.connect(self._combinations_db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                f"SELECT name, hanja1_id, hanja2_id "
                f"FROM name_hanja_combinations WHERE name IN ({placeholders})",
                names,
            ).fetchall()

        result: dict[str, list[tuple[Hanja, Hanja]]] = {n: [] for n in names}
        for row in rows:
            h1 = cache.get(row["hanja1_id"])
            h2 = cache.get(row["hanja2_id"])
            if h1 and h2:
                result[row["name"]].append((h1, h2))

        return result
