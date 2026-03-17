# 수리격 도메인 단위 테스트

import sys
import unittest
from pathlib import Path

backend_root = Path(__file__).resolve().parents[3]
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from domain.numerology import 격, 이름수리격, load_수리격, 성별_to_gender_key


class Test수리격_데이터(unittest.TestCase):
    """수리격 JSON 로드 및 키 0~81 검증."""

    def test_load_수리격_키_0_81_존재(self):
        data = load_수리격()
        for i in range(82):
            key = str(i)
            assert key in data, f"키 {key} 없음"
            row = data[key]
            assert "level" in row and "name1" in row and "name2" in row and "interpretation" in row
            assert "male" in row["level"] and "female" in row["level"]

    def test_0과_81_동일_핵심_필드(self):
        data = load_수리격()
        for field in ("level", "name1", "name2", "interpretation"):
            assert data["0"][field] == data["81"][field], f"0과 81의 {field}가 다름"


class Test격(unittest.TestCase):
    """단일 격 계산 및 점수."""

    def test_stroke_count_0_남_吉(self):
        g = 격.from_stroke_count(0, "male")
        assert g.level == "吉"
        assert g.score == 0.75
        assert g.name1 == "환원격"
        assert g.name2 == "성대운"

    def test_stroke_count_81_남_吉(self):
        g = 격.from_stroke_count(81, "male")
        assert g.level == "吉"
        assert g.score == 0.75

    def test_stroke_count_4_大凶(self):
        g = 격.from_stroke_count(4, "male")
        assert g.level == "大凶"
        assert g.score == 0.0

    def test_stroke_count_21_남길여흉(self):
        g_m = 격.from_stroke_count(21, "male")
        g_f = 격.from_stroke_count(21, "female")
        assert g_m.level == "大吉"
        assert g_f.level == "大凶"
        assert g_m.score == 1.0
        assert g_f.score == 0.0

    def test_to_dict(self):
        g = 격.from_stroke_count(1, "female")
        d = g.to_dict()
        assert d["level"] == "吉"
        assert d["name1"] == "태초격"
        assert d["name2"] == "두령운"


class Test이름수리격(unittest.TestCase):
    """원형이정 4격 계산 (두 글자 이름)."""

    def test_원형이정_계산식_두글자(self):
        # 예: 성 8, 이름1 4, 이름2 5 → 원격 9, 형격 12, 이격 13, 정격 17
        n = 이름수리격.from_strokes(8, 4, 5, "male")
        assert n.원격.level == "大凶"  # 9
        assert n.형격.level == "大凶"  # 12
        assert n.이격.level == "吉"    # 13
        assert n.정격.level == "吉"    # 17
        assert n.total_score == (n.원격.score + n.형격.score + n.이격.score + n.정격.score) / 4

    def test_외자_원격_이름_x2(self):
        # 외자: 성 8, 이름 4 → 원격 4+4=8, 형격=이격=정격 8+4=12
        n = 이름수리격.from_strokes(8, 4, None, "male")
        assert n.원격.level == "吉"   # 8
        assert n.형격.level == "大凶"  # 12
        assert n.이격.level == n.형격.level
        assert n.정격.level == n.형격.level

    def test_total_score_is_average(self):
        n = 이름수리격.from_strokes(8, 4, 5, "male")
        expected = (n.원격.score + n.형격.score + n.이격.score + n.정격.score) / 4
        assert n.total_score == expected

    def test_凶_score(self):
        # 10획 = 凶 → score 0.25
        n = 이름수리격.from_strokes(5, 5, None, "male")  # 원격 10
        assert n.원격.score == 0.25

    def test_to_dict(self):
        n = 이름수리격.from_strokes(1, 1, 1, "female")
        d = n.to_dict()
        assert "원격" in d and "형격" in d and "이격" in d and "정격" in d
        assert "level" in d["원격"] and "name1" in d["원격"] and "name2" in d["원격"]
        assert d["원격"]["level"] in ("大凶", "凶", "中凶", "中吉", "吉", "大吉")


class Test성별_to_gender_key(unittest.TestCase):
    def test_남(self):
        assert 성별_to_gender_key("남") == "male"

    def test_여(self):
        assert 성별_to_gender_key("여") == "female"


if __name__ == "__main__":
    unittest.main()
