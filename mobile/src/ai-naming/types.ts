import { Eumyang, Ohaeng } from '@/naming-tool/types';

export interface ChoiceGroupData {
  question: string;
  choices: string[];
  multi: boolean;
  allow_custom: boolean;
  field_key: string;
  max_select?: number;
  follow_up?: { trigger: string; placeholder: string };
}

export interface HanjaOption {
  hanja: string;
  mean: string;
  charOhaeng: Ohaeng | null;
  strokeCount: number | null;
}

export interface HanjaCharData {
  hangul: string;
  hanja: string;
  mean: string;
  strokeCount: number | null;
  soundEumyang: Eumyang | null;
  strokeEumyang: Eumyang | null;
  baleumOhaeng: Ohaeng | null;
  charOhaeng: Ohaeng | null;
  strokeOhaeng?: string;
  hanjaOptions?: HanjaOption[];
}

export interface NameData {
  한글: string;
  full_name: string;
  familyCharacter: HanjaCharData;
  firstCharacter: HanjaCharData;
  secondCharacter: HanjaCharData;
  발음오행_조화: string;
  발음오행_조화_이유?: string;
  rarity_signal: string;
  reason: string;
  score_breakdown?: {
    용신?: number;
    자원오행?: number;
    수리격?: number;
    발음오행?: number;
    발음음양?: number;
    획수음양?: number;
  };
}

export type ContentBlock =
  | { type: 'TEXT'; data: { text: string } }
  | { type: 'NAME'; data: NameData }
  | { type: 'CHOICE_GROUP'; data: ChoiceGroupData };

export interface ApiResponse {
  session_id: string;
  stage: string;
  content: ContentBlock[];
  liked_names: string[];
  disliked_names: string[];
  payment_required: boolean;
  naming_direction: string | null;
  debug?: { raw_llm_output?: string; state?: Record<string, unknown> } | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: ContentBlock[];
  stage?: string;
  debug?: ApiResponse['debug'];
}
