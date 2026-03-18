import { Ohaeng, OhaengRelation } from '../types';

// 상생 chain: 목→화→토→금→수→목
const SANGSAENG: [Ohaeng, Ohaeng][] = [
  ['목', '화'],
  ['화', '토'],
  ['토', '금'],
  ['금', '수'],
  ['수', '목'],
];

// 상극 pairs: 목克土, 火克金, 土克水, 金克木, 水克火
const SANGGEUK: [Ohaeng, Ohaeng][] = [
  ['목', '토'],
  ['화', '금'],
  ['토', '수'],
  ['금', '목'],
  ['수', '화'],
];

export function generates(a: Ohaeng, b: Ohaeng): boolean {
  return SANGSAENG.some(([x, y]) => x === a && y === b);
}

export function destroys(a: Ohaeng, b: Ohaeng): boolean {
  return SANGGEUK.some(([x, y]) => x === a && y === b);
}

export function getRelation(a: Ohaeng, b: Ohaeng): OhaengRelation {
  if (a === b) return '동일';
  if (generates(a, b)) return '상생';
  if (destroys(a, b)) return '상극';
  // Neither generates nor destroys — could be reverse relationships
  // If b generates a or b destroys a, it's still a distinct relationship
  // In 작명, the directional pair (a→b) is what matters
  // Unclassified pair treated as 동일 for scoring (shouldn't happen with valid 오행)
  return '동일';
}

/** 수리오행: 획수 일의 자리 기준 (1·2=목, 3·4=화, 5·6=토, 7·8=금, 9·0=수) */
export function strokeToOhaeng(stroke: number): Ohaeng {
  const r = stroke % 10;
  if (r === 1 || r === 2) return '목';
  if (r === 3 || r === 4) return '화';
  if (r === 5 || r === 6) return '토';
  if (r === 7 || r === 8) return '금';
  return '수'; // 9 or 0
}

export function ohaengLabel(o: Ohaeng): string {
  const map: Record<Ohaeng, string> = {
    목: '木',
    화: '火',
    토: '土',
    금: '金',
    수: '水',
  };
  return map[o];
}
