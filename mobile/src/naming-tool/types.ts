export type Ohaeng = '목' | '화' | '토' | '금' | '수';
export type Eumyang = '음' | '양';
export type HarmonyLevel = '대길' | '반길' | '대흉';
export type SuriLevel = '大吉' | '吉' | '中吉' | '中凶' | '凶' | '大凶';
export type Gender = 'male' | 'female';
export type OhaengRelation = '상생' | '동일' | '상극';

export interface CharSlotData {
  hangul: string;
  hanja: string;
  mean: string;
  strokeCount: number | null;
  charOhaeng: Ohaeng | null;    // character_five_elements (자원오행)
  baleumOhaeng: Ohaeng | null;  // pronunciation_five_elements (발음오행)
  soundEumyang: Eumyang | null; // sound_based_yin_yang (발음음양)
  strokeEumyang: Eumyang | null;// stroke_based_yin_yang (획수음양)
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
}

export interface EumyangHarmonyResult {
  harmonious: boolean;
  chars: (Eumyang | null)[];
  reason: string;
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
  wongyeok: SuriEntry;    // 원격
  hyeongyeok: SuriEntry;  // 형격
  igyeok: SuriEntry;      // 이격
  jeongyeok: SuriEntry;   // 정격
  totalScore: number;
}

export interface NamingAnalysis {
  baleumOhaeng: OhaengHarmonyResult | null;
  baleumEumyang: EumyangHarmonyResult | null;
  surigyeok: SurigyeokResult | null;
  jawonOhaeng: OhaengHarmonyResult | null;
  hoeksuEumyang: EumyangHarmonyResult | null;
  totalScore: number | null;
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
