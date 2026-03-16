export const palette = {
  // 배경 / 서피스
  appBg:   '#EEE8D8',
  bg:      '#FBF7EE',
  surface: '#F7F2E6',
  card:    '#FDFAF3',

  // 보더
  border:   '#E2D9C4',
  borderMd: '#CEC3A8',

  // 잉크 (텍스트)
  ink:      '#3A2F1E',
  inkMid:   '#6B5C44',
  inkLight: '#9C8B72',
  inkFaint: '#C8AE92',

  // 주홍 (Vermillion)
  vermillion:       '#B83A2A',
  vermillionLight:  '#FBF0EE',
  vermillionBorder: '#DDA898',

  // 금색 (Gold)
  gold:       '#A87B38',
  goldLight:  '#FBF5E8',
  goldBorder: '#C9A86C',

  // 청록 (Teal)
  teal:       '#2A6B68',
  tealLight:  '#EAF4F2',
  tealBorder: '#B2BBB4',

  // 남보리 (Purple)
  purple:       '#5A4A8A',
  purpleLight:  '#F0EEF9',
  purpleBorder: '#AFA9EC',

  // 황금 (Amber)
  amber:       '#A07B38',
  amberLight:  '#FBF5E8',
  amberBorder: '#C9A86C',

  // 초록 (Green)
  green:       '#3A6818',
  greenLight:  '#EEF6E8',
  greenBorder: '#ABCC88',

  // 오행 — 목 (Wood)
  woodBase:   '#3A6818',
  woodLight:  '#EEF6E8',
  woodBorder: '#ABCC88',

  // 오행 — 화 (Fire)
  fireBase:   '#A83020',
  fireLight:  '#FBF0EE',
  fireBorder: '#DDA890',

  // 오행 — 토 (Earth)
  earthBase:   '#906830',
  earthLight:  '#FDF5E4',
  earthBorder: '#D4B870',

  // 오행 — 금 (Metal)
  metalBase:   '#706050',
  metalLight:  '#F4F2EC',
  metalBorder: '#C0B898',

  // 오행 — 수 (Water)
  waterBase:   '#2A6068',
  waterLight:  '#EAF4F2',
  waterBorder: '#B2BBB4',
} as const;

export type PaletteKey = keyof typeof palette;

/** 오행 색상 맵 — 한글 문자를 키로 직접 조회 */
export const ohaengColors: Record<string, { base: string; light: string; border: string }> = {
  '목': { base: palette.woodBase,  light: palette.woodLight,  border: palette.woodBorder },
  '화': { base: palette.fireBase,  light: palette.fireLight,  border: palette.fireBorder },
  '토': { base: palette.earthBase, light: palette.earthLight, border: palette.earthBorder },
  '금': { base: palette.metalBase, light: palette.metalLight, border: palette.metalBorder },
  '수': { base: palette.waterBase, light: palette.waterLight, border: palette.waterBorder },
};
