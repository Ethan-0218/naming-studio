#!/usr/bin/env python3
"""두 글자 이름 한자 조합 사전 계산 DB 생성 스크립트.

실행 방법 (backend/ 디렉터리에서):
    python -m scripts.build_hanja_combinations
또는
    python scripts/build_hanja_combinations.py

생성 결과: db/name_hanja_combinations.sqlite3
  - 등록명 DB의 모든 고유 두 글자 이름 × 음절당 usage_count 상위 10개 한자 조합
  - 약 129만 행, 약 78MB
"""

import sqlite3
import sys
import time
from itertools import product
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_BACKEND))

from core.config import HANJA_DB_PATH, NAME_HANJA_COMBINATIONS_DB_PATH, REGISTERED_NAME_DB_PATH

HANJA_PER_SYLLABLE = 10  # 음절당 usage_count 상위 N개


def build() -> None:
    start = time.time()
    print("한자 조합 DB 생성 시작...\n")

    # 1. 고유 두 글자 이름 수집
    rn_conn = sqlite3.connect(REGISTERED_NAME_DB_PATH)
    names: list[str] = [
        r[0]
        for r in rn_conn.execute(
            "SELECT DISTINCT name FROM registered_names WHERE length(name) = 2"
        ).fetchall()
    ]
    rn_conn.close()
    print(f"  고유 두 글자 이름: {len(names):,}개")

    # 2. 등장하는 모든 음절 수집
    all_syllables: set[str] = set()
    for name in names:
        all_syllables.add(name[0])
        all_syllables.add(name[1])
    print(f"  고유 음절: {len(all_syllables)}개")

    # 3. 음절별 상위 N개 한자 ID 사전 조회
    hanja_conn = sqlite3.connect(HANJA_DB_PATH)
    syllable_to_ids: dict[str, list[int]] = {}
    for syl in all_syllables:
        rows = hanja_conn.execute(
            "SELECT id FROM hanja "
            "WHERE eum = ? AND is_family_hanja = 0 AND usage_count > 0 "
            "ORDER BY usage_count DESC LIMIT ?",
            (syl, HANJA_PER_SYLLABLE),
        ).fetchall()
        syllable_to_ids[syl] = [r[0] for r in rows]
    hanja_conn.close()

    syllables_with_hanja = sum(1 for ids in syllable_to_ids.values() if ids)
    print(f"  한자 있는 음절: {syllables_with_hanja} / {len(all_syllables)}개\n")

    # 4. 출력 DB 초기화
    out_path = NAME_HANJA_COMBINATIONS_DB_PATH
    if out_path.exists():
        out_path.unlink()
        print(f"  기존 파일 삭제: {out_path.name}")

    out_conn = sqlite3.connect(out_path)
    out_conn.execute("PRAGMA journal_mode=WAL")
    out_conn.execute("PRAGMA synchronous=NORMAL")
    out_conn.execute(
        """
        CREATE TABLE name_hanja_combinations (
            name      TEXT    NOT NULL,
            hanja1_id INTEGER NOT NULL,
            hanja2_id INTEGER NOT NULL,
            PRIMARY KEY (name, hanja1_id, hanja2_id)
        )
        """
    )
    out_conn.execute("CREATE INDEX idx_nhc_name ON name_hanja_combinations(name)")

    # 5. 조합 생성 및 배치 삽입
    BATCH_SIZE = 50_000
    batch: list[tuple[str, int, int]] = []
    total_rows = 0
    skipped_names = 0

    for name in names:
        ids1 = syllable_to_ids.get(name[0], [])
        ids2 = syllable_to_ids.get(name[1], [])
        if not ids1 or not ids2:
            skipped_names += 1
            continue
        for id1, id2 in product(ids1, ids2):
            batch.append((name, id1, id2))
        if len(batch) >= BATCH_SIZE:
            out_conn.executemany(
                "INSERT OR IGNORE INTO name_hanja_combinations VALUES (?,?,?)", batch
            )
            out_conn.commit()
            total_rows += len(batch)
            batch.clear()
            print(f"  {total_rows:,}행 삽입...", end="\r")

    if batch:
        out_conn.executemany(
            "INSERT OR IGNORE INTO name_hanja_combinations VALUES (?,?,?)", batch
        )
        out_conn.commit()
        total_rows += len(batch)

    # WAL 체크포인트: wal/shm 임시 파일을 본 DB로 병합 후 삭제
    out_conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    out_conn.execute("PRAGMA journal_mode=DELETE")
    out_conn.close()

    elapsed = time.time() - start
    size_mb = out_path.stat().st_size / 1024 / 1024
    print(f"\n완료 ({elapsed:.1f}초)")
    print(f"  삽입 행 수: {total_rows:,}")
    print(f"  한자 없어 건너뜀: {skipped_names:,}개 이름")
    print(f"  DB 크기: {size_mb:.1f}MB")
    print(f"  경로: {out_path}")


if __name__ == "__main__":
    build()
