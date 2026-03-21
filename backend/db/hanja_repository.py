# hanja.sqlite3 접근 레포지토리

import sqlite3
from pathlib import Path

from core.config import HANJA_DB_PATH
from db.hanja_model import Hanja

_OHAENG_CN_TO_KO = {"木": "목", "火": "화", "土": "토", "金": "금", "水": "수"}


def _normalize_ohaeng(v: str | None) -> str:
    if not v:
        return ""
    return _OHAENG_CN_TO_KO.get(v, v)


def _row_to_hanja(row: sqlite3.Row) -> Hanja:
    return Hanja(
        id=row["id"],
        hanja=row["hanja"] or "",
        mean=row["mean"] or "",
        eum=row["eum"] or "",
        sub_hanja=row["sub_hanja"] or "",
        detail=row["detail"] or "",
        original_stroke_count=row["original_stroke_count"],
        dictionary_stroke_count=row["dictionary_stroke_count"],
        sound_based_yin_yang=row["sound_based_yin_yang"] or "",
        stroke_based_yin_yang=row["stroke_based_yin_yang"] or "",
        pronunciation_five_elements=_normalize_ohaeng(row["pronunciation_five_elements"]),
        character_five_elements=_normalize_ohaeng(row["character_five_elements"]),
        english=row["english"] or "",
        usage_count=row["usage_count"],
        is_family_hanja=bool(row["is_family_hanja"]),
    )


class HanjaRepository:
    def __init__(self, db_path: Path | None = None) -> None:
        self._db_path = db_path or HANJA_DB_PATH

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def get_by_id(self, id: int) -> Hanja | None:
        with self._connect() as conn:
            cur = conn.execute(
                "SELECT * FROM hanja WHERE id = ?", (id,)
            )
            row = cur.fetchone()
            return _row_to_hanja(row) if row else None

    def get_by_hanja(self, hanja: str) -> Hanja | None:
        with self._connect() as conn:
            cur = conn.execute(
                "SELECT * FROM hanja WHERE hanja = ?", (hanja.strip(),)
            )
            row = cur.fetchone()
            return _row_to_hanja(row) if row else None

    def search_by_mean(self, mean_substring: str, limit: int = 50) -> list[Hanja]:
        with self._connect() as conn:
            cur = conn.execute(
                "SELECT * FROM hanja WHERE mean LIKE ? ORDER BY usage_count DESC LIMIT ?",
                (f"%{mean_substring}%", limit),
            )
            return [_row_to_hanja(row) for row in cur.fetchall()]

    def search_by_eum(self, eum_substring: str, limit: int = 50) -> list[Hanja]:
        with self._connect() as conn:
            cur = conn.execute(
                "SELECT * FROM hanja WHERE eum LIKE ? ORDER BY usage_count DESC LIMIT ?",
                (f"%{eum_substring}%", limit),
            )
            return [_row_to_hanja(row) for row in cur.fetchall()]
