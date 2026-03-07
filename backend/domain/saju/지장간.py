# 지장간 (love-teller 지장간.ts)

from dataclasses import dataclass
from typing import Optional

from .십간 import 십간
from .십이지 import 십이지


@dataclass(frozen=True)
class 지장간:
    여기: 십간
    중기: Optional[십간]
    정기: 십간

    @staticmethod
    def from십이지(from_지지: 십이지) -> "지장간":
        if from_지지 == 십이지.자:
            return 지장간(십간.임, None, 십간.계)
        if from_지지 == 십이지.축:
            return 지장간(십간.계, 십간.신, 십간.기)
        if from_지지 == 십이지.인:
            return 지장간(십간.무, 십간.병, 십간.갑)
        if from_지지 == 십이지.묘:
            return 지장간(십간.갑, None, 십간.을)
        if from_지지 == 십이지.진:
            return 지장간(십간.을, 십간.계, 십간.무)
        if from_지지 == 십이지.사:
            return 지장간(십간.무, 십간.경, 십간.병)
        if from_지지 == 십이지.오:
            return 지장간(십간.병, 십간.기, 십간.정)
        if from_지지 == 십이지.미:
            return 지장간(십간.정, 십간.을, 십간.기)
        if from_지지 == 십이지.신:
            return 지장간(십간.무, 십간.임, 십간.경)
        if from_지지 == 십이지.유:
            return 지장간(십간.경, None, 십간.신)
        if from_지지 == 십이지.술:
            return 지장간(십간.신, 십간.정, 십간.무)
        if from_지지 == 십이지.해:
            return 지장간(십간.무, 십간.갑, 십간.임)
        raise ValueError(f"알 수 없는 지지: {from_지지}")
