// ─── Primitive Tokens ────────────────────────────────────────────────────────
// 원시 색상 스케일. Semantic Token 정의 시에만 사용하고 컴포넌트에서 직접 참조 금지.
export const primitives = {
  // Hanji (한지)
  hanji50: '#FDFAF3',
  hanji100: '#FBF7EE',
  hanji200: '#F7F2E6',
  hanji300: '#EEE8D8',
  hanji400: '#E2D9C4',
  hanji500: '#CEC3A8',

  // Ink (먹)
  ink900: '#3A2F1E',
  ink700: '#6B5C44',
  ink500: '#9C8B72',
  ink300: '#C0AE92',

  // Vermillion (주홍)
  vermillion600: '#B83A2A',
  vermillion400: '#DDA090',
  vermillion200: '#FBF0EE',

  // Gold (금색)
  gold600: '#A07030',
  gold400: '#C9A86C',
  gold200: '#FBF5E8',

  // Teal (청록)
  teal600: '#2A6060',
  teal400: '#82B8B4',
  teal200: '#EAF4F2',

  // Purple (남보라)
  purple600: '#5A4A8A',
  purple400: '#AFA9EC',
  purple200: '#F0EEF9',

  // Ohaeng — Wood (목)
  wood600: '#3A6818',
  wood400: '#A8CC88',
  wood200: '#EEF6E8',

  // Ohaeng — Fire (화)
  fire600: '#A03020',
  fire400: '#DDA090',
  fire200: '#FBF0EE',

  // Ohaeng — Earth (토)
  earth600: '#906830',
  earth400: '#D4B870',
  earth200: '#FDF5E4',

  // Ohaeng — Metal (금)
  metal600: '#706050',
  metal400: '#C0B898',
  metal200: '#F4F2EC',

  // Ohaeng — Water (수)
  water600: '#2A6060',
  water400: '#82B8B4',
  water200: '#EAF4F2',
} as const;

export type PrimitiveKey = keyof typeof primitives;

// ─── Semantic Tokens ──────────────────────────────────────────────────────────
// 컴포넌트에서 반드시 이 토큰만 참조할 것.
export const colors = {
  // Surface
  bg: primitives.hanji100,
  bgSubtle: primitives.hanji300,
  surface: primitives.hanji200,
  surfaceRaised: primitives.hanji50,
  overlay: 'rgba(58, 47, 30, 0.35)',

  // Border
  border: primitives.hanji400,
  borderStrong: primitives.hanji500,

  // Text
  textPrimary: primitives.ink900,
  textSecondary: primitives.ink700,
  textTertiary: primitives.ink500,
  textDisabled: primitives.ink300,
  textInverse: primitives.hanji100,

  // Interactive
  fillBold: primitives.ink900,
  fillAccent: primitives.gold600,
  fillAccentSub: primitives.gold200,

  // Status — Positive (긍정, 생(生) 관계, 대길)
  positive: primitives.teal600,
  positiveSub: primitives.teal200,
  positiveBorder: primitives.teal400,

  // Status — Negative (부정, 극(剋) 관계, 대흉)
  negative: primitives.vermillion600,
  negativeSub: primitives.vermillion200,
  negativeBorder: primitives.vermillion400,

  // Status — Warning (주의, 반길)
  warning: primitives.gold600,
  warningSub: primitives.gold200,
  warningBorder: primitives.gold400,

  // Status — Info (정보, 음(陰))
  info: primitives.purple600,
  infoSub: primitives.purple200,
  infoBorder: primitives.purple400,

  // Highlight
  highlight: primitives.gold600,
  highlightSub: primitives.gold200,
  highlightBorder: primitives.gold400,

  // Yin Yang (음양)
  yin: primitives.purple600,
  yinSub: primitives.purple200,
  yinBorder: primitives.purple400,

  yang: primitives.gold600,
  yangSub: primitives.gold200,
  yangBorder: primitives.gold400,
} as const;

export type ColorKey = keyof typeof colors;

// ─── Ohaeng Domain Colors ─────────────────────────────────────────────────────
// 오행 도메인 전용. 일반 UI에서는 사용 안 함.
export const ohaengColors: Record<
  string,
  { base: string; light: string; border: string }
> = {
  목: {
    base: primitives.wood600,
    light: primitives.wood200,
    border: primitives.wood400,
  },
  화: {
    base: primitives.fire600,
    light: primitives.fire200,
    border: primitives.fire400,
  },
  토: {
    base: primitives.earth600,
    light: primitives.earth200,
    border: primitives.earth400,
  },
  금: {
    base: primitives.metal600,
    light: primitives.metal200,
    border: primitives.metal400,
  },
  수: {
    base: primitives.water600,
    light: primitives.water200,
    border: primitives.water400,
  },
};
