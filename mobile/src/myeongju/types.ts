export type OhaengType = '목' | '화' | '토' | '금' | '수';

export const OHAENG_LABEL: Record<OhaengType, string> = {
  목: '목(木)',
  화: '화(火)',
  토: '토(土)',
  금: '금(金)',
  수: '수(水)',
};

export interface MyeongJuProfile {
  id: string;
  ilgan: string; // 일간 한자 (e.g. '壬')
  ohaeng: OhaengType;
  iljoo: string; // 일주명 한글 (e.g. '임자일주' — 일간+일지)
  iljooHanja: string; // 일주 한자 (e.g. '壬子')
  gender: 'male' | 'female';
  calendarType: '양력' | '음력';
  birthDate: string;
  birthTime: string;
  surname: string; // 성씨 한글 (e.g. '김')
  surnameHanja: string; // 성씨 한자 (e.g. '金')
  yongsin: OhaengType | null; // 억부용신 오행
  heesin: OhaengType | null; // 희신 오행
  gisin: OhaengType | null; // 기신 오행
  analysisCount?: number;
  savedCount?: number;
}
