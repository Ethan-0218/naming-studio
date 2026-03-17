import { Eumyang, EumyangHarmonyResult } from '../types';

/**
 * 음양조화 계산
 * - 2글자: 교차(음양 or 양음)이면 조화
 * - 3글자: 2:1 비율이면 조화 (모두 같으면 불조화)
 */
export function computeEumyangHarmony(chars: (Eumyang | null)[]): EumyangHarmonyResult | null {
  const valid = chars.filter((e): e is Eumyang => e !== null);
  if (valid.length < 2) return null;

  const eumCount = valid.filter(e => e === '음').length;
  const yangCount = valid.filter(e => e === '양').length;

  let harmonious: boolean;
  let reason: string;

  if (valid.length === 2) {
    harmonious = eumCount === 1 && yangCount === 1;
    reason = harmonious
      ? '음양이 교차하여 조화롭습니다.'
      : `${valid[0]}${valid[1]} — 같은 음양으로 불조화입니다.`;
  } else {
    harmonious = eumCount !== valid.length && yangCount !== valid.length;
    const ratio = `음 ${eumCount} : 양 ${yangCount}`;
    reason = harmonious
      ? `${ratio} — 2:1 비율로 조화롭습니다.`
      : `${ratio} — 모두 같은 음양으로 불조화입니다.`;
  }

  const combinationKey = valid.join('');
  return { harmonious, chars, reason, combinationKey };
}
