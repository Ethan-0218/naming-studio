import rawData from '@shared/data/음양조화.json';

export const EUMYANG_COMBINATION_DESCRIPTIONS = rawData as Record<string, string>;

export function getEumyangCombinationDescription(key: string): string | null {
  return EUMYANG_COMBINATION_DESCRIPTIONS[key] ?? null;
}
