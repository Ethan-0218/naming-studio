/**
 * 앱 설정. .env에 EXPO_PUBLIC_BACKEND_URL을 두면 사용됩니다.
 * @see https://docs.expo.dev/guides/environment-variables/
 */
export const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_BACKEND_URL) ||
  'http://localhost:8000';
