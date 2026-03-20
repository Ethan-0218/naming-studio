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
pip install -r requirements-dev.txt  # vulture 등 (선택)
cp .env.example .env  # Set OPENAI_API_KEY

# 최초 세팅: generated SQLite DB 생성 (name_hanja_combinations, scored_combinations)
bash scripts/bootstrap.sh

uvicorn main:app --reload  # Dev server on :8000
```

**Tests:**
```bash
cd backend
source .venv/bin/activate
pytest                                        # All tests (pytest.ini에서 커버리지 포함)
pytest --no-cov                             # 커버리지 없이 빠르게
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
pnpm exec prettier --write .  # 코드 작성 후 반드시 실행
```

**규칙: 모바일 코드 수정 후에는 반드시 prettier를 실행한다.**
```bash
cd mobile && pnpm exec prettier --write .
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
- `db/scored_combinations.sqlite3` — Precomputed name–hanja scores per surname/yongshin; includes six `*_level` grade columns (indexed) for filtering via `ScoredCombinationsRepository.exclude_levels` / `find_name_candidates(exclude_combination_levels=...)`.

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

**UI / 스크린 플로우:** 모바일 화면 흐름, 사주 기준 진입, 로그인·결제·저장 플로우 등 기획 스펙은 **[mobile/docs/UI_FLOW.md](mobile/docs/UI_FLOW.md)** 에 정리되어 있음. UI·네비게이션·신규 스크린 작업 시 해당 문서를 참고할 것.

## Key Conventions

- Domain layer files and identifiers use Korean Hangul (e.g., `음양조화.py`, class `음양조화`)
- Models are immutable (`@dataclass(frozen=True)`)
- Repository pattern for all DB access
- LangGraph agent graph is lazily initialized on first request

### Mobile — UI Component Rules

- **1파일 1컴포넌트:** 컴포넌트는 반드시 파일 하나에 하나만 정의한다. 한 파일에 여러 컴포넌트를 선언하지 않는다.
- **components/ 폴더:** 모든 컴포넌트 파일은 해당 feature 폴더 하위의 `components/` 디렉터리에 둔다 (예: `myeongju/components/ProfileCard.tsx`).
- **공유 타입·상수:** feature 내 공유 타입과 상수는 `types.ts`에 분리한다.
- **스크린 파일 역할:** 스크린 컴포넌트(`*Screen.tsx`)는 하위 컴포넌트들을 조합하는 오케스트레이터 역할만 수행한다. UI 로직은 각 컴포넌트로 위임한다.
- **SafeAreaView:** `react-native`의 `SafeAreaView`는 deprecated이므로 반드시 `react-native-safe-area-context`에서 import한다.
- **Text 렌더링:** React Native의 `Text` 컴포넌트를 직접 사용하지 않는다. 반드시 `Font` 컴포넌트(`@/components/Font`)를 사용해 `tag` prop으로 폰트를 지정한다. 단, `Animated.Text`나 서드파티 컴포넌트 내부에서 불가피한 경우는 예외. 폰트 교체 시 `src/components/Font.tsx`의 `FONT_MAP`만 수정하면 앱 전체에 반영된다.

### Mobile — React Native 스타일링 규칙

React Native는 웹 CSS가 아닌 별도의 스타일 시스템을 사용한다. 아래 규칙을 반드시 준수한다.

**스타일링 방식:**
- 인라인 `style` prop은 **폰트 설정 시에만** 사용한다 (Font 컴포넌트의 `style` prop으로 `fontSize`, `color`, `letterSpacing` 등 전달).
- 그 외 모든 스타일링은 **NativeWind의 `className`** 을 통해 작성한다. 인라인 `style={{ ... }}`을 남발하지 않는다.

**flexDirection 기본값 차이:**
- 웹(CSS): `flex-direction` 기본값은 `row`
- React Native: `flexDirection` 기본값은 `column`
- **가로 배치가 필요하면 항상 명시적으로 `className="flex-row"`를 작성한다.** 생략하면 세로 배치가 된다.

**NativeWind에서 사용 불가 — 웹 전용 클래스 (작성 금지):**
- `cursor-*`, `transition-*`, `animate-*` — RN 미지원
- `shadow-*` — RN에서는 `shadow` 클래스가 iOS shadowOffset/Opacity/Radius를 매핑하지만, cross-platform 동작 확인 필요
- `hover:*`, `focus:*` — RN에서 hover/focus 없음 (터치는 `active:*` 사용)
- `grid`, `grid-cols-*` — RN 미지원, flex로 대체
- `fixed`, `sticky` — RN의 position은 `absolute`/`relative`만 지원
- `underline`, `line-through` — RN에서는 `no-underline` 대신 NativeWind `underline`/`line-through` 클래스 사용 가능하나 동작 확인 필요; Font style prop으로 처리 권장
- `font-bold`, `font-semibold` 등 — fontFamily가 아닌 fontWeight만 변경됨. 폰트는 반드시 Font 컴포넌트의 `tag` prop으로 지정한다.

**NativeWind className 작성 패턴:**
- `gap-2` = 8px, `gap-3` = 12px, `gap-4` = 16px (프로젝트 커스텀 spacing 기준)
- 표준 spacing 외 값은 arbitrary value 사용: `px-[36px]`, `h-[54px]`
- 동적 색상(props로 전달받는 색상)은 inline `style={{ backgroundColor: color }}`을 허용한다
- 서드파티 컴포넌트(예: `AppleAuthenticationButton`)에 className이 적용되지 않을 때는 inline style을 허용한다
- `active:opacity-70`, `active:bg-surface` 등으로 Pressable 터치 상태 표현
