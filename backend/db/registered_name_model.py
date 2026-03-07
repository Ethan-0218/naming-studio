# registered_names 테이블 1행을 표현하는 모델

from dataclasses import dataclass

from domain.saju.성별 import 성별


@dataclass(frozen=True)
class RegisteredName:
    id: int
    name: str
    count: int
    gender: 성별
