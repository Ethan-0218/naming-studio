import { Ohaeng } from '../types';

// Unicode 초성 추출: 한글 음절 = 가(0xAC00) + (초성 × 21 + 중성) × 28 + 종성
// 초성 인덱스 = floor((code - 0xAC00) / 588)
const CHOSUNG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const CHOSUNG_TO_OHAENG: Record<string, Ohaeng> = {
  'ㄱ': '목', 'ㅋ': '목',
  'ㄴ': '화', 'ㄷ': '화', 'ㄹ': '화', 'ㅌ': '화',
  'ㅇ': '토', 'ㅎ': '토',
  'ㅅ': '금', 'ㅈ': '금', 'ㅊ': '금',
  'ㅁ': '수', 'ㅂ': '수', 'ㅍ': '수',
};

export function baleumOhaengFromChar(hangulChar: string): Ohaeng | null {
  if (!hangulChar) return null;
  const code = hangulChar.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return null;
  const chosungIndex = Math.floor(code / 588);
  const chosung = CHOSUNG_LIST[chosungIndex];
  return CHOSUNG_TO_OHAENG[chosung] ?? null;
}

/** 발음오행을 API 문자열('목','화','토','금','수')에서 파싱 */
export function parseOhaeng(s: string): Ohaeng | null {
  if (s === '목' || s === '화' || s === '토' || s === '금' || s === '수') return s;
  return null;
}
