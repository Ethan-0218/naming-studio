from .오행 import 오행
from .억부용신 import 억부용신


class 희신:
    def __init__(self, 오행: 오행, 근거: str = ""):
        self.오행 = 오행
        self.근거 = 근거

    @staticmethod
    def from억부용신(용신: 억부용신) -> "희신":
        # 희신은 용신 오행을 생하는 오행
        return 희신(
            오행=용신.오행.get생아오행(),
            근거=f"용신({용신.오행.value})을 생하는 오행",
        )
