import { Ohaeng, OhaengHarmonyResult, OhaengPair, HarmonyLevel } from '../types';
import { getRelation } from './ohaeng';

/**
 * 오행조화 계산
 * - 인접 쌍(성→이름1, 이름1→이름2) 점수: 상생=+2, 동일=0, 상극=-2
 * - 대길: 상극 없고 상생 하나 이상
 * - 반길: 상극 있지만 전부는 아님, 또는 모두 동일
 * - 대흉: 모든 쌍이 상극
 */
export function computeOhaengHarmony(elements: (Ohaeng | null)[]): OhaengHarmonyResult | null {
  const valid = elements.filter((e): e is Ohaeng => e !== null);
  if (valid.length < 2) return null;

  const pairs: OhaengPair[] = [];
  for (let i = 0; i < valid.length - 1; i++) {
    const relation = getRelation(valid[i], valid[i + 1]);
    pairs.push({ a: valid[i], b: valid[i + 1], relation });
  }

  const totalScore = pairs.reduce((sum, p) => {
    if (p.relation === '상생') return sum + 2;
    if (p.relation === '상극') return sum - 2;
    return sum;
  }, 0);

  const hasSanggeuk = pairs.some(p => p.relation === '상극');
  const hasSangsaeng = pairs.some(p => p.relation === '상생');
  const allSanggeuk = pairs.every(p => p.relation === '상극');

  let level: HarmonyLevel;
  if (allSanggeuk) {
    level = '대흉';
  } else if (!hasSanggeuk && hasSangsaeng) {
    level = '대길';
  } else {
    level = '반길';
  }

  const reason = buildReason(pairs);
  const combinationKey = valid.join('');

  return { level, pairs, totalScore, reason, combinationKey };
}

function buildReason(pairs: OhaengPair[]): string {
  return pairs
    .map(p => `${p.a}→${p.b} ${p.relation}`)
    .join(', ');
}
