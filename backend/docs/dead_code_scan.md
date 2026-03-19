# 데드 코드 스캔 (Vulture)

앱 코드만 대상으로 실행합니다 (`.venv`, `tests`, `scripts` 제외).

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
vulture domain api agent auth db core main.py
```

- **기본 신뢰도(60%)**에서는 FastAPI 라우트 함수·Pydantic 필드·LangGraph 툴 등이 “미사용”으로 잡히는 **오탐**이 많습니다. 라우트는 `@router`로 등록되고, 스키마 필드는 직렬화에 쓰입니다.
- **확실한 후보**는 `grep`/참조 검색과 테스트로 교차 확인한 뒤 제거합니다.
- 이 저장소에서 한 번 제거한 예: 패키지 `agent/nodes/`에 가려져 로드되지 않던 `agent/nodes.py`, 호출처 없는 `UserRepository.upsert_by_device_id`, `ScoredCombinationsRepository.get_covered_names`, `성별.toPrompt`/`fromString`, `신강신약.신약한가`.
