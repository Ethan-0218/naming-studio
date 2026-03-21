# Naming Studio — Mobile

Expo + React Native + TypeScript 기반 모바일 앱입니다.

**UI 스크린 플로우 스펙:** [docs/UI_FLOW.md](docs/UI_FLOW.md) — 화면 목록, 사주 기준 진입 플로우, 로그인·결제·저장, 네비게이션 구조 등. Cursor/Claude 및 개발 시 참고.

## 실행

```bash
pnpm install
pnpm start
```

- **Android**: `pnpm run android`
- **iOS**: `pnpm run ios`
- **Web**: `pnpm run web`

## 환경 변수

백엔드 API URL을 쓰려면 `.env`를 만들고 `EXPO_PUBLIC_BACKEND_URL`을 설정하세요.

```bash
cp .env.example .env
# .env에서 EXPO_PUBLIC_BACKEND_URL 수정 (예: http://localhost:8000)
```

앱에서는 `constants/config.ts`의 `BACKEND_URL`을 import해 사용하면 됩니다. [Expo 환경 변수](https://docs.expo.dev/guides/environment-variables/) 참고.
