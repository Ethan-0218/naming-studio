import rawData from '@shared/data/rating_scores.json';

const RATING_SCORES = rawData as Record<string, number>;

export function toScore(rating: string): number {
  return RATING_SCORES[rating] ?? 0.5;
}
