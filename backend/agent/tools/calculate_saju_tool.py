"""사주팔자 계산 툴. domain/saju/사주팔자.py 직접 호출."""

from domain.saju.사주팔자 import 사주팔자
from domain.saju.성별 import 성별


def calculate_saju(
    birth_date: str,  # "YYYY-MM-DD" (양력)
    birth_time: str | None,  # "HH:MM" or None
    gender: str,  # "남" | "여"
    is_lunar: bool = False,
) -> dict:
    """사주팔자를 계산해 요약 dict를 반환합니다.

    음력 날짜인 경우 korean-lunar-calendar로 양력 변환 후 계산합니다.
    반환: {일간, 일간_오행, 신강신약, 억부용신, 오행_분포, 부족한_오행}
    """
    solar_date = birth_date
    if is_lunar:
        try:
            from korean_lunar_calendar import KoreanLunarCalendar
            cal = KoreanLunarCalendar()
            parts = birth_date.split("-")
            cal.setLunarDate(int(parts[0]), int(parts[1]), int(parts[2]), False)
            solar_date = cal.SolarIsoFormat()
        except Exception:
            # 변환 실패 시 양력으로 그냥 사용
            solar_date = birth_date

    gender_obj = 성별.여 if gender == "여" else 성별.남

    saju = 사주팔자(
        name="",
        gender=gender_obj,
        birth_date=solar_date,
        birth_time=birth_time,
    )

    # 오행 분포 계산
    오행_counts: dict[str, int] = {"목": 0, "화": 0, "토": 0, "금": 0, "수": 0}
    for 천간 in saju.천간목록:
        v = 천간.십간.오행.value
        오행_counts[v] = 오행_counts.get(v, 0) + 1
    for 지지 in saju.지지목록:
        v = 지지.십이지.오행.value
        오행_counts[v] = 오행_counts.get(v, 0) + 1

    min_count = min(오행_counts.values())
    부족한_오행 = [k for k, v in 오행_counts.items() if v == min_count]

    return {
        "일간": saju.일간.value,
        "일간_오행": saju.일간.오행.value,
        "신강신약": saju.신강신약.type,
        "억부용신": saju.억부용신.오행.value,
        "오행_분포": 오행_counts,
        "부족한_오행": 부족한_오행,
    }
