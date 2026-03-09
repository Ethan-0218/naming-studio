import sys
import unittest
from pathlib import Path

backend_root = Path(__file__).resolve().parents[3]
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from domain.jakmyeong.발음오행 import 발음오행_from_초성
from domain.saju.오행 import 오행


class Test발음오행(unittest.TestCase):
    def test_목_초성_ㄱ(self):
        assert 발음오행_from_초성("가") == 오행.목

    def test_목_초성_ㅋ(self):
        assert 발음오행_from_초성("카") == 오행.목

    def test_화_초성_ㄴ(self):
        assert 발음오행_from_초성("나") == 오행.화

    def test_화_초성_ㄷ(self):
        assert 발음오행_from_초성("다") == 오행.화

    def test_화_초성_ㄹ(self):
        assert 발음오행_from_초성("라") == 오행.화

    def test_화_초성_ㅌ(self):
        assert 발음오행_from_초성("타") == 오행.화

    def test_토_초성_ㅇ(self):
        assert 발음오행_from_초성("아") == 오행.토

    def test_토_초성_ㅎ(self):
        assert 발음오행_from_초성("하") == 오행.토

    def test_금_초성_ㅅ(self):
        assert 발음오행_from_초성("사") == 오행.금

    def test_금_초성_ㅈ(self):
        assert 발음오행_from_초성("자") == 오행.금

    def test_금_초성_ㅊ(self):
        assert 발음오행_from_초성("차") == 오행.금

    def test_수_초성_ㅁ(self):
        assert 발음오행_from_초성("마") == 오행.수

    def test_수_초성_ㅂ(self):
        assert 발음오행_from_초성("바") == 오행.수

    def test_수_초성_ㅍ(self):
        assert 발음오행_from_초성("파") == 오행.수

    def test_쌍초성_ㄲ_매핑없음(self):
        # ㄲ는 목 매핑 없음 → None
        assert 발음오행_from_초성("까") is None

    def test_비한글_반환_None(self):
        assert 발음오행_from_초성("A") is None
        assert 발음오행_from_초성("1") is None

    def test_빈문자열_반환_None(self):
        assert 발음오행_from_초성("") is None

    def test_지우_초성_ㅈ_금(self):
        assert 발음오행_from_초성("지") == 오행.금

    def test_민준_초성_ㅁ_수(self):
        assert 발음오행_from_초성("민") == 오행.수


if __name__ == "__main__":
    unittest.main()
