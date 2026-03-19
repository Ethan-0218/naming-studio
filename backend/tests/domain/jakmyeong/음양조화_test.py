# 음양조화 도메인 단위 테스트

import unittest

from domain.jakmyeong import 음양조화
from domain.saju.음양 import 음양


class Test음양조화_세글자(unittest.TestCase):
    """세 글자(성+이름1+이름2) 음양 조화."""

    def test_음음음_불조화(self):
        # 김명수(金明洙) 8·8·10획 → 모두 짝수(음) 예시
        r = 음양조화.from_yin_yang(음양.음, 음양.음, 음양.음)
        assert r.harmonious is False
        assert r.글자별_음양 == (음양.음, 음양.음, 음양.음)
        assert "불조화" in r.reason and "음음음" in r.reason

    def test_양양양_불조화(self):
        r = 음양조화.from_yin_yang(음양.양, 음양.양, 음양.양)
        assert r.harmonious is False
        assert "양양양" in r.reason

    def test_음음양_조화(self):
        r = 음양조화.from_yin_yang(음양.음, 음양.음, 음양.양)
        assert r.harmonious is True
        assert r.글자별_음양 == (음양.음, 음양.음, 음양.양)
        assert "2:1" in r.reason

    def test_음양음_조화(self):
        r = 음양조화.from_yin_yang(음양.음, 음양.양, 음양.음)
        assert r.harmonious is True

    def test_양음음_조화(self):
        r = 음양조화.from_yin_yang(음양.양, 음양.음, 음양.음)
        assert r.harmonious is True

    def test_양양음_조화(self):
        r = 음양조화.from_yin_yang(음양.양, 음양.양, 음양.음)
        assert r.harmonious is True

    def test_양음양_조화(self):
        r = 음양조화.from_yin_yang(음양.양, 음양.음, 음양.양)
        assert r.harmonious is True

    def test_음양양_조화(self):
        r = 음양조화.from_yin_yang(음양.음, 음양.양, 음양.양)
        assert r.harmonious is True


class Test음양조화_외자(unittest.TestCase):
    """외자(성+이름1 두 글자) 음양 조화."""

    def test_음양_조화(self):
        r = 음양조화.from_yin_yang(음양.음, 음양.양, None)
        assert r.harmonious is True
        assert r.글자별_음양 == (음양.음, 음양.양)
        assert "1:1" in r.reason

    def test_양음_조화(self):
        r = 음양조화.from_yin_yang(음양.양, 음양.음, None)
        assert r.harmonious is True

    def test_음음_불조화(self):
        r = 음양조화.from_yin_yang(음양.음, 음양.음, None)
        assert r.harmonious is False
        assert "불조화" in r.reason

    def test_양양_불조화(self):
        r = 음양조화.from_yin_yang(음양.양, 음양.양, None)
        assert r.harmonious is False


if __name__ == "__main__":
    unittest.main()
