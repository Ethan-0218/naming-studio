import rawData from '@shared/data/사주보완조합.json';
import type { SajuComplementLevel } from '../types';
import type { CharYongsinRole } from './sajuComplementLevel';

export interface SajuComplementCombinationDescription {
  rating: SajuComplementLevel;
  description: string;
}

const DATA = rawData as Record<string, SajuComplementCombinationDescription>;

const ROLE_KEY: Record<CharYongsinRole, string> = {
  용: '용',
  희: '희',
  기: '기',
  중: '중',
};

export function getSajuComplementCombinationDescription(
  role1: CharYongsinRole | null,
  role2: CharYongsinRole | null,
): SajuComplementCombinationDescription | null {
  const k1 = role1 ? ROLE_KEY[role1] : '중';
  const k2 = role2 ? ROLE_KEY[role2] : '중';
  return DATA[`${k1}${k2}`] ?? null;
}
