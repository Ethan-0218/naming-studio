"""pytest 공통: backend 루트를 import 경로에 둡니다 (pytest.ini pythonpath=. 와 동일 목적)."""

from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))
