import rawData from '@shared/data/음양조화.json';

export interface EumyangEntry {
  rating: string;
  description: string;
}

export const EUMYANG_COMBINATION_DESCRIPTIONS = rawData as Record<string, EumyangEntry>;

export function getEumyangCombinationDescription(key: string): string | null {
  return EUMYANG_COMBINATION_DESCRIPTIONS[key]?.description ?? null;
}
