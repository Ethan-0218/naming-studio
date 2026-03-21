import type { TextStyle } from 'react-native';

/**
 * 이름공방 타이포그래피 시스템 v1.0
 *
 * 서체 체계:
 *   Noto Serif KR — 헤더 위계 / 한자 / 큰 숫자 / 강렬하고 관목 있는 요소
 *   Noto Sans KR  — 본문 / 캡션 / UI / 레이블
 *
 * 두 서체를 같은 화면에서 쓸 때는 역할을 명확히 구분해 혼용 권고.
 *
 * useFonts()에 전달하는 키와 일치해야 하는 폰트 패밀리 이름
 */
export const fontFamily = {
  serifLight: 'NotoSerifKR_300Light',
  serifRegular: 'NotoSerifKR_400Regular',
  serifMedium: 'NotoSerifKR_500Medium',
  serifSemiBold: 'NotoSerifKR_600SemiBold',

  sansLight: 'NotoSansKR_300Light',
  sansRegular: 'NotoSansKR_400Regular',
  sansMedium: 'NotoSansKR_500Medium',
} as const;

export type FontFamilyKey = keyof typeof fontFamily;

/** fontWeight(숫자) → 해당 굵기의 fontFamily 키. 이 매핑으로 fontWeight만 바꿔도 올바른 폰트가 적용됨 */
type FontBase = 'serif' | 'sans';
const WEIGHT_TO_FAMILY: Record<FontBase, Record<string, FontFamilyKey>> = {
  serif: {
    '300': 'serifLight',
    '400': 'serifRegular',
    '500': 'serifMedium',
    '600': 'serifSemiBold',
  },
  sans: {
    '300': 'sansLight',
    '400': 'sansRegular',
    '500': 'sansMedium',
  },
};

/**
 * fontBase + fontWeight에 맞는 fontFamily 문자열 반환.
 * 토큰에서 fontWeight만 바꿔도 굵기가 적용되도록, 이 함수로 fontFamily를 채워 사용한다.
 */
export function getFontFamilyForWeight(
  fontBase: FontBase,
  fontWeight: string | number,
): string {
  const key = String(fontWeight);
  const familyKey = WEIGHT_TO_FAMILY[fontBase][key];
  if (!familyKey) {
    const fallback = fontBase === 'serif' ? 'serifRegular' : 'sansRegular';
    return fontFamily[fallback];
  }
  return fontFamily[familyKey];
}

type TextStyleWithoutFont = Omit<TextStyle, 'fontFamily' | 'fontWeight'>;

function buildTextStyle(
  fontBase: FontBase,
  fontWeight: '300' | '400' | '500' | '600',
  style: TextStyleWithoutFont,
): TextStyle {
  return {
    fontFamily: getFontFamilyForWeight(fontBase, fontWeight),
    fontWeight,
    ...style,
  };
}

/**
 * 역할별 텍스트 스타일 — StyleSheet에 spread해서 사용
 *
 * 주의: RN의 lineHeight는 배수가 아닌 절댓값(px)
 * 주의: textTransform은 'uppercase' as const 필수 (TypeScript 타입 확장 방지)
 *
 * ─────────────────────────────────────────────
 * Noto Serif KR  (Display → Label)
 * ─────────────────────────────────────────────
 *
 *  display      32px medium — 가장 큰 화면 타이틀, 섹션 인트로 (위계 확보)
 *  title1       24px medium — 앱 타이틀, 큰 스크린 제목 (로고 텍스트 등)
 *  title2       20px medium — 서브 타이틀, 바텀시트 제목
 *  heading      16px medium — 섹션 제목, 카드 헤더
 *  numeralLg    32px semiBold — 종합 점수 등 큰 숫자 단독 표시 (가장 강한 강조)
 *  numeralMd    20px medium  — 수리격 숫자 등 중형 숫자 (카드 내 핵심 정보)
 *  hanjaLg      24px medium — 한자 대형 표시 (호출부에서 fontSize 22–26 오버라이드 가능)
 *  hanjaSm      16px medium — 한자 소형 표시, 선택된 한자 (호출부에서 fontSize 15–18 오버라이드 가능)
 *  serifLabel   13px medium — Serif 계열 레이블·뱃지 (발음오행 등 강조 배지)
 *
 * ─────────────────────────────────────────────
 * Noto Sans KR  (Body → Caption)
 * ─────────────────────────────────────────────
 *
 *  bodyLg       15px medium  — 분석 결과 본문, 주요 안내문 (약한 강조)
 *  body         13px regular — 일반 본문 설명
 *  bodySm       11px regular — 보조 설명, 힌트, 빈 상태 메시지
 *  uiMd         14px medium — 버튼·탭 레이블, 중형 UI 액션 텍스트
 *  uiSm         13px medium — 평가 카드 제목, 소형 UI 액션 텍스트
 *  label        11px medium — 뱃지·칩·태그 (성별 선택, 오행 배지 등)
 *  caption      10px medium  — 부가 정보, 한자 뜻·음·획수 (weight 올려 가독성 확보)
 *  overline      9px medium  — 섹션 구분 라벨 (uppercase 고정)
 */
export const textStyles = {
  // ── Noto Serif KR ──────────────────────────────────────────────────

  /** 가장 큰 화면 타이틀 / 섹션 인트로 — 위계 확보 */
  display: buildTextStyle('serif', '500', {
    fontSize: 32,
    letterSpacing: -0.5,
    lineHeight: Math.round(32 * 1.2), // 38
  }),

  /** 앱 타이틀 / 큰 스크린 제목 (이름공방 로고 등) */
  title1: buildTextStyle('serif', '500', {
    fontSize: 24,
    letterSpacing: 2,
    lineHeight: Math.round(24 * 1.3), // 31
  }),

  /** 서브 타이틀 / 바텀시트 제목 */
  title2: buildTextStyle('serif', '500', {
    fontSize: 20,
    letterSpacing: 1,
    lineHeight: Math.round(20 * 1.35), // 27
  }),

  /** 섹션 제목 / 카드 헤더 */
  heading: buildTextStyle('serif', '500', {
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: Math.round(16 * 1.4), // 22
  }),

  /** 종합 점수 등 큰 숫자 단독 표시 — 가장 강한 강조 */
  numeralLg: buildTextStyle('serif', '600', {
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: Math.round(32 * 1.2), // 32
  }),

  /** 수리격 숫자 등 중형 숫자 — 카드 내 핵심 정보 */
  numeralMd: buildTextStyle('serif', '500', {
    fontSize: 20,
    letterSpacing: 0,
    lineHeight: Math.round(20 * 1.2), // 20
  }),

  /**
   * 한자 대형 표시 (22–26px)
   * 기본 fontSize 24 — 호출부에서 fontSize 오버라이드 가능
   * 예: <Text style={[textStyles.hanjaLg, { fontSize: 26 }]}>金</Text>
   */
  hanjaLg: buildTextStyle('serif', '500', {
    fontSize: 24,
    letterSpacing: 0,
    lineHeight: Math.round(24 * 1.2), // 24
  }),

  /**
   * 한자 소형 표시 / 선택된 한자 (15–18px)
   * 기본 fontSize 16 — 호출부에서 fontSize 오버라이드 가능
   * 예: <Text style={[textStyles.hanjaSm, { fontSize: 18 }]}>金</Text>
   */
  hanjaSm: buildTextStyle('serif', '500', {
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: Math.round(16 * 1.2), // 16
  }),

  /** Serif 계열 레이블·배지 — 발음오행 등 강조 배지 */
  serifLabel: buildTextStyle('serif', '500', {
    fontSize: 13,
    letterSpacing: 1,
    lineHeight: Math.round(13 * 1.4), // 18
  }),

  // ── Noto Sans KR ───────────────────────────────────────────────────

  /** 분석 결과 본문, 주요 안내문 — 약한 강조 */
  bodyLg: buildTextStyle('sans', '500', {
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: Math.round(15 * 1.7), // 26
  }),

  /** 일반 본문 설명 */
  body: buildTextStyle('sans', '400', {
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: Math.round(13 * 1.7), // 22
  }),

  /** 보조 설명 / 힌트 / 빈 상태 메시지 */
  bodySm: buildTextStyle('sans', '400', {
    fontSize: 12,
    letterSpacing: 0,
    lineHeight: Math.round(12 * 1.7), // 20
  }),

  /** 버튼·탭 레이블, 중형 UI 액션 텍스트 */
  uiMd: buildTextStyle('sans', '500', {
    fontSize: 14,
    letterSpacing: 0.3,
    lineHeight: Math.round(14 * 1.4), // 20
  }),

  /** 평가 카드 제목 / 소형 UI 액션 텍스트 */
  uiSm: buildTextStyle('sans', '500', {
    fontSize: 13,
    letterSpacing: 0.3,
    lineHeight: Math.round(13 * 1.4), // 18
  }),

  /** 뱃지·칩·태그 (성별 선택, 오행 배지 등) */
  label: buildTextStyle('sans', '500', {
    fontSize: 12,
    letterSpacing: 0.5,
    lineHeight: Math.round(12 * 1.4), // 17
  }),

  /** 부가 정보 / 한자 뜻·음·획수 — weight 올려 가독성 확보 */
  caption: buildTextStyle('sans', '500', {
    fontSize: 12,
    letterSpacing: 0.5,
    lineHeight: Math.round(12 * 1.5), // 18
  }),

  /** 섹션 구분 라벨 — 항상 uppercase로 렌더링됨 */
  overline: buildTextStyle('sans', '500', {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    lineHeight: Math.round(12 * 1.5), // 18
  }),
} as const satisfies Record<string, TextStyle>;

export type TextStyleKey = keyof typeof textStyles;

/**
 * NativeWind(Tailwind) className 조합 — textStyles와 1:1 대응.
 * 컴포넌트에서 className={textClassNames.heading} 형태로 사용.
 */
export const textClassNames = {
  display: 'text-display font-serif-medium',
  title1: 'text-title1 font-serif-medium',
  title2: 'text-title2 font-serif-medium',
  heading: 'text-heading font-serif-medium',
  numeralLg: 'text-numeralLg font-serif-semi-bold',
  numeralMd: 'text-numeralMd font-serif-medium',
  hanjaLg: 'text-hanjaLg font-serif-medium',
  hanjaSm: 'text-hanjaSm font-serif-medium',
  serifLabel: 'text-serifLabel font-serif-medium',
  bodyLg: 'text-bodyLg font-sans-medium',
  body: 'text-body font-sans-regular',
  bodySm: 'text-bodySm font-sans-regular',
  uiMd: 'text-uiMd font-sans-medium',
  uiSm: 'text-uiSm font-sans-medium',
  label: 'text-label font-sans-medium',
  caption: 'text-caption font-sans-medium',
  overline: 'text-overline font-sans-medium uppercase',
} as const satisfies Record<TextStyleKey, string>;
