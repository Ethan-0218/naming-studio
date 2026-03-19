"""myeongju 테이블 CRUD."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from psycopg_pool import ConnectionPool


class MyeongJuRepository:
    def __init__(self, pool: "ConnectionPool") -> None:
        self._pool = pool

    def create(
        self,
        user_id: str,
        gender: str,
        calendar_type: str,
        birth_year: int,
        birth_month: int,
        birth_day: int,
        time_unknown: bool,
        birth_hour: int | None,
        birth_minute: int | None,
        region_name: str | None,
        region_offset: int | None,
        solar_date: str,          # "YYYY-MM-DD"
        solar_time: str | None,   # "HH:MM"
        ilgan_hangul: str,
        ilgan_hanja: str,
        ohaeng: str,
        ilji_hangul: str,
        ilji_hanja: str,
        surname: str = "",
        surname_hanja: str = "",
    ) -> dict:
        with self._pool.connection() as conn:
            row = conn.execute(
                """
                INSERT INTO myeongju (
                    user_id, gender, calendar_type,
                    birth_year, birth_month, birth_day,
                    time_unknown, birth_hour, birth_minute,
                    region_name, region_offset,
                    solar_date, solar_time,
                    ilgan_hangul, ilgan_hanja, ohaeng, ilji_hangul, ilji_hanja,
                    surname, surname_hanja
                ) VALUES (
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s
                )
                RETURNING id, created_at,
                    gender, calendar_type,
                    birth_year, birth_month, birth_day,
                    time_unknown, birth_hour, birth_minute,
                    region_name,
                    ilgan_hangul, ilgan_hanja, ohaeng, ilji_hangul, ilji_hanja,
                    surname, surname_hanja
                """,
                (
                    user_id, gender, calendar_type,
                    birth_year, birth_month, birth_day,
                    time_unknown, birth_hour, birth_minute,
                    region_name, region_offset,
                    solar_date, solar_time,
                    ilgan_hangul, ilgan_hanja, ohaeng, ilji_hangul, ilji_hanja,
                    surname, surname_hanja,
                ),
            ).fetchone()
        return dict(row)

    def delete(self, id: str, user_id: str) -> bool:
        with self._pool.connection() as conn:
            result = conn.execute(
                "DELETE FROM myeongju WHERE id = %s AND user_id = %s",
                (id, user_id),
            )
        return result.rowcount > 0

    def list_by_user(self, user_id: str) -> list[dict]:
        with self._pool.connection() as conn:
            rows = conn.execute(
                """
                SELECT id, created_at,
                    gender, calendar_type,
                    birth_year, birth_month, birth_day,
                    time_unknown, birth_hour, birth_minute,
                    region_name,
                    ilgan_hangul, ilgan_hanja, ohaeng, ilji_hangul, ilji_hanja,
                    surname, surname_hanja
                FROM myeongju
                WHERE user_id = %s
                ORDER BY created_at DESC
                """,
                (user_id,),
            ).fetchall()
        return [dict(r) for r in rows]
