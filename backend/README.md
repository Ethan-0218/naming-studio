# Naming Studio — Backend

Python + FastAPI + LangChain/LangGraph + OpenAI 기반 백엔드 및 AI 에이전트입니다.

## 설정

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

`.env`에 `OPENAI_API_KEY`를 설정하세요. (선택) `OPENAI_MODEL`로 모델명 지정 가능 (기본: gpt-4o-mini)

## 실행

```bash
uvicorn main:app --reload
```

- API: http://127.0.0.1:8000
- 문서: http://127.0.0.1:8000/docs

## API

- `GET /health` — 헬스 체크
- `POST /api/chat` — 채팅 (body: `{"message": "..."}`)
