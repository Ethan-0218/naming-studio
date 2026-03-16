import type { TextStyle } from 'react-native';

/** useFonts()에 전달하는 키와 일치해야 하는 폰트 패밀리 이름 */
export const fontFamily = {
  serifLight:    'NotoSerifKR_300Light',
  serifRegular:  'NotoSerifKR_400Regular',
  serifMedium:   'NotoSerifKR_500Medium',
  serifSemiBold: 'NotoSerifKR_600SemiBold',

  sansLight:   'NotoSansKR_300Light',
  sansRegular: 'NotoSansKR_400Regular',
  sansMedium:  'NotoSansKR_500Medium',
} as const;

export type FontFamilyKey = keyof typeof fontFamily;

/**
 * 역할별 텍스트 스타일 — StyleSheet에 spread해서 사용
 *
 * 주의: RN의 lineHeight는 배수가 아닌 절댓값(px)
 * 주의: textTransform은 'uppercase' as const 필수 (TypeScript 타입 확장 방지)
 */
export const textStyles = {
  /** 앱 타이틀: 이름공방 로고 등 */
  appTitle: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 22,
    letterSpacing: 2,
  },

  /** 한자 대형 표시: 20–26px, 호출부에서 fontSize 오버라이드 가능 */
  hanjaDisplay: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 24,
  },

  /** 섹션 제목 / 바텀시트 타이틀 */
  sectionTitle: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 16,
  },

  /** 종합 점수 숫자 전용 */
  scoreDisplay: {
    fontFamily: fontFamily.serifLight,
    fontSize: 32,
  },

  /** 수리격 숫자 */
  numerologyNum: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 20,
  },

  /** 평가 카드 제목 */
  cardTitle: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 13,
    letterSpacing: 0.3,
  },

  /** 본문 설명 */
  body: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 11,
    lineHeight: 18.7, // 11 * 1.7
  },

  /** 라벨 · 뱃지 */
  labelBadge: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 10,
    letterSpacing: 1,
  },

  /** 섹션 라벨 (uppercase) */
  sectionLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
} as const satisfies Record<string, TextStyle>;

export type TextStyleKey = keyof typeof textStyles;
