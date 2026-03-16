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
 *
 * ─────────────────────────────────────────────
 * Noto Serif KR  (Display → Label)
 * ─────────────────────────────────────────────
 *
 *  display      32px light  — 가장 큰 화면 타이틀, 섹션 인트로 등 임팩트 있는 단어
 *  title1       24px medium — 앱 타이틀, 큰 스크린 제목 (로고 텍스트 등)
 *  title2       20px medium — 서브 타이틀, 바텀시트 제목
 *  heading      16px medium — 섹션 제목, 카드 헤더
 *  numeralLg    32px light  — 종합 점수처럼 큰 숫자 단독 표시 (line-height 1 = tight)
 *  numeralMd    20px regular— 수리격 숫자 등 중형 숫자
 *  hanjaLg      24px medium — 한자 대형 표시 (호출부에서 fontSize 22–26 오버라이드 가능)
 *  hanjaSm      16px regular— 한자 소형 표시 (호출부에서 fontSize 15–18 오버라이드 가능)
 *  serifLabel   13px medium — Serif 계열 레이블·뱃지 (발음오행 등 강조 배지)
 *
 * ─────────────────────────────────────────────
 * Noto Sans KR  (Body → Caption)
 * ─────────────────────────────────────────────
 *
 *  bodyLg       15px regular— 분석 결과 본문, 긴 설명 텍스트 강조
 *  body         13px regular— 일반 본문 설명
 *  bodySm       11px regular— 보조 설명, 힌트, 빈 상태 메시지
 *  uiMd         14px medium — 버튼·탭 레이블, 중형 UI 액션 텍스트
 *  uiSm         13px medium — 평가 카드 제목, 소형 UI 액션 텍스트
 *  label        11px medium — 뱃지·칩·태그 (성별 선택, 오행 배지 등)
 *  caption      10px regular— 부가 정보, 한자 뜻·음 안내
 *  overline      9px medium — 섹션 구분 라벨 (uppercase 고정)
 */
export const textStyles = {
  // ── Noto Serif KR ──────────────────────────────────────────────────

  /** 가장 큰 화면 타이틀 / 섹션 인트로 — 임팩트 있는 단어 한두 개 */
  display: {
    fontFamily: fontFamily.serifLight,
    fontWeight: '300',
    fontSize: 32,
    letterSpacing: -0.5,
    lineHeight: Math.round(32 * 1.2),  // 38
  },

  /** 앱 타이틀 / 큰 스크린 제목 (이름공방 로고 등) */
  title1: {
    fontFamily: fontFamily.serifMedium,
    fontWeight: '500',
    fontSize: 24,
    letterSpacing: 2,
    lineHeight: Math.round(24 * 1.3),  // 31
  },

  /** 서브 타이틀 / 바텀시트 제목 */
  title2: {
    fontFamily: fontFamily.serifMedium,
    fontWeight: '500',
    fontSize: 20,
    letterSpacing: 1,
    lineHeight: Math.round(20 * 1.35), // 27
  },

  /** 섹션 제목 / 카드 헤더 */
  heading: {
    fontFamily: fontFamily.serifMedium,
    fontWeight: '500',
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: Math.round(16 * 1.4),  // 22
  },

  /** 종합 점수 등 큰 숫자 단독 표시 */
  numeralLg: {
    fontFamily: fontFamily.serifLight,
    fontWeight: '300',
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: Math.round(32 * 1),    // 32
  },

  /** 수리격 숫자 등 중형 숫자 */
  numeralMd: {
    fontFamily: fontFamily.serifRegular,
    fontWeight: '400',
    fontSize: 20,
    letterSpacing: 0,
    lineHeight: Math.round(20 * 1),    // 20
  },

  /**
   * 한자 대형 표시 (22–26px)
   * 기본 fontSize 24 — 호출부에서 fontSize 오버라이드 가능
   * 예: <Text style={[textStyles.hanjaLg, { fontSize: 26 }]}>金</Text>
   */
  hanjaLg: {
    fontFamily: fontFamily.serifMedium,
    fontWeight: '500',
    fontSize: 24,
    letterSpacing: 0,
    lineHeight: Math.round(24 * 1),    // 24
  },

  /**
   * 한자 소형 표시 (15–18px)
   * 기본 fontSize 16 — 호출부에서 fontSize 오버라이드 가능
   * 예: <Text style={[textStyles.hanjaSm, { fontSize: 18 }]}>金</Text>
   */
  hanjaSm: {
    fontFamily: fontFamily.serifRegular,
    fontWeight: '400',
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: Math.round(16 * 1),    // 16
  },

  /** Serif 계열 레이블·배지 — 발음오행 등 강조 배지 */
  serifLabel: {
    fontFamily: fontFamily.serifMedium,
    fontWeight: '500',
    fontSize: 13,
    letterSpacing: 1,
    lineHeight: Math.round(13 * 1.4),  // 18
  },

  // ── Noto Sans KR ───────────────────────────────────────────────────

  /** 분석 결과 본문, 긴 설명 텍스트 강조 */
  bodyLg: {
    fontFamily: fontFamily.sansRegular,
    fontWeight: '400',
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: Math.round(15 * 1.7),  // 26
  },

  /** 일반 본문 설명 */
  body: {
    fontFamily: fontFamily.sansRegular,
    fontWeight: '400',
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: Math.round(13 * 1.7),  // 22
  },

  /** 보조 설명 / 힌트 / 빈 상태 메시지 */
  bodySm: {
    fontFamily: fontFamily.sansRegular,
    fontWeight: '400',
    fontSize: 11,
    letterSpacing: 0,
    lineHeight: Math.round(11 * 1.7),  // 19
  },

  /** 버튼·탭 레이블, 중형 UI 액션 텍스트 */
  uiMd: {
    fontFamily: fontFamily.sansMedium,
    fontWeight: '500',
    fontSize: 14,
    letterSpacing: 0.3,
    lineHeight: Math.round(14 * 1.4),  // 20
  },

  /** 평가 카드 제목 / 소형 UI 액션 텍스트 */
  uiSm: {
    fontFamily: fontFamily.sansMedium,
    fontWeight: '500',
    fontSize: 13,
    letterSpacing: 0.3,
    lineHeight: Math.round(13 * 1.4),  // 18
  },

  /** 뱃지·칩·태그 (성별 선택, 오행 배지 등) */
  label: {
    fontFamily: fontFamily.sansMedium,
    fontWeight: '500',
    fontSize: 11,
    letterSpacing: 0.5,
    lineHeight: Math.round(11 * 1.4),  // 15
  },

  /** 부가 정보 / 한자 뜻·음 안내 */
  caption: {
    fontFamily: fontFamily.sansRegular,
    fontWeight: '400',
    fontSize: 10,
    letterSpacing: 0.5,
    lineHeight: Math.round(10 * 1.5),  // 15
  },

  /** 섹션 구분 라벨 — 항상 uppercase로 렌더링됨 */
  overline: {
    fontFamily: fontFamily.sansMedium,
    fontWeight: '500',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    lineHeight: Math.round(9 * 1.5),   // 14
  },
} as const satisfies Record<string, TextStyle>;

export type TextStyleKey = keyof typeof textStyles;
