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
  한자: string;
  meaning: string;
  오행: string;
  stroke_count: number;
}

export interface SurnameSyllable {
  한글: string;
  한자: string;
  meaning: string;
  오행: string;
  stroke_count: number | null;
  sound_eumyang: string;
  stroke_eumyang: string;
}

export interface NameData {
  한글: string;
  full_name: string;
  surname_syllable?: SurnameSyllable;
  syllables: {
    한글: string;
    한자: string;
    meaning: string;
    오행: string; // 발음오행
    char_오행?: string; // 자원오행 (한글: 목/화/토/금/수)
    stroke_count?: number | null;
    sound_eumyang?: string;
    stroke_eumyang?: string;
    hanja_options?: HanjaOption[];
  }[];
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
