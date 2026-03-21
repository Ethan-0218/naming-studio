import { Eumyang } from '../types';

/** 획수음양: 홀수=양, 짝수=음 */
export function strokeToEumyang(stroke: number): Eumyang {
  return stroke % 2 === 1 ? '양' : '음';
}

export function parseEumyang(s: string): Eumyang | null {
  if (s === '음' || s === '陰') return '음';
  if (s === '양' || s === '陽') return '양';
  return null;
}
