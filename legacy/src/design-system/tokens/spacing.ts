/** 4pt 기본 그리드 스페이싱 */
export const spacing = {
  '0': 0,
  '0.5': 2,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '14': 56,
  '16': 64,
} as const;

/** 보더 라디우스 */
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
