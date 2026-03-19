# 오행 from_string, from_stroke_count 단위 테스트

import unittest

from domain.saju import 오행


class Test오행_from_string(unittest.TestCase):
    def test_한글(self):
        assert 오행.from_string("목") == 오행.목
        assert 오행.from_string("화") == 오행.화
        assert 오행.from_string("토") == 오행.토
        assert 오행.from_string("금") == 오행.금
        assert 오행.from_string("수") == 오행.수

    def test_한자(self):
        assert 오행.from_string("木") == 오행.목
        assert 오행.from_string("火") == 오행.화
        assert 오행.from_string("土") == 오행.토
        assert 오행.from_string("金") == 오행.금
        assert 오행.from_string("水") == 오행.수

    def test_공백_trim(self):
        assert 오행.from_string("  목  ") == 오행.목

    def test_빈문자열_None(self):
        assert 오행.from_string("") is None
        assert 오행.from_string("   ") is None

    def test_미인식_None(self):
        assert 오행.from_string("x") is None
        assert 오행.from_string("목화") is None


class Test오행_from_stroke_count(unittest.TestCase):
    """수리오행: 1·2=목, 3·4=화, 5·6=토, 7·8=금, 9·0=수."""

    def test_목(self):
        assert 오행.from_stroke_count(1) == 오행.목
        assert 오행.from_stroke_count(2) == 오행.목
        assert 오행.from_stroke_count(11) == 오행.목
        assert 오행.from_stroke_count(21) == 오행.목

    def test_화(self):
        assert 오행.from_stroke_count(3) == 오행.화
        assert 오행.from_stroke_count(4) == 오행.화
        assert 오행.from_stroke_count(13) == 오행.화

    def test_토(self):
        assert 오행.from_stroke_count(5) == 오행.토
        assert 오행.from_stroke_count(6) == 오행.토

    def test_금(self):
        assert 오행.from_stroke_count(7) == 오행.금
        assert 오행.from_stroke_count(8) == 오행.금

    def test_수(self):
        assert 오행.from_stroke_count(9) == 오행.수
        assert 오행.from_stroke_count(10) == 오행.수
        assert 오행.from_stroke_count(0) == 오행.수  # 0 % 10 == 0
        assert 오행.from_stroke_count(20) == 오행.수
