"""POST /api/myeongju — 명주 생성 · GET /api/myeongju — 명주 목록."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from auth.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# ─── 시진 테이블 (startHour 기준 오름차순, 자시 제외) ───────────────────────────
_SIJAN = [
    ("자시", "子"),  # 23–1
    ("축시", "丑"),  # 1–3
    ("인시", "寅"),  # 3–5
    ("묘시", "卯"),  # 5–7
    ("진시", "辰"),  # 7–9
    ("사시", "巳"),  # 9–11
    ("오시", "午"),  # 11–13
    ("미시", "未"),  # 13–15
    ("신시", "申"),  # 15–17
    ("유시", "酉"),  # 17–19
    ("술시", "戌"),  # 19–21
    ("해시", "亥"),  # 21–23
]
_SIJAN_STARTS = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21]


def _get_sijan(hour24: int) -> tuple[str, str]:
    """(시진명, 한자) 반환."""
    if hour24 >= 23 or hour24 < 1:
        return _SIJAN[0]
    for i in range(len(_SIJAN) - 1, -1, -1):
        if hour24 >= _SIJAN_STARTS[i]:
            return _SIJAN[i]
    return _SIJAN[0]


def _format_birth_time(birth_hour: int, birth_minute: int) -> str:
    """'묘시(卯時) · 오전 5:30' 형식으로 반환."""
    sijan_name, sijan_hanja = _get_sijan(birth_hour)
    ampm = "오전" if birth_hour < 12 else "오후"
    display_hour = birth_hour % 12 or 12
    return f"{sijan_name}({sijan_hanja}時) · {ampm} {display_hour}:{birth_minute:02d}"


def _format_birth_date(year: int, month: int, day: int) -> str:
    return f"{year}년 {month}월 {day}일"


# ─── Pydantic 모델 ─────────────────────────────────────────────────────────────

class CreateMyeongJuRequest(BaseModel):
    gender: Literal["male", "female"]
    calendar_type: Literal["양력", "음력"] = "양력"
    year: int
    month: int
    day: int
    time_unknown: bool = False
    birth_hour: int | None = None    # 24h KST
    birth_minute: int | None = None
    region_name: str | None = None
    region_offset: int | None = None
    surname: str = ""
    surname_hanja: str = ""


class MyeongJuResponse(BaseModel):
    id: str
    ilgan: str           # '壬'
    ohaeng: str          # '수'
    iljoo: str           # '임자일주' (일간+일지)
    iljoo_hanja: str     # '壬子'
    gender: str
    calendar_type: str
    birth_date: str      # '2024년 3월 12일'
    birth_time: str      # '묘시(卯時) · 오전 5:30' or '시간 모름'
    surname: str
    surname_hanja: str
    created_at: str
    yongsin: str | None  # 억부용신 오행 (e.g. '수')
    heesin: str | None   # 희신 오행
    gisin: str | None    # 기신 오행


# ─── 헬퍼: DB row → MyeongJuResponse ──────────────────────────────────────────

def _row_to_response(row: dict) -> MyeongJuResponse:
    ilgan_hangul = row["ilgan_hangul"]
    ilgan_hanja  = row["ilgan_hanja"]
    ohaeng       = row["ohaeng"]
    ilji_hangul  = row["ilji_hangul"]
    ilji_hanja   = row["ilji_hanja"]

    iljoo       = f"{ilgan_hangul}{ilji_hangul}일주"
    iljoo_hanja = f"{ilgan_hanja}{ilji_hanja}"

    birth_date = _format_birth_date(row["birth_year"], row["birth_month"], row["birth_day"])

    if row["time_unknown"] or row["birth_hour"] is None:
        birth_time = "시간 모름"
    else:
        birth_time = _format_birth_time(row["birth_hour"], row["birth_minute"] or 0)

    created_at = row["created_at"]
    if hasattr(created_at, "isoformat"):
        created_at = created_at.isoformat()

    return MyeongJuResponse(
        id=str(row["id"]),
        ilgan=ilgan_hanja,
        ohaeng=ohaeng,
        iljoo=iljoo,
        iljoo_hanja=iljoo_hanja,
        gender=row["gender"],
        calendar_type=row["calendar_type"],
        birth_date=birth_date,
        birth_time=birth_time,
        surname=row.get("surname", ""),
        surname_hanja=row.get("surname_hanja", ""),
        created_at=str(created_at),
        yongsin=row.get("yongsin"),
        heesin=row.get("heesin"),
        gisin=row.get("gisin"),
    )


# ─── 엔드포인트 ────────────────────────────────────────────────────────────────

@router.post("/myeongju", response_model=MyeongJuResponse)
async def create_myeongju(
    body: CreateMyeongJuRequest,
    request: Request,
    user_id: str = Depends(get_current_user),
):
    from db.postgres_pool import _pool_instance
    if _pool_instance is None:
        raise HTTPException(status_code=503, detail="DB 미연결")

    from db.myeongju_repository import MyeongJuRepository
    from domain.saju.사주팔자 import 사주팔자
    from domain.saju.성별 import 성별

    # 1. 음력 → 양력 변환
    year, month, day = body.year, body.month, body.day
    solar_date_str = f"{year}-{month:02d}-{day:02d}"
    if body.calendar_type == "음력":
        from korean_lunar_calendar import KoreanLunarCalendar
        cal = KoreanLunarCalendar()
        cal.setLunarDate(year, month, day, False)
        solar_date_str = cal.SolarIsoFormat()

    # 2. 지방시 보정
    solar_time_str: str | None = None
    solar_date_final = solar_date_str
    if not body.time_unknown and body.birth_hour is not None:
        birth_minute = body.birth_minute or 0
        kst_dt = datetime.strptime(
            f"{solar_date_str} {body.birth_hour:02d}:{birth_minute:02d}", "%Y-%m-%d %H:%M"
        )
        offset = body.region_offset if body.region_offset is not None else 0
        adjusted = kst_dt - timedelta(minutes=offset)
        solar_time_str  = adjusted.strftime("%H:%M")
        solar_date_final = adjusted.strftime("%Y-%m-%d")

    # 3. 사주팔자 계산
    gender_obj = 성별.여 if body.gender == "female" else 성별.남
    saju = 사주팔자("", gender_obj, solar_date_final, solar_time_str)
    ilgan = saju.일간
    ilji  = saju.일지

    # 4. 억부용신 / 희신 / 기신 계산
    from domain.saju.억부용신 import 억부용신
    from domain.saju.희신 import 희신
    from domain.saju.기신 import 기신

    yongsin_val: str | None = None
    heesin_val: str | None = None
    gisin_val: str | None = None
    try:
        용신 = 억부용신.from사주팔자(saju)
        if 용신 is not None:
            yongsin_val = 용신.오행.value
            heesin_val  = 희신.from억부용신(용신).오행.value
            gisin_val   = 기신.from억부용신(용신).오행.value
    except Exception:
        logger.exception("억부용신 계산 중 오류 발생")

    # 5. DB 저장
    row = MyeongJuRepository(_pool_instance).create(
        user_id=user_id,
        gender=body.gender,
        calendar_type=body.calendar_type,
        birth_year=year,
        birth_month=month,
        birth_day=day,
        time_unknown=body.time_unknown,
        birth_hour=body.birth_hour if not body.time_unknown else None,
        birth_minute=body.birth_minute if not body.time_unknown else None,
        region_name=body.region_name,
        region_offset=body.region_offset,
        solar_date=solar_date_final,
        solar_time=solar_time_str,
        ilgan_hangul=ilgan.value,
        ilgan_hanja=ilgan.한자,
        ohaeng=ilgan.오행.value,
        ilji_hangul=ilji.value,
        ilji_hanja=ilji.한자,
        surname=body.surname,
        surname_hanja=body.surname_hanja,
        yongsin=yongsin_val,
        heesin=heesin_val,
        gisin=gisin_val,
    )

    return _row_to_response(row)


@router.delete("/myeongju/{id}", status_code=204)
async def delete_myeongju(
    id: str,
    request: Request,
    user_id: str = Depends(get_current_user),
):
    from db.postgres_pool import _pool_instance
    if _pool_instance is None:
        raise HTTPException(status_code=503, detail="DB 미연결")

    from db.myeongju_repository import MyeongJuRepository

    deleted = MyeongJuRepository(_pool_instance).delete(id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="명주를 찾을 수 없습니다.")


@router.get("/myeongju", response_model=list[MyeongJuResponse])
async def list_myeongju(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    from db.postgres_pool import _pool_instance
    if _pool_instance is None:
        raise HTTPException(status_code=503, detail="DB 미연결")

    from db.myeongju_repository import MyeongJuRepository

    rows = MyeongJuRepository(_pool_instance).list_by_user(user_id)
    return [_row_to_response(r) for r in rows]
