# 사주팔자.spec.ts 이식

from domain.saju import 사주팔자
from domain.saju import 성별
from domain.saju import 십간
from domain.saju import 십신
from domain.saju import 십이지
from domain.saju import 십이운성
from domain.saju import 지장간
from domain.saju import 오행
from domain.saju.천간충 import 천간충
from domain.saju.천간합 import 천간합
from domain.saju.지지충 import 지지충
from domain.saju.지지육합 import 지지육합
from domain.saju.지지반합 import 지지반합
from domain.saju.지지방합 import 지지방합
from domain.saju.원진살 import 원진살
from domain.saju.신살 import 도화살, 홍염살
from domain.saju import 신강신약


class Test사주팔자:
    def test_케이스1_2025년6월12일_14시28분(self):
        사주 = 사주팔자("테스트 사람1", 성별.남, "2025-06-12", "14:28")

        assert 사주.연주.천간.십간 == 십간.을
        assert 사주.연주.천간.십신 == 십신.상관
        assert 사주.연주.지지.십이지 == 십이지.사
        assert 사주.연주.지지.십신 == 십신.편재

        assert 사주.월주.천간.십간 == 십간.임
        assert 사주.월주.천간.십신 == 십신.비견
        assert 사주.월주.지지.십이지 == 십이지.오
        assert 사주.월주.지지.십신 == 십신.정재

        assert 사주.일주.천간.십간 == 십간.임
        assert 사주.일주.천간.십신 == 십신.비견
        assert 사주.일주.지지.십이지 == 십이지.자
        assert 사주.일주.지지.십신 == 십신.겁재

        assert 사주.시주.천간.십간 == 십간.정
        assert 사주.시주.천간.십신 == 십신.정재
        assert 사주.시주.지지.십이지 == 십이지.미
        assert 사주.시주.지지.십신 == 십신.정관

        assert 사주.천간충 == []
        assert 사주.지지충 == [지지충.자오충]
        assert 사주.천간합 == [천간합.정임합]
        assert 사주.지지육합 == [지지육합.오미육합]
        assert 사주.지지삼합 == []
        assert 사주.지지반합 == []
        assert 사주.지지방합 == [지지방합.사오미방합]

        assert 사주.연주.지지.신살 == []
        assert [s.value for s in 사주.월주.지지.신살] == ["도화살"]
        assert [s.value for s in 사주.일주.지지.신살] == ["도화살", "홍염살"]
        assert 사주.시주.지지.신살 == []

        assert 사주.연주.지지.십이운성 == 십이운성.절
        assert 사주.월주.지지.십이운성 == 십이운성.태
        assert 사주.일주.지지.십이운성 == 십이운성.제왕
        assert 사주.시주.지지.십이운성 == 십이운성.양

        assert 사주.신강신약 == 신강신약.신약
        assert 사주.억부용신.오행 == 오행.수
        assert 사주.기신.오행 == 오행.토
        assert 사주.희신.오행 == 오행.금

        assert 사주.연주.지지.지장간.여기 == 십간.무
        assert 사주.연주.지지.지장간.중기 == 십간.경
        assert 사주.연주.지지.지장간.정기 == 십간.병
        assert 사주.월주.지지.지장간.여기 == 십간.병
        assert 사주.월주.지지.지장간.중기 == 십간.기
        assert 사주.월주.지지.지장간.정기 == 십간.정
        assert 사주.일주.지지.지장간.여기 == 십간.임
        assert 사주.일주.지지.지장간.중기 is None
        assert 사주.일주.지지.지장간.정기 == 십간.계
        assert 사주.시주.지지.지장간.여기 == 십간.정
        assert 사주.시주.지지.지장간.중기 == 십간.을
        assert 사주.시주.지지.지장간.정기 == 십간.기

        assert 사주.원진살 == [원진살.자미원진]
        assert 사주.일주공망 == []

    def test_케이스2_2025년1월24일_01시00분(self):
        사주 = 사주팔자("테스트 사람2", 성별.여, "2025-01-24", "01:00")

        assert 사주.연주.천간.십간 == 십간.갑
        assert 사주.연주.지지.십이지 == 십이지.진
        assert 사주.월주.천간.십간 == 십간.정
        assert 사주.월주.지지.십이지 == 십이지.축
        assert 사주.일주.천간.십간 == 십간.계
        assert 사주.일주.지지.십이지 == 십이지.사
        assert 사주.시주.천간.십간 == 십간.임
        assert 사주.시주.지지.십이지 == 십이지.자
        assert 사주.천간충 == [천간충.정계충]
        assert 사주.지지충 == []
        assert 사주.천간합 == [천간합.정임합]
        assert 사주.지지육합 == [지지육합.자축육합]
        assert 사주.지지반합 == [지지반합.자진반합]
        assert 사주.연주.지지.십이운성 == 십이운성.양
        assert 사주.월주.지지.십이운성 == 십이운성.관대
        assert 사주.일주.지지.십이운성 == 십이운성.태
        assert 사주.시주.지지.십이운성 == 십이운성.건록
        assert 사주.신강신약 == 신강신약.극약
        assert 사주.억부용신.오행 == 오행.수
        assert 사주.기신.오행 == 오행.토
        assert 사주.희신.오행 == 오행.금
        assert 사주.원진살 == []
        assert 사주.일주공망 == []

    def test_케이스8_1992년2월18일_시간없음(self):
        사주 = 사주팔자("테스트 사람8", 성별.여, "1992-02-18")

        assert 사주.연주.천간.십간 == 십간.임
        assert 사주.연주.지지.십이지 == 십이지.신
        assert 사주.월주.천간.십간 == 십간.임
        assert 사주.월주.지지.십이지 == 십이지.인
        assert 사주.일주.천간.십간 == 십간.갑
        assert 사주.일주.지지.십이지 == 십이지.자
        assert 사주.시주 is None
        assert 사주.천간충 == []
        assert 사주.지지충 == [지지충.인신충]
        assert 사주.지지반합 == [지지반합.신자반합]
        assert [s.value for s in 사주.연주.지지.신살] == ["홍염살"]
        assert [s.value for s in 사주.일주.지지.신살] == ["도화살"]
        assert 사주.신강신약 == 신강신약.극왕
        assert 사주.억부용신.오행 == 오행.금
        assert 사주.기신.오행 == 오행.화
        assert 사주.희신.오행 == 오행.토
        assert 사주.원진살 == []
        assert 사주.일주공망 == []


if __name__ == "__main__":
    t = Test사주팔자()
    t.test_케이스1_2025년6월12일_14시28분()
    print("테스트 케이스 1 통과.")
    t.test_케이스2_2025년1월24일_01시00분()
    print("테스트 케이스 2 통과.")
    t.test_케이스8_1992년2월18일_시간없음()
    print("테스트 케이스 8 통과.")
    print("모든 실행 테스트 통과.")
