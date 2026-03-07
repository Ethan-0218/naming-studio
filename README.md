# Naming Studio

모바일 앱과 백엔드가 함께 있는 레포지토리입니다. 모노레포가 아니며, 각 프로젝트는 독립적으로 실행됩니다.

## 프로젝트 구조

- **mobile/** — Expo + React Native + TypeScript 기반 모바일 앱
- **backend/** — Python + FastAPI + LangChain/LangGraph + OpenAI 기반 백엔드 및 AI 에이전트

## 실행 방법

### 모바일 앱 (mobile)

```bash
cd mobile
pnpm install
pnpm start
```

자세한 설정과 스크립트는 [mobile/README.md](mobile/README.md)를 참고하세요.

### 백엔드 (backend)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # .env에 OPENAI_API_KEY 등 설정
uvicorn main:app --reload
```

자세한 설정과 API는 [backend/README.md](backend/README.md)를 참고하세요.
