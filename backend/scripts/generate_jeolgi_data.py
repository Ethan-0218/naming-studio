#!/usr/bin/env python3
"""Parse love-teller 절기.ts and write domain/saju/절기_데이터.py.

Usage:
  python scripts/generate_jeolgi_data.py [PATH_TO_절기.ts]
  JEOLGI_TS=/path/to/절기.ts python scripts/generate_jeolgi_data.py

TypeScript Date month is 0-based; Python datetime month is 1-based (TS m -> m+1).
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from datetime import datetime
from pathlib import Path

YEAR_LINE = re.compile(r"^\s*(\d{4}):\s*\[")
ENTRY_LINE = re.compile(
    r"new 절기\('([^']+)',\s*new Date\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)\)",
)

HEADER = '''"""24절기 절입 시각 (KST). love-teller `src/saju/models/절기.ts`와 동기화.

재생성 (backend 디렉터리에서):
  python scripts/generate_jeolgi_data.py <절기.ts 경로>
또는 JEOLGI_TS 환경변수 설정 후 인자 생략.
"""

from datetime import datetime
from typing import Dict, List, Tuple

# (절기명, 절입 datetime)
JEOLGI_DATETIMES: Dict[int, List[Tuple[str, datetime]]] = {
'''


def parse_ts(text: str) -> dict[int, list[tuple[str, datetime]]]:
    data: dict[int, list[tuple[str, datetime]]] = {}
    current_year: int | None = None
    for line in text.splitlines():
        ym = YEAR_LINE.match(line)
        if ym:
            current_year = int(ym.group(1))
            data[current_year] = []
            continue
        em = ENTRY_LINE.search(line)
        if em and current_year is not None:
            name, y, m0, d, h, mi = em.groups()
            yi, m0i, di, hi, mii = int(y), int(m0), int(d), int(h), int(mi)
            dt = datetime(yi, m0i + 1, di, hi, mii)
            data[current_year].append((name, dt))
    return data


def validate(data: dict[int, list[tuple[str, datetime]]]) -> None:
    years = sorted(data.keys())
    if not years:
        raise SystemExit("파싱 결과가 비어 있습니다.")
    if years[0] != 1950 or years[-1] != 2040:
        raise SystemExit(f"연도 범위 기대 1950~2040, 실제 {years[0]}~{years[-1]}")
    for y in range(1950, 2041):
        if y not in data:
            raise SystemExit(f"누락 연도: {y}")
        if len(data[y]) != 24:
            raise SystemExit(f"{y}년 항목 수 기대 24, 실제 {len(data[y])}")


def escape_name(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def emit(data: dict[int, list[tuple[str, datetime]]]) -> str:
    lines = [HEADER]
    for y in sorted(data.keys()):
        lines.append(f"    {y}: [")
        for name, dt in data[y]:
            nm = escape_name(name)
            lines.append(
                f'        ("{nm}", datetime({dt.year}, {dt.month}, {dt.day}, '
                f"{dt.hour}, {dt.minute})),"
            )
        lines.append("    ],")
    lines.append("}\n")
    return "\n".join(lines)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    default_ts = os.environ.get("JEOLGI_TS", "").strip()
    parser = argparse.ArgumentParser(description="Generate 절기_데이터.py from 절기.ts")
    parser.add_argument(
        "ts_path",
        nargs="?",
        default=default_ts or None,
        help="Path to love-teller 절기.ts (or set JEOLGI_TS)",
    )
    parser.add_argument(
        "-o",
        "--out",
        type=Path,
        default=root / "domain" / "saju" / "절기_데이터.py",
        help="Output Python module path",
    )
    args = parser.parse_args()
    if not args.ts_path:
        print("절기.ts 경로를 인자로 주거나 JEOLGI_TS를 설정하세요.", file=sys.stderr)
        sys.exit(2)
    src = Path(args.ts_path)
    if not src.is_file():
        print(f"파일 없음: {src}", file=sys.stderr)
        sys.exit(1)
    text = src.read_text(encoding="utf-8")
    data = parse_ts(text)
    validate(data)
    out = args.out.resolve()
    out.write_text(emit(data), encoding="utf-8")
    print(f"Wrote {out} ({len(data)} years)")


if __name__ == "__main__":
    main()
