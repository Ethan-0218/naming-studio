# registered_name.sqlite3 접근 레포지토리

import sqlite3
from pathlib import Path

from core.config import REGISTERED_NAME_DB_PATH
from db.registered_name_model import RegisteredName
from domain.saju.성별 import 성별


def _db_gender_to_성별(value: str | None) -> 성별:
    if value == "female":
        return 성별.여
    return 성별.남


def _성별_to_db_gender(gender: 성별) -> str:
    return "female" if gender.value == "여" else "male"


def _row_to_registered_name(row: sqlite3.Row) -> RegisteredName:
    return RegisteredName(
        id=row["id"],
        name=row["name"] or "",
        count=row["count"] or 0,
        gender=_db_gender_to_성별(row["gender"]),
    )


class RegisteredNameRepository:
    def __init__(self, db_path: Path | None = None) -> None:
        self._db_path = db_path or REGISTERED_NAME_DB_PATH

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def get_by_id(self, id: int) -> RegisteredName | None:
        with self._connect() as conn:
            cur = conn.execute(
                "SELECT * FROM registered_names WHERE id = ?", (id,)
            )
            row = cur.fetchone()
            return _row_to_registered_name(row) if row else None

    def find_by_name(self, name: str, limit: int = 100) -> list[RegisteredName]:
        with self._connect() as conn:
            cur = conn.execute(
                "SELECT * FROM registered_names WHERE name = ? ORDER BY count DESC LIMIT ?",
                (name.strip(), limit),
            )
            return [_row_to_registered_name(row) for row in cur.fetchall()]

    def find_by_gender(self, gender: 성별, limit: int = 100) -> list[RegisteredName]:
        db_gender = _성별_to_db_gender(gender)
        with self._connect() as conn:
            cur = conn.execute(
                "SELECT * FROM registered_names WHERE gender = ? ORDER BY count DESC LIMIT ?",
                (db_gender, limit),
            )
            return [_row_to_registered_name(row) for row in cur.fetchall()]
