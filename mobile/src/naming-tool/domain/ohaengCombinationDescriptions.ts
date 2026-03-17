import rawData from '@shared/data/오행조화.json';

export interface OhaengCombinationDescription {
  rating: string;
  description: string;
}

export const OHAENG_COMBINATION_DESCRIPTIONS =
  rawData as Record<string, OhaengCombinationDescription>;

export function getOhaengCombinationDescription(
  key: string,
): OhaengCombinationDescription | null {
  return OHAENG_COMBINATION_DESCRIPTIONS[key] ?? null;
}
