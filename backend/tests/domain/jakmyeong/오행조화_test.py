# 오행조화 도메인 단위 테스트. 대길/반길/대흉, 2글자·3글자.

import sys
import unittest
from pathlib import Path

backend_root = Path(__file__).resolve().parents[3]
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from domain.jakmyeong import 오행조화
from domain.saju import 오행


class Test오행조화_두글자(unittest.TestCase):
    """외자: 성+이름1 한 쌍."""

    def test_상생_대길_조화(self):
        # 목생화
        r = 오행조화.from_오행(오행.목, 오행.화)
        assert r.level == "대길"
        assert r.harmonious is True
        assert r.total_score == 2
        assert len(r.쌍별_결과) == 1
        assert r.쌍별_결과[0].relation == "상생"

    def test_상극_불조화(self):
        # 목극금 (금극목)
        r = 오행조화.from_오행(오행.목, 오행.금)
        assert r.level == "대흉"
        assert r.harmonious is False
        assert r.total_score == -2
        assert r.쌍별_결과[0].relation == "상극"

    def test_동일_반길(self):
        r = 오행조화.from_오행(오행.목, 오행.목)
        assert r.level == "반길"
        assert r.harmonious is True
        assert r.total_score == 0
        assert r.쌍별_결과[0].relation == "동일"


class Test오행조화_세글자(unittest.TestCase):
    """세 글자: (성,이름1), (이름1,이름2) 두 쌍."""

    def test_전부_상생_대길_조화(self):
        # 목생화, 화생토
        r = 오행조화.from_오행(오행.목, 오행.화, 오행.토)
        assert r.level == "대길"
        assert r.harmonious is True
        assert r.total_score == 4
        assert all(p.relation == "상생" for p in r.쌍별_결과)

    def test_상생과_상극_혼합_반길(self):
        # (목,화)=상생, (화,금)=상극 (화극금)
        r = 오행조화.from_오행(오행.목, 오행.화, 오행.금)
        assert r.level == "반길"
        assert r.harmonious is False
        assert r.쌍별_결과[0].relation == "상생"
        assert r.쌍별_결과[1].relation == "상극"
        assert r.total_score == 0

    def test_전부_상극_대흉(self):
        # (목,금)=상극, (금,목)=상극
        r = 오행조화.from_오행(오행.목, 오행.금, 오행.목)
        assert r.level == "대흉"
        assert r.harmonious is False
        assert all(p.relation == "상극" for p in r.쌍별_결과)
        assert r.total_score == -4

    def test_전부_동일_반길(self):
        r = 오행조화.from_오행(오행.수, 오행.수, 오행.수)
        assert r.level == "반길"
        assert r.harmonious is True
        assert r.total_score == 0
        assert all(p.relation == "동일" for p in r.쌍별_결과)

    def test_상생_하나_동일_하나_대길(self):
        # (목,화)=상생, (화,화)=동일
        r = 오행조화.from_오행(오행.목, 오행.화, 오행.화)
        assert r.level == "대길"
        assert r.harmonious is True
        assert r.total_score == 2

    def test_reason_포함(self):
        r = 오행조화.from_오행(오행.목, 오행.화)
        assert "목" in r.reason and "화" in r.reason and "상생" in r.reason
