export type Ohaeng = '목' | '화' | '토' | '금' | '수';
export type Eumyang = '음' | '양';
export type HarmonyLevel = '大吉' | '平' | '大凶';
export type SuriLevel = '大吉' | '吉' | '中吉' | '中凶' | '凶' | '大凶';
export type Gender = 'male' | 'female';
export type OhaengRelation = '상생' | '동일' | '상극';

/** 한자 선택 정보 — 어떤 한글에 대한 선택인지(forHangul)를 함께 저장해 한글 변경 시 자동 무효화 */
export interface HanjaSelection {
  forHangul: string;
  hanja: string;
  mean: string;
  strokeCount: number | null;
  charOhaeng: Ohaeng | null;
  soundEumyang: Eumyang | null;
  strokeEumyang: Eumyang | null;
}

/** 컴포넌트 표시용 computed view — useNamingToolState에서 hangulInput + resolvedHanjaInput으로 파생 */
export interface CharSlotData {
  hangul: string;
  hanja: string;
  mean: string;
  strokeCount: number | null;
  charOhaeng: Ohaeng | null;
  soundEumyang: Eumyang | null;
  strokeEumyang: Eumyang | null;
}

export interface NameInput {
  surname: CharSlotData;
  first1: CharSlotData;
  first2: CharSlotData;
}

export interface SajuInput {
  yongsin: Ohaeng | null;
}

export interface OhaengPair {
  a: Ohaeng;
  b: Ohaeng;
  relation: OhaengRelation;
}

export interface OhaengHarmonyResult {
  level: HarmonyLevel;
  pairs: OhaengPair[];
  totalScore: number;
  reason: string;
  combinationKey: string;
}

export interface EumyangHarmonyResult {
  harmonious: boolean;
  chars: (Eumyang | null)[];
  reason: string;
  combinationKey: string;
  rating: string; // 吉 | 凶 — 음양조화.json 기준
}

export interface SuriEntry {
  number: number;
  level: SuriLevel;
  score: number;
  name1: string;
  name2: string;
  interpretation: string;
  easyInterpretation?: string;
}

export interface SurigyeokResult {
  wongyeok: SuriEntry; // 원격
  hyeongyeok: SuriEntry; // 형격
  igyeok: SuriEntry; // 이격
  jeongyeok: SuriEntry; // 정격
  totalScore: number;
}

export interface NamingAnalysis {
  baleumOhaeng: OhaengHarmonyResult | null;
  baleumEumyang: EumyangHarmonyResult | null;
  surigyeok: SurigyeokResult | null;
  jawonOhaeng: OhaengHarmonyResult | null;
  hoeksuEumyang: EumyangHarmonyResult | null;
  totalScore: number | null;
  ohaengScore: number | null; // 오행 기둥 점수 0–100 (발음오행 + 자원오행)
  suriScore: number | null; // 수리 기둥 점수 0–100
  eumyangScore: number | null; // 음양 기둥 점수 0–100 (발음음양 + 획수음양)
}

export interface HanjaSearchResult {
  hanja: string;
  eum: string;
  mean: string;
  strokeCount: number | null;
  charOhaeng: Ohaeng | null;
  baleumOhaeng: Ohaeng | null;
  soundEumyang: Eumyang | null;
  strokeEumyang: Eumyang | null;
}
