# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Naming Studio is a Korean baby-naming app with two independent projects (not a monorepo):
- **`backend/`** — Python FastAPI + LangChain/LangGraph + OpenAI AI agent
- **`mobile/`** — Expo + React Native + TypeScript mobile app

## Commands

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Set OPENAI_API_KEY

uvicorn main:app --reload  # Dev server on :8000
```

**Tests:**
```bash
cd backend
source .venv/bin/activate
pytest                                        # All tests
pytest tests/domain/                          # Domain unit tests only
pytest tests/db/                              # DB integration tests
pytest tests/domain/jakmyeong/음양조화_test.py  # Single test file
pytest -v                                     # Verbose
```

### Mobile

```bash
cd mobile
pnpm install
pnpm start          # Dev server (Expo)
pnpm run android    # Android
pnpm run ios        # iOS
pnpm run web        # Web
```

## Architecture

### Backend Structure

```
backend/
├── main.py           # FastAPI entry point; mounts /api router
├── api/routes.py     # POST /api/chat endpoint
├── agent/            # LangGraph agentic layer
│   ├── graph.py      # StateGraph definition (AgentState)
│   └── nodes.py      # LLM node using ChatOpenAI
├── core/config.py    # Env config (OPENAI_API_KEY, OPENAI_MODEL, DB paths)
├── domain/           # Business logic — Korean naming/astrology
│   ├── saju/         # 사주팔자 (birth chart astrology) models
│   ├── jakmyeong/    # 작명 (name harmony) evaluation
│   └── numerology/   # 81수리 numerology calculations
├── db/               # Repository pattern over SQLite
│   ├── hanja_repository.py
│   └── registered_name_repository.py
└── tests/
    ├── domain/       # Unit tests (no DB)
    └── db/           # Integration tests (use SQLite files)
```

**API flow:** `POST /api/chat` → LangGraph `graph.invoke()` → "llm" node → ChatOpenAI → response

**Databases:**
- `db/hanja.sqlite3` — Chinese character reference data (Hanja)
- `db/registered_name.sqlite3` — Korean registered names corpus

### Domain Models

All models use frozen Python dataclasses. Korean is used for file names, class names, and variable names throughout the domain layer.

**`domain/saju/`** — Astrology models:
- `오행` (Five Elements: 목/화/토/금/수)
- `십간` (10 Heavenly Stems), `십이지` (12 Earthly Branches)
- `사주팔자` (full birth chart)
- Supporting models: `신강신약`, `십이운성`, `신살`, `공망`, etc.

**`domain/jakmyeong/`** — Name harmony evaluation:
- `음양조화` — Yin-Yang harmony based on stroke count parity; 3-char rule: 2:1 = harmonious, 3:0 = disharmonious
- `오행조화` — Five Elements harmony between adjacent name characters; 상생=+2, 동일=0, 상극=-2; levels: 대길/반길/대흉

**`domain/numerology/`** — 81수리 numerology:
- `격` (position), `이름수리격` (name numerology), scores loaded from JSON data file

### Mobile Structure

The mobile app is currently a minimal Expo stub. `constants/config.ts` exports `BACKEND_URL` (set via `EXPO_PUBLIC_BACKEND_URL` env var).

## Key Conventions

- Domain layer files and identifiers use Korean Hangul (e.g., `음양조화.py`, class `음양조화`)
- Models are immutable (`@dataclass(frozen=True)`)
- Repository pattern for all DB access
- LangGraph agent graph is lazily initialized on first request
