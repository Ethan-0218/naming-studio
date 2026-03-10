#!/usr/bin/env python3
"""성씨×이름×용신오행별 최적 한자 조합 사전 점수 계산 DB 생성 스크립트.

실행 방법 (backend/ 디렉터리에서):
    python -m scripts.build_scored_combinations
또는
    python scripts/build_scored_combinations.py

생성 결과: db/scored_combinations.sqlite3
  - 성씨 전체(106개) × 이름 상위 5,000개 × 용신오행 5개 × 상위 5개 한자조합
  - 약 1,325만 행, 약 632MB
  - 런타임 점수 계산(593ms)을 SQL 인덱스 조회(~5ms)로 대체

사전 계산 점수 항목 (용신 제외):
  - 자원오행 조화: 0.18
  - 수리격:       0.15
  - 발음음양:     0.08
  - 획수음양:     0.07
  합계 가중치:    0.48 (정규화 없이 합산, 비교 목적)
"""

import sqlite3
import sys
import time
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_BACKEND))

from core.config import (
    HANJA_DB_PATH,
    NAME_HANJA_COMBINATIONS_DB_PATH,
    REGISTERED_NAME_DB_PATH,
    SCORED_COMBINATIONS_DB_PATH,
)

TOP_NAMES = 5000    # 등록명 상위 N개
TOP_COMBOS = 5      # 오행별 상위 N개 조합
BATCH_SIZE = 100_000

OHAENG_LIST = ["목", "화", "토", "금", "수"]


# ─── Lookup Dict 사전 계산 ────────────────────────────────────────────────────

def _build_char_fe_lookup() -> dict[tuple[str, str, str], float]:
    """자원오행 조화 점수 lookup: (성_char_fe, h1_char_fe, h2_char_fe) → float."""
    from domain.jakmyeong.오행조화 import 오행조화
    from domain.saju.오행 import 오행

    fe_values = ["목", "화", "토", "금", "수", ""]
    result: dict[tuple[str, str, str], float] = {}
    for s in fe_values:
        for h1 in fe_values:
            for h2 in fe_values:
                try:
                    if s and h1:
                        s_o = 오행.from_string(s)
                        h1_o = 오행.from_string(h1)
                        h2_o = 오행.from_string(h2) if h2 else None
                        harmony = 오행조화.from_오행(s_o, h1_o, h2_o)
                        result[(s, h1, h2)] = (harmony.total_score + 4) / 8
                    else:
                        result[(s, h1, h2)] = 0.5
                except Exception:
                    result[(s, h1, h2)] = 0.5
    return result


def _build_yin_lookup() -> dict[tuple[str, str, str], float]:
    """음양 조화 점수 lookup: (s_yin, h1_yin, h2_yin) → float."""
    from domain.jakmyeong.음양조화 import 음양조화
    from domain.saju.음양 import 음양

    def _parse(v: str) -> 음양 | None:
        if v == "음":
            return 음양.음
        if v == "양":
            return 음양.양
        return None

    values = ["음", "양", ""]
    result: dict[tuple[str, str, str], float] = {}
    for s in values:
        for h1 in values:
            for h2 in values:
                try:
                    sv, h1v, h2v = _parse(s), _parse(h1), _parse(h2)
                    if sv and h1v:
                        harmony = 음양조화.from_yin_yang(sv, h1v, h2v)
                        result[(s, h1, h2)] = 1.0 if harmony.harmonious else 0.0
                    else:
                        result[(s, h1, h2)] = 0.5
                except Exception:
                    result[(s, h1, h2)] = 0.5
    return result


def _build_numerology_lookup(
    surname_strokes: list[int],
    name_strokes: list[int],
) -> dict[tuple[int, int, int, str], float]:
    """수리격 점수 lookup: (성_획수, h1_획수, h2_획수, gender) → float."""
    from domain.numerology.이름수리격 import 이름수리격

    result: dict[tuple[int, int, int, str], float] = {}
    for ss in surname_strokes:
        for ns1 in name_strokes:
            for ns2 in name_strokes:
                for g in ("male", "female"):
                    try:
                        nr = 이름수리격.from_strokes(ss, ns1, ns2, g)
                        if nr.has_worst_numerology():
                            v = 0.0
                        elif nr.has_bad_numerology():
                            v = 0.2
                        else:
                            v = (nr.total_score + 20) / 60
                    except Exception:
                        v = 0.5
                    result[(ss, ns1, ns2, g)] = v
    return result


def _compute_score(
    s_char_fe: str,
    s_sound_yin: str,
    s_stroke_yin: str,
    s_stroke: int | None,
    gender_key: str,
    h1_char_fe: str,
    h1_sound_yin: str,
    h1_stroke_yin: str,
    h1_stroke: int | None,
    h2_char_fe: str,
    h2_sound_yin: str,
    h2_stroke_yin: str,
    h2_stroke: int | None,
    char_fe_lut: dict,
    yin_lut: dict,
    nr_lut: dict,
) -> float:
    score = (
        char_fe_lut.get((s_char_fe, h1_char_fe, h2_char_fe), 0.5) * 0.18
        + yin_lut.get((s_sound_yin, h1_sound_yin, h2_sound_yin), 0.5) * 0.08
        + yin_lut.get((s_stroke_yin, h1_stroke_yin, h2_stroke_yin), 0.5) * 0.07
    )
    if s_stroke and h1_stroke and h2_stroke:
        score += nr_lut.get((s_stroke, h1_stroke, h2_stroke, gender_key), 0.5) * 0.15
    else:
        score += 0.5 * 0.15
    return score


# ─── Main Build ──────────────────────────────────────────────────────────────

def build() -> None:
    start = time.time()
    print("사전 점수 계산 DB 생성 시작...\n")

    # 1. 성씨 전체 로드 (usage_count > 0)
    hanja_conn = sqlite3.connect(HANJA_DB_PATH)
    hanja_conn.row_factory = sqlite3.Row
    surname_rows = hanja_conn.execute(
        "SELECT hanja, original_stroke_count, dictionary_stroke_count, "
        "character_five_elements, sound_based_yin_yang, stroke_based_yin_yang "
        "FROM hanja WHERE is_family_hanja = 1 AND usage_count > 0"
    ).fetchall()

    # 이름용 한자 고유 획수 수집 (수리격 lookup 범위 결정)
    name_stroke_rows = hanja_conn.execute(
        "SELECT DISTINCT COALESCE(original_stroke_count, dictionary_stroke_count) as s "
        "FROM hanja WHERE is_family_hanja = 0 AND usage_count > 0 AND s IS NOT NULL"
    ).fetchall()
    name_strokes = sorted(set(r["s"] for r in name_stroke_rows))
    hanja_conn.close()

    surname_data = []
    for r in surname_rows:
        stroke = r["original_stroke_count"] or r["dictionary_stroke_count"]
        surname_data.append({
            "hanja": r["hanja"],
            "stroke": stroke,
            "char_fe": r["character_five_elements"] or "",
            "sound_yin": r["sound_based_yin_yang"] or "",
            "stroke_yin": r["stroke_based_yin_yang"] or "",
        })

    surname_strokes = sorted(set(s["stroke"] for s in surname_data if s["stroke"]))
    print(f"  성씨: {len(surname_data)}개 (획수 {len(surname_strokes)}종)")

    # 2. 이름 상위 N개 로드 (성별 포함)
    rn_conn = sqlite3.connect(REGISTERED_NAME_DB_PATH)
    name_rows = rn_conn.execute(
        "SELECT name, gender FROM registered_names ORDER BY count DESC LIMIT ?",
        (TOP_NAMES,),
    ).fetchall()
    rn_conn.close()

    name_list = [(r[0], r[1]) for r in name_rows]
    name_set = set(n for n, _ in name_list)
    print(f"  이름: {len(name_list)}개 (상위 {TOP_NAMES}개)")

    # 3. Lookup Dict 사전 계산
    print("\n  Lookup Dict 계산 중...")
    t_lut = time.time()
    char_fe_lut = _build_char_fe_lookup()
    yin_lut = _build_yin_lookup()
    nr_lut = _build_numerology_lookup(surname_strokes, name_strokes)
    print(f"    완료 ({time.time()-t_lut:.1f}초): 자원오행 {len(char_fe_lut)}, 음양 {len(yin_lut)}, 수리격 {len(nr_lut):,}")

    # 4. name_hanja_combinations에서 대상 이름 조합 전체 로드 (메모리)
    print("\n  한자 조합 로드 중...")
    t_load = time.time()
    combo_conn = sqlite3.connect(NAME_HANJA_COMBINATIONS_DB_PATH)
    combo_conn.row_factory = sqlite3.Row

    # hanja 전체를 메모리에 로드
    hanja_conn2 = sqlite3.connect(HANJA_DB_PATH)
    hanja_conn2.row_factory = sqlite3.Row
    all_hanja_rows = hanja_conn2.execute("SELECT * FROM hanja").fetchall()
    hanja_conn2.close()

    from db.hanja_repository import _row_to_hanja
    hanja_cache: dict[int, object] = {r["id"]: _row_to_hanja(r) for r in all_hanja_rows}

    # 대상 이름의 조합만 로드
    placeholders = ",".join("?" * len(name_set))
    combo_rows = combo_conn.execute(
        f"SELECT name, hanja1_id, hanja2_id FROM name_hanja_combinations WHERE name IN ({placeholders})",
        list(name_set),
    ).fetchall()
    combo_conn.close()

    combos_by_name: dict[str, list[tuple]] = {n: [] for n in name_set}
    for row in combo_rows:
        h1 = hanja_cache.get(row["hanja1_id"])
        h2 = hanja_cache.get(row["hanja2_id"])
        if h1 and h2:
            combos_by_name[row["name"]].append((h1, h2))

    total_combos = sum(len(v) for v in combos_by_name.values())
    print(f"    완료 ({time.time()-t_load:.1f}초): {total_combos:,}개 조합 로드")

    # 5. 출력 DB 초기화
    out_path = SCORED_COMBINATIONS_DB_PATH
    if out_path.exists():
        out_path.unlink()
        print(f"\n  기존 파일 삭제: {out_path.name}")

    out_conn = sqlite3.connect(out_path)
    out_conn.execute("PRAGMA journal_mode=WAL")
    out_conn.execute("PRAGMA synchronous=NORMAL")
    out_conn.execute("PRAGMA cache_size=-65536")  # 64MB cache
    out_conn.execute(
        """
        CREATE TABLE scored_combinations (
            surname_hanja   TEXT    NOT NULL,
            name            TEXT    NOT NULL,
            required_ohaeng TEXT    NOT NULL,
            rank            INTEGER NOT NULL,
            hanja1_id       INTEGER NOT NULL,
            hanja2_id       INTEGER NOT NULL,
            score           REAL    NOT NULL,
            PRIMARY KEY (surname_hanja, name, required_ohaeng, rank)
        )
        """
    )
    out_conn.execute(
        "CREATE INDEX idx_sc_lookup ON scored_combinations(surname_hanja, name, required_ohaeng)"
    )

    # 6. 이중 루프: 성씨 × 이름 × 오행 → 상위 5개 조합 INSERT
    print("\n  점수 계산 및 삽입 중...")
    t_calc = time.time()
    batch: list[tuple] = []
    total_rows = 0
    skipped_pairs = 0

    for sdata in surname_data:
        s_hanja = sdata["hanja"]
        s_char_fe = sdata["char_fe"]
        s_sound_yin = sdata["sound_yin"]
        s_stroke_yin = sdata["stroke_yin"]
        s_stroke = sdata["stroke"]

        for name, db_gender in name_list:
            gender_key = "female" if db_gender == "female" else "male"
            combos = combos_by_name.get(name, [])
            if not combos:
                skipped_pairs += 1
                continue

            # 발음오행 목록 (이름 음절 기준, 용신 포함 여부 판단용)
            from domain.jakmyeong.발음오행 import 발음오행_from_초성
            name_pron_fes = set()
            for ch in name:
                o = 발음오행_from_초성(ch)
                if o:
                    name_pron_fes.add(o.value)

            # 전체 조합에 대해 점수 계산 (오행 무관)
            all_scored: list[tuple[float, int, int, object, object]] = []
            for h1, h2 in combos:
                h1_stroke = h1.original_stroke_count or h1.dictionary_stroke_count
                h2_stroke = h2.original_stroke_count or h2.dictionary_stroke_count
                score = _compute_score(
                    s_char_fe, s_sound_yin, s_stroke_yin, s_stroke, gender_key,
                    h1.character_five_elements or "", h1.sound_based_yin_yang or "",
                    h1.stroke_based_yin_yang or "", h1_stroke,
                    h2.character_five_elements or "", h2.sound_based_yin_yang or "",
                    h2.stroke_based_yin_yang or "", h2_stroke,
                    char_fe_lut, yin_lut, nr_lut,
                )
                all_scored.append((score, h1.id, h2.id, h1, h2))
            all_scored.sort(key=lambda x: x[0], reverse=True)

            # '_all': 오행 무관 상위 TOP_COMBOS개 (용신 없거나 커버 안 될 때 폴백용)
            for rank, (score, h1_id, h2_id, _h1, _h2) in enumerate(all_scored[:TOP_COMBOS], 1):
                batch.append((s_hanja, name, "_all", rank, h1_id, h2_id, score))

            # 오행별: 해당 용신을 커버하는 조합만 필터
            for target_ohaeng in OHAENG_LIST:
                filtered_scored = [
                    (score, h1_id, h2_id, h1, h2)
                    for score, h1_id, h2_id, h1, h2 in all_scored
                    if target_ohaeng in (
                        {h1.character_five_elements, h2.character_five_elements} | name_pron_fes
                    ) - {""}
                ]
                if not filtered_scored:
                    continue
                for rank, (score, h1_id, h2_id, _h1, _h2) in enumerate(filtered_scored[:TOP_COMBOS], 1):
                    batch.append((s_hanja, name, target_ohaeng, rank, h1_id, h2_id, score))

            if len(batch) >= BATCH_SIZE:
                out_conn.executemany(
                    "INSERT OR IGNORE INTO scored_combinations VALUES (?,?,?,?,?,?,?)", batch
                )
                out_conn.commit()
                total_rows += len(batch)
                batch.clear()
                elapsed = time.time() - t_calc
                print(f"    {total_rows:,}행 삽입... ({elapsed:.0f}초)", end="\r")

    if batch:
        out_conn.executemany(
            "INSERT OR IGNORE INTO scored_combinations VALUES (?,?,?,?,?,?,?)", batch
        )
        out_conn.commit()
        total_rows += len(batch)

    print(f"    {total_rows:,}행 삽입 완료 ({time.time()-t_calc:.1f}초)     ")

    # WAL 체크포인트 및 정리
    out_conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    out_conn.execute("PRAGMA journal_mode=DELETE")
    out_conn.close()

    elapsed = time.time() - start
    size_mb = out_path.stat().st_size / 1024 / 1024
    print(f"\n완료 ({elapsed:.1f}초)")
    print(f"  삽입 행 수: {total_rows:,}")
    print(f"  조합 없어 건너뜀: {skipped_pairs:,}개 (성씨,이름) 쌍")
    print(f"  DB 크기: {size_mb:.1f}MB")
    print(f"  경로: {out_path}")


if __name__ == "__main__":
    build()
