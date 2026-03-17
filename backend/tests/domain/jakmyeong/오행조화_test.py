# 오행조화 도메인 단위 테스트.
# 3글자: JSON 5단계(대길/길/평/흉/대흉) 기준. 2글자: 알고리즘 폴백.

import sys
import unittest
from pathlib import Path

backend_root = Path(__file__).resolve().parents[3]
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from domain.jakmyeong import 오행조화
from domain.saju import 오행


class Test오행조화_두글자(unittest.TestCase):
    """외자(성+이름1): 알고리즘 폴백, 5단계로 매핑."""

    def test_상생_대길_조화(self):
        # 목생화 → 알고리즘 대길 → level "대길", score 4
        r = 오행조화.from_오행(오행.목, 오행.화)
        assert r.level == "大吉"
        assert r.harmonious is True
        assert r.total_score == 4   # 대길 → +4
        assert len(r.쌍별_결과) == 1
        assert r.쌍별_결과[0].relation == "상생"

    def test_상극_불조화(self):
        # 목극금 (금극목) → 알고리즘 대흉 → level "대흉", score -4
        r = 오행조화.from_오행(오행.목, 오행.금)
        assert r.level == "大凶"
        assert r.harmonious is False
        assert r.total_score == -4  # 대흉 → -4
        assert r.쌍별_결과[0].relation == "상극"

    def test_동일_평(self):
        # 동일 → 알고리즘 반길 → 5단계 매핑 "평", score 0
        r = 오행조화.from_오행(오행.목, 오행.목)
        assert r.level == "平"
        assert r.harmonious is True
        assert r.total_score == 0
        assert r.쌍별_결과[0].relation == "동일"


class Test오행조화_세글자(unittest.TestCase):
    """세 글자(성+이름1+이름2): JSON 조회 기반."""

    def test_전부_상생_대길_조화(self):
        # 목화토: 목생화, 화생토 → JSON "대길"
        r = 오행조화.from_오행(오행.목, 오행.화, 오행.토)
        assert r.level == "大吉"
        assert r.harmonious is True
        assert r.total_score == 4   # 대길 → +4
        assert all(p.relation == "상생" for p in r.쌍별_결과)

    def test_상생과_상극_혼합(self):
        # 목화금: (목,화)=상생, (화,금)=상극 → JSON "대흉"
        r = 오행조화.from_오행(오행.목, 오행.화, 오행.금)
        assert r.level == "大凶"    # JSON 기준 대흉
        assert r.harmonious is False
        assert r.쌍별_결과[0].relation == "상생"
        assert r.쌍별_결과[1].relation == "상극"
        assert r.total_score == -4  # 대흉 → -4

    def test_전부_상극_대흉(self):
        # 목금목: (목,금)=상극, (금,목)=상극 → JSON "대흉"
        r = 오행조화.from_오행(오행.목, 오행.금, 오행.목)
        assert r.level == "大凶"
        assert r.harmonious is False
        assert all(p.relation == "상극" for p in r.쌍별_결과)
        assert r.total_score == -4  # 대흉 → -4

    def test_전부_동일_평(self):
        # 수수수 → JSON "평"
        r = 오행조화.from_오행(오행.수, 오행.수, 오행.수)
        assert r.level == "平"      # JSON 기준 평
        assert r.harmonious is True
        assert r.total_score == 0   # 평 → 0
        assert all(p.relation == "동일" for p in r.쌍별_결과)

    def test_상생_하나_동일_하나_대길(self):
        # 목화화: (목,화)=상생, (화,화)=동일 → JSON "대길"
        r = 오행조화.from_오행(오행.목, 오행.화, 오행.화)
        assert r.level == "大吉"
        assert r.harmonious is True
        assert r.total_score == 4   # 대길 → +4

    def test_description_포함(self):
        # 3글자는 description 있어야 함
        r = 오행조화.from_오행(오행.목, 오행.화, 오행.토)
        assert len(r.description) > 0

    def test_reason_포함(self):
        r = 오행조화.from_오행(오행.목, 오행.화)
        assert "목" in r.reason and "화" in r.reason and "상생" in r.reason
