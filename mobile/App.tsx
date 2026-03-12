import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const BACKEND_URL = 'http://localhost:8000';

// ── Types ──────────────────────────────────────────────────────────────
interface ChoiceGroupData {
  question: string;
  choices: string[];
  multi: boolean;
  allow_custom: boolean;
  field_key: string;
  max_select?: number;
  follow_up?: { trigger: string; placeholder: string };
}

type ContentBlock =
  | { type: 'TEXT'; data: { text: string } }
  | { type: 'NAME'; data: NameData }
  | { type: 'CHOICE_GROUP'; data: ChoiceGroupData }
  | { type: 'FORM_BUTTON' };   // 정보 입력 버튼 블록 (로컬 전용)

interface HanjaOption {
  한자: string;
  meaning: string;
  오행: string;
  stroke_count: number;
}

interface NameData {
  한글: string;
  full_name: string;
  syllables: { 한글: string; 한자: string; meaning: string; 오행: string; hanja_options?: HanjaOption[] }[];
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

interface ApiResponse {
  session_id: string;
  stage: string;
  content: ContentBlock[];
  liked_names: string[];
  disliked_names: string[];
  payment_required: boolean;
  naming_direction: string | null;
  debug?: { raw_llm_output?: string; state?: Record<string, unknown> } | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: ContentBlock[];
  stage?: string;
  debug?: ApiResponse['debug'];
}

interface HanjaResult {
  hanja: string;
  eum: string;
  mean: string;
  stroke: number | null;
}

interface SelectedHanja {
  hangul: string;
  hanja: string;
  mean: string;
}

interface UserInfoForm {
  surname: SelectedHanja | null;
  gender: '남' | '여';
  birth_year: string;
  birth_month: string;
  birth_day: string;
  is_lunar: boolean;
  birth_hour: string;
  birth_minute: string;
  birth_time_unknown: boolean;
  dolrimja: SelectedHanja | null;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: [
    {
      type: 'TEXT',
      data: {
        text: '안녕하세요! 저는 이름이예요 ✨\n\n아이에게 꼭 맞는 이름을 함께 찾아드릴게요.\n\n시작하려면 아이의 성씨, 성별, 생년월일, 출생시간이 필요해요.',
      },
    },
    { type: 'FORM_BUTTON' },
  ],
};

// ── Constants ──────────────────────────────────────────────────────────
const harmonyColor: Record<string, string> = {
  대길: '#2ecc71', 반길: '#f39c12', 대흉: '#e74c3c',
};
const rarityColor: Record<string, string> = {
  희귀: '#9b59b6', 보통: '#3498db', 흔한: '#95a1a8',
};
const ohaengColor: Record<string, string> = {
  목: '#27ae60', 화: '#e74c3c', 토: '#d4a017', 금: '#7f8c8d', 수: '#2980b9',
};
const stageLabel: Record<string, string> = {
  welcome: '환영',
  info_collection: '정보 수집',
  preference_interview: '취향 인터뷰',
  direction_briefing: '방향 브리핑',
  direction_confirm: '방향 확인',
  initial_candidates: '초기 후보',
  payment_gate: '결제 안내',
  candidate_exploration: '이름 탐색',
};

const PURPLE = '#6c63ff';
const BG = '#f4f3ff';
const CARD_BG = '#ffffff';

// ── HanjaSearchField (공통) ────────────────────────────────────────────
function HanjaSearchField({ selected, onSelect, onClear, error, endpoint, placeholder, chipSuffix = '' }: {
  selected: SelectedHanja | null;
  onSelect: (s: SelectedHanja) => void;
  onClear: () => void;
  error?: string;
  endpoint: string;   // "/api/surname-search" | "/api/hanja-search"
  placeholder: string;
  chipSuffix?: string;  // 성씨: "씨", 돌림자: "자"
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HanjaResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(q: string) {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${BACKEND_URL}${endpoint}?q=${encodeURIComponent(q)}`);
        const data: HanjaResult[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  }

  function pick(r: HanjaResult) {
    onSelect({ hangul: r.eum, hanja: r.hanja, mean: r.mean });
    setQuery('');
    setResults([]);
  }

  if (selected) {
    return (
      <View style={fm.hanjaChip}>
        <View style={fm.hanjaChipInner}>
          <Text style={fm.hanjaChipChar}>{selected.hanja}</Text>
          <View>
            <Text style={fm.hanjaChipHangul}>{selected.hangul}{chipSuffix}</Text>
            <Text style={fm.hanjaChipMean} numberOfLines={1}>{selected.mean}</Text>
          </View>
        </View>
        <Pressable onPress={onClear} style={fm.hanjaChipClearBtn}>
          <Text style={fm.hanjaChipClearText}>변경</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View style={fm.searchRow}>
        <TextInput
          style={[fm.input, { flex: 1 }, error && fm.inputErr]}
          value={query}
          onChangeText={search}
          placeholder={placeholder}
          placeholderTextColor="#bbb"
          maxLength={4}
        />
        {searching && <ActivityIndicator style={{ marginLeft: 8 }} color={PURPLE} size="small" />}
      </View>
      {error && !query ? <Text style={fm.errText}>{error}</Text> : null}
      {results.length > 0 && (
        <View style={fm.searchResults}>
          {results.map((r, i) => (
            <Pressable
              key={i}
              style={[fm.searchResultItem, i < results.length - 1 && fm.searchResultBorder]}
              onPress={() => pick(r)}
            >
              <Text style={fm.searchResultHanja}>{r.hanja}</Text>
              <Text style={fm.searchResultEum}>{r.eum}{chipSuffix}</Text>
              <Text style={fm.searchResultMean} numberOfLines={1}>{r.mean}</Text>
              {r.stroke != null && <Text style={fm.searchResultStroke}>{r.stroke}획</Text>}
            </Pressable>
          ))}
        </View>
      )}
      {query.trim() && !searching && results.length === 0 && (
        <Text style={fm.searchNoResult}>검색 결과가 없어요</Text>
      )}
    </View>
  );
}

// ── DolrimjaModal (채팅 중 돌림자 수정) ───────────────────────────────
function DolrimjaModal({ visible, onClose, onSubmit, loading }: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (selected: SelectedHanja) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState<SelectedHanja | null>(null);

  function handleClose() {
    setSelected(null);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={fm.backdrop} onPress={handleClose} />
      <View style={[fm.sheet, { maxHeight: '60%' }]}>
        <View style={fm.handle} />
        <View style={fm.header}>
          <Text style={fm.title}>돌림자 변경</Text>
          <Pressable style={fm.closeBtn} onPress={handleClose}>
            <Text style={fm.closeBtnText}>✕</Text>
          </Pressable>
        </View>
        <Text style={fm.subtitle}>새로운 돌림자를 검색해서 선택해주세요</Text>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={fm.field}>
            <HanjaSearchField
              selected={selected}
              onSelect={setSelected}
              onClear={() => setSelected(null)}
              endpoint="/api/hanja-search"
              placeholder="돌림자 검색 (예: 준, 현, 민)"
              chipSuffix="자"
            />
          </View>
          <Pressable
            style={[fm.submitBtn, (!selected || loading) && fm.submitBtnOff]}
            onPress={() => selected && onSubmit(selected)}
            disabled={!selected || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={fm.submitText}>돌림자 변경하기</Text>
            }
          </Pressable>
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── InfoForm Modal ─────────────────────────────────────────────────────
function InfoFormModal({ visible, onClose, onSubmit, loading }: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: UserInfoForm) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<UserInfoForm>({
    surname: { hangul: '김', hanja: '金', mean: '쇠 금, 성 김' },
    gender: '남',
    birth_year: '2025',
    birth_month: '1',
    birth_day: '15',
    is_lunar: false,
    birth_hour: '14',
    birth_minute: '30',
    birth_time_unknown: false,
    dolrimja: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof UserInfoForm>(key: K, value: UserInfoForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.surname?.hangul) errs.surname = '성씨를 선택해주세요';
    const y = parseInt(form.birth_year);
    const m = parseInt(form.birth_month);
    const d = parseInt(form.birth_day);
    if (!form.birth_year || isNaN(y) || y < 2000 || y > 2030)
      errs.birth_year = '올바른 연도 (2000-2030)';
    if (!form.birth_month || isNaN(m) || m < 1 || m > 12)
      errs.birth_month = '1-12';
    if (!form.birth_day || isNaN(d) || d < 1 || d > 31)
      errs.birth_day = '1-31';
    if (!form.birth_time_unknown && form.birth_hour) {
      const h = parseInt(form.birth_hour);
      if (isNaN(h) || h < 0 || h > 23) errs.birth_hour = '0-23';
    }
    if (!form.birth_time_unknown && form.birth_minute) {
      const min = parseInt(form.birth_minute);
      if (isNaN(min) || min < 0 || min > 59) errs.birth_minute = '0-59';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (validate()) onSubmit(form);
  }

  const canSubmit = !!(form.surname?.hangul && form.birth_year && form.birth_month && form.birth_day);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={fm.backdrop} onPress={onClose} />
      <View style={fm.sheet}>
        <View style={fm.handle} />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={fm.header}>
            <Text style={fm.title}>아이 정보 입력</Text>
            <Pressable style={fm.closeBtn} onPress={onClose}>
              <Text style={fm.closeBtnText}>✕</Text>
            </Pressable>
          </View>
          <Text style={fm.subtitle}>정확한 정보를 입력하면 더 잘 어울리는 이름을 추천해드릴 수 있어요</Text>

          {/* 성씨 */}
          <View style={fm.field}>
            <Text style={fm.label}>성씨 <Text style={fm.req}>*</Text></Text>
            <HanjaSearchField
              selected={form.surname}
              onSelect={s => set('surname', s)}
              onClear={() => set('surname', null)}
              endpoint="/api/surname-search"
              placeholder="성씨 검색 (예: 김, 이, 박)"
              chipSuffix="씨"
              error={errors.surname}
            />
          </View>

          {/* 성별 */}
          <View style={fm.field}>
            <Text style={fm.label}>성별 <Text style={fm.req}>*</Text></Text>
            <View style={fm.genderRow}>
              {(['남', '여'] as const).map(g => (
                <Pressable
                  key={g}
                  style={[fm.genderBtn, form.gender === g && fm.genderBtnOn]}
                  onPress={() => set('gender', g)}
                >
                  <Text style={[fm.genderText, form.gender === g && fm.genderTextOn]}>
                    {g === '남' ? '👦 아들' : '👧 딸'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 생년월일 */}
          <View style={fm.field}>
            <View style={fm.labelRow}>
              <Text style={fm.label}>생년월일 <Text style={fm.req}>*</Text></Text>
              <View style={fm.lunarRow}>
                {([false, true] as const).map(lunar => (
                  <Pressable
                    key={String(lunar)}
                    style={[fm.lunarBtn, form.is_lunar === lunar && fm.lunarBtnOn]}
                    onPress={() => set('is_lunar', lunar)}
                  >
                    <Text style={[fm.lunarText, form.is_lunar === lunar && fm.lunarTextOn]}>
                      {lunar ? '음력' : '양력'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={fm.dateRow}>
              <View style={{ flex: 2.2 }}>
                <TextInput
                  style={[fm.input, errors.birth_year && fm.inputErr]}
                  value={form.birth_year}
                  onChangeText={v => set('birth_year', v.replace(/\D/g, ''))}
                  placeholder="년도"
                  placeholderTextColor="#bbb"
                  keyboardType="numeric"
                  maxLength={4}
                />
                {errors.birth_year ? <Text style={fm.errText}>{errors.birth_year}</Text> : null}
              </View>
              <Text style={fm.sep}>년</Text>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[fm.input, errors.birth_month && fm.inputErr]}
                  value={form.birth_month}
                  onChangeText={v => set('birth_month', v.replace(/\D/g, ''))}
                  placeholder="월"
                  placeholderTextColor="#bbb"
                  keyboardType="numeric"
                  maxLength={2}
                />
                {errors.birth_month ? <Text style={fm.errText}>{errors.birth_month}</Text> : null}
              </View>
              <Text style={fm.sep}>월</Text>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[fm.input, errors.birth_day && fm.inputErr]}
                  value={form.birth_day}
                  onChangeText={v => set('birth_day', v.replace(/\D/g, ''))}
                  placeholder="일"
                  placeholderTextColor="#bbb"
                  keyboardType="numeric"
                  maxLength={2}
                />
                {errors.birth_day ? <Text style={fm.errText}>{errors.birth_day}</Text> : null}
              </View>
              <Text style={fm.sep}>일</Text>
            </View>
          </View>

          {/* 돌림자 (선택) */}
          <View style={fm.field}>
            <Text style={fm.label}>돌림자 <Text style={fm.optional}>(선택)</Text></Text>
            <HanjaSearchField
              selected={form.dolrimja}
              onSelect={s => set('dolrimja', s)}
              onClear={() => set('dolrimja', null)}
              endpoint="/api/hanja-search"
              placeholder="돌림자 검색 (예: 준, 현, 민)"
              chipSuffix="자"
            />
          </View>

          {/* 출생시간 */}
          <View style={fm.field}>
            <Text style={fm.label}>출생시간</Text>
            <Pressable
              style={fm.checkRow}
              onPress={() => set('birth_time_unknown', !form.birth_time_unknown)}
            >
              <View style={[fm.checkbox, form.birth_time_unknown && fm.checkboxOn]}>
                {form.birth_time_unknown && <Text style={fm.checkMark}>✓</Text>}
              </View>
              <Text style={fm.checkLabel}>시간을 모릅니다</Text>
            </Pressable>
            {!form.birth_time_unknown && (
              <View style={fm.dateRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[fm.input, errors.birth_hour && fm.inputErr]}
                    value={form.birth_hour}
                    onChangeText={v => set('birth_hour', v.replace(/\D/g, ''))}
                    placeholder="시"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  {errors.birth_hour ? <Text style={fm.errText}>{errors.birth_hour}</Text> : null}
                </View>
                <Text style={fm.sep}>시</Text>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[fm.input, errors.birth_minute && fm.inputErr]}
                    value={form.birth_minute}
                    onChangeText={v => set('birth_minute', v.replace(/\D/g, ''))}
                    placeholder="분"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  {errors.birth_minute ? <Text style={fm.errText}>{errors.birth_minute}</Text> : null}
                </View>
                <Text style={fm.sep}>분</Text>
                <View style={{ flex: 1 }} />
              </View>
            )}
          </View>

          <Pressable
            style={[fm.submitBtn, (!canSubmit || loading) && fm.submitBtnOff]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={fm.submitText}>이름 찾기 시작 →</Text>
            }
          </Pressable>
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── DebugPanel ────────────────────────────────────────────────────────
function DebugPanel({ debug }: { debug: ApiResponse['debug'] }) {
  const [open, setOpen] = useState(false);
  if (!debug) return null;
  return (
    <View style={db.wrap}>
      <Pressable style={db.toggle} onPress={() => setOpen(v => !v)}>
        <Text style={db.toggleText}>{open ? '▾' : '▸'} DEBUG</Text>
      </Pressable>
      {open && (
        <ScrollView style={db.scroll} nestedScrollEnabled>
          <ScrollView horizontal nestedScrollEnabled>
            <View>
              {debug.raw_llm_output != null && (
                <>
                  <Text style={db.sectionLabel}>── raw LLM output ──</Text>
                  <Text style={db.code}>{debug.raw_llm_output}</Text>
                </>
              )}
              {debug.state != null && (
                <>
                  <Text style={[db.sectionLabel, { marginTop: 10 }]}>── state snapshot ──</Text>
                  <Text style={db.code}>{JSON.stringify(debug.state, null, 2)}</Text>
                </>
              )}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}

// ── NameCard ───────────────────────────────────────────────────────────
function NameCard({ data, liked, disliked, onLike, onDislike }: {
  data: NameData;
  liked: boolean;
  disliked: boolean;
  onLike: () => void;
  onDislike: () => void;
}) {
  const harmony = data.발음오행_조화 ?? '반길';
  return (
    <View style={s.nameCard}>
      <View style={s.nameHeader}>
        <Text style={s.nameText}>{data.full_name}</Text>
        <View style={[s.badge, { backgroundColor: harmonyColor[harmony] ?? '#95a1a8' }]}>
          <Text style={s.badgeText}>{harmony}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: rarityColor[data.rarity_signal] ?? '#3498db' }]}>
          <Text style={s.badgeText}>{data.rarity_signal}</Text>
        </View>
      </View>
      <View style={s.syllableRow}>
        {data.syllables.map((syl, i) => (
          <View key={i} style={s.syllable}>
            <Text style={s.sylHanja}>{syl.한자 || syl.한글}</Text>
            <Text style={s.sylHangul}>{syl.한글}</Text>
            {syl.오행 ? (
              <View style={[s.ohaengPill, { backgroundColor: ohaengColor[syl.오행] ?? '#ccc' }]}>
                <Text style={s.ohaengText}>{syl.오행}</Text>
              </View>
            ) : null}
            <Text style={s.sylMeaning} numberOfLines={2}>{syl.meaning}</Text>
          </View>
        ))}
      </View>
      {data.reason ? <Text style={s.nameReason}>{data.reason}</Text> : null}
      {data.score_breakdown && Object.keys(data.score_breakdown).length > 0 ? (
        <View style={s.scoreBreakdown}>
          {(Object.entries(data.score_breakdown) as [string, number][]).map(([key, val]) => (
            <View key={key} style={s.scoreRow}>
              <Text style={s.scoreLabel}>{key}</Text>
              <View style={s.scoreBarBg}>
                <View style={[s.scoreBarFill, { width: `${Math.round(val * 100)}%` as any }]} />
              </View>
              <Text style={s.scoreValue}>{Math.round(val * 100)}%</Text>
            </View>
          ))}
        </View>
      ) : null}
      {data.syllables.some(syl => syl.hanja_options && syl.hanja_options.length > 0) ? (
        <View style={s.hanjaOptionsSection}>
          {data.syllables.map((syl, i) =>
            syl.hanja_options && syl.hanja_options.length > 0 ? (
              <View key={i} style={s.hanjaOptionsRow}>
                <Text style={s.hanjaOptionsLabel}>{syl.한글} 한자 선택:</Text>
                <View style={s.hanjaOptionsList}>
                  {syl.hanja_options.map((opt, j) => (
                    <View key={j} style={s.hanjaOptionItem}>
                      <Text style={s.hanjaOptionChar}>{opt.한자}</Text>
                      <Text style={s.hanjaOptionMeaning}>{opt.meaning}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null
          )}
        </View>
      ) : null}
      <View style={s.reactionRow}>
        <Pressable style={[s.reactionBtn, liked && s.reactionLiked]} onPress={onLike}>
          <Text style={[s.reactionText, liked && s.reactionTextActive]}>👍 좋아요</Text>
        </Pressable>
        <Pressable style={[s.reactionBtn, disliked && s.reactionDisliked]} onPress={onDislike}>
          <Text style={[s.reactionText, disliked && s.reactionTextActive]}>👎 별로</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── SimpleMarkdown ───────────────────────────────────────────────────────
function renderInlineBold(text: string, baseStyle: object): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={i} style={[baseStyle, { fontWeight: 'bold' }]}>{part.slice(2, -2)}</Text>;
    }
    return <Text key={i} style={baseStyle}>{part}</Text>;
  });
}

function SimpleMarkdown({ text, baseStyle }: { text: string; baseStyle: object }) {
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <Text key={i} style={[baseStyle, { fontWeight: 'bold', marginTop: 8, marginBottom: 2 }]}>
              {line.slice(4)}
            </Text>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <Text key={i} style={[baseStyle, { paddingLeft: 8 }]}>
              {'• '}{renderInlineBold(line.slice(2), baseStyle)}
            </Text>
          );
        }
        if (line === '') {
          return <View key={i} style={{ height: 6 }} />;
        }
        return (
          <Text key={i} style={baseStyle}>
            {renderInlineBold(line, baseStyle)}
          </Text>
        );
      })}
    </View>
  );
}

// ── ChoiceGroupBlock ────────────────────────────────────────────────────
function ChoiceGroupBlock({ data, onSend, submitted }: {
  data: ChoiceGroupData;
  onSend: (text: string) => void;
  submitted: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [done, setDone] = useState(submitted);

  function toggleChoice(choice: string) {
    if (done) return;
    if (data.multi) {
      setSelected(prev => {
        if (prev.includes(choice)) return prev.filter(c => c !== choice);
        if (data.max_select && prev.length >= data.max_select) return prev;
        return [...prev, choice];
      });
      setCustomText('');
    } else {
      // 단일 선택: follow_up 트리거 체크
      if (data.follow_up && choice === data.follow_up.trigger) {
        setSelected([choice]);
        setShowFollowUp(true);
      } else {
        setSelected([choice]);
        setDone(true);
        onSend(choice);
      }
    }
  }

  function submitMulti() {
    if (done) return;
    const parts = [...selected];
    if (customText.trim()) parts.push(customText.trim());
    const msg = parts.length > 0 ? parts.join(', ') : '상관없어요';
    setDone(true);
    onSend(msg);
  }

  function submitFollowUp() {
    if (done) return;
    const msg = followUpText.trim()
      ? `${selected[0]}: ${followUpText.trim()}`
      : selected[0];
    setDone(true);
    onSend(msg);
  }

  return (
    <View style={[s.choiceGroup, done && s.choiceGroupDone]}>
      <Text style={s.choiceQuestion}>{data.question}</Text>
      <View style={s.choiceChips}>
        {data.choices.map(choice => (
          <Pressable
            key={choice}
            style={[s.chip, selected.includes(choice) && s.chipSelected, done && s.chipDisabled]}
            onPress={() => toggleChoice(choice)}
          >
            <Text style={[s.chipText, selected.includes(choice) && s.chipTextSelected]}>{choice}</Text>
          </Pressable>
        ))}
        {data.allow_custom && !done && (
          <View style={s.chipCustomRow}>
            <TextInput
              style={s.chipCustomInput}
              value={customText}
              onChangeText={text => { setCustomText(text); if (text.trim()) setSelected([]); }}
              placeholder="직접 입력"
              placeholderTextColor="#aaa"
            />
          </View>
        )}
      </View>
      {showFollowUp && !done && data.follow_up && (
        <View style={s.followUpRow}>
          <TextInput
            style={s.followUpInput}
            value={followUpText}
            onChangeText={setFollowUpText}
            placeholder={data.follow_up.placeholder}
            placeholderTextColor="#aaa"
            autoFocus
          />
          <Pressable style={s.followUpBtn} onPress={submitFollowUp}>
            <Text style={s.followUpBtnText}>완료</Text>
          </Pressable>
        </View>
      )}
      {data.multi && !done && (
        <Pressable style={s.multiSubmitBtn} onPress={submitMulti}>
          <Text style={s.multiSubmitBtnText}>선택 완료</Text>
        </Pressable>
      )}
      {done && selected.length > 0 && (
        <Text style={s.choiceDoneText}>선택: {selected.join(', ')}</Text>
      )}
    </View>
  );
}


// ── MessageBubble ──────────────────────────────────────────────────────
function MessageBubble({ msg, liked, disliked, onLike, onDislike, onOpenForm, formSubmitted, showDebug, onSend }: {
  msg: ChatMessage;
  liked: string[];
  disliked: string[];
  onLike: (name: string) => void;
  onDislike: (name: string) => void;
  onOpenForm: () => void;
  formSubmitted: boolean;
  showDebug: boolean;
  onSend: (text: string) => void;
}) {
  if (msg.role === 'user') {
    const text = msg.content
      .filter(b => b.type === 'TEXT')
      .map(b => (b as { type: 'TEXT'; data: { text: string } }).data.text)
      .join('');
    return (
      <View style={s.userWrap}>
        <View style={s.userBubble}>
          <Text style={s.userText}>{text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.aiWrap}>
      {msg.stage ? (
        <View style={s.stagePill}>
          <Text style={s.stagePillText}>{stageLabel[msg.stage] ?? msg.stage}</Text>
        </View>
      ) : null}
      {showDebug && <DebugPanel debug={msg.debug} />}
      {msg.content.map((block, i) => {
        if (block.type === 'TEXT') {
          return (
            <View key={i} style={s.aiBubble}>
              <SimpleMarkdown text={block.data.text} baseStyle={s.aiText} />
            </View>
          );
        }
        if (block.type === 'CHOICE_GROUP') {
          return (
            <ChoiceGroupBlock
              key={i}
              data={block.data}
              onSend={onSend}
              submitted={false}
            />
          );
        }
        if (block.type === 'FORM_BUTTON') {
          if (formSubmitted) return null;
          return (
            <Pressable key={i} style={s.formOpenBtn} onPress={onOpenForm}>
              <Text style={s.formOpenBtnText}>📋  정보 입력하기</Text>
            </Pressable>
          );
        }
        if (block.type === 'NAME') {
          const name = block.data.한글;
          return (
            <NameCard
              key={i}
              data={block.data}
              liked={liked.includes(name)}
              disliked={disliked.includes(name)}
              onLike={() => onLike(name)}
              onDislike={() => onDislike(name)}
            />
          );
        }
        return null;
      })}
    </View>
  );
}

// ── ReasonPicker ──────────────────────────────────────────────────────
const LIKE_REASONS = [
  { key: 'pronunciation',   label: '발음이 좋아요' },
  { key: 'vibe',            label: '분위기가 좋아요' },
  { key: 'meaning',         label: '뜻이 좋아요' },
  { key: 'surname_harmony', label: '성과 잘 어울려요' },
  { key: 'rarity',          label: '너무 흔하지 않아요' },
  { key: 'other',           label: '기타' },
];
const DISLIKE_REASONS = [
  { key: 'pronunciation',   label: '발음이 별로예요' },
  { key: 'rarity',          label: '너무 흔해요' },
  { key: 'vibe',            label: '너무 낯설어요' },
  { key: 'meaning',         label: '뜻이 마음에 안 들어요' },
  { key: 'surname_harmony', label: '성과 어울리지 않아요' },
  { key: 'other',           label: '기타' },
];

function ReasonPicker({ visible, name, type, onSubmit, onSkip }: {
  visible: boolean;
  name: string;
  type: 'liked' | 'disliked';
  onSubmit: (keys: string[]) => void;
  onSkip: () => void;
}) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [otherText, setOtherText] = React.useState('');
  const reasons = type === 'liked' ? LIKE_REASONS : DISLIKE_REASONS;
  const emoji = type === 'liked' ? '👍' : '👎';
  const otherSelected = selected.includes('other');

  function toggle(key: string) {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    if (key === 'other') setOtherText('');
  }

  function handleSubmit() {
    // "기타" 선택 시 텍스트가 있으면 'other:텍스트' 형태로 인코딩
    const keys = selected.map(k =>
      k === 'other' && otherText.trim() ? `other:${otherText.trim()}` : k
    );
    onSubmit(keys);
    setSelected([]);
    setOtherText('');
  }

  function handleSkip() {
    setSelected([]);
    setOtherText('');
    onSkip();
  }

  const canSubmit = selected.length > 0 && (!otherSelected || otherText.trim().length > 0 || selected.length > 1);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleSkip}>
      <Pressable style={fm.backdrop} onPress={handleSkip} />
      <View style={[fm.sheet, { maxHeight: '65%' }]}>
        <View style={fm.handle} />
        <View style={fm.header}>
          <Text style={fm.title}>{emoji} "{name}" 이름이 {type === 'liked' ? '좋은' : '별로인'} 이유가 있나요?</Text>
          <Pressable style={fm.closeBtn} onPress={handleSkip}>
            <Text style={fm.closeBtnText}>건너뛰기</Text>
          </Pressable>
        </View>
        <View style={s.choiceChips}>
          {reasons.map(r => (
            <Pressable
              key={r.key}
              style={[s.chip, selected.includes(r.key) && s.chipSelected]}
              onPress={() => toggle(r.key)}
            >
              <Text style={[s.chipText, selected.includes(r.key) && s.chipTextSelected]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {otherSelected && (
          <TextInput
            style={[fm.input, { marginHorizontal: 16, marginTop: 8 }]}
            placeholder="직접 입력해주세요"
            placeholderTextColor="#aaa"
            value={otherText}
            onChangeText={setOtherText}
            maxLength={100}
            returnKeyType="done"
          />
        )}
        <Pressable
          style={[fm.submitBtn, !canSubmit && fm.submitBtnOff]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={fm.submitText}>
            {selected.length === 0 ? '선택 후 전달하기' : `이유 전달하기 (${selected.length}개)`}
          </Text>
        </Pressable>
        <View style={{ height: 16 }} />
      </View>
    </Modal>
  );
}

// ── SessionRestoreModal ────────────────────────────────────────────────
function SessionRestoreModal({ visible, onClose, onRestore }: {
  visible: boolean;
  onClose: () => void;
  onRestore: (id: string) => void;
}) {
  const [inputId, setInputId] = useState('');

  function handleConfirm() {
    const trimmed = inputId.trim();
    if (!trimmed) return;
    onRestore(trimmed);
    setInputId('');
  }

  function handleClose() {
    setInputId('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={fm.backdrop} onPress={handleClose} />
      <View style={[fm.sheet, { maxHeight: '40%' }]}>
        <View style={fm.handle} />
        <View style={fm.header}>
          <Text style={fm.title}>세션 불러오기</Text>
          <Pressable style={fm.closeBtn} onPress={handleClose}>
            <Text style={fm.closeBtnText}>✕</Text>
          </Pressable>
        </View>
        <Text style={fm.subtitle}>이전 대화의 session_id를 입력하면 해당 세션을 이어서 진행합니다</Text>
        <View style={fm.field}>
          <TextInput
            style={fm.input}
            value={inputId}
            onChangeText={setInputId}
            placeholder="session_id를 붙여넣으세요"
            placeholderTextColor="#bbb"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />
        </View>
        <Pressable
          style={[fm.submitBtn, !inputId.trim() && fm.submitBtnOff]}
          onPress={handleConfirm}
          disabled={!inputId.trim()}
        >
          <Text style={fm.submitText}>불러오기 →</Text>
        </Pressable>
        <View style={{ height: 32 }} />
      </View>
    </Modal>
  );
}

// ── Main App ──────────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [formOpen, setFormOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState('welcome');
  const [likedNames, setLikedNames] = useState<string[]>([]);
  const [dislikedNames, setDislikedNames] = useState<string[]>([]);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [showLiked, setShowLiked] = useState(false);
  const [dolrimjaModalOpen, setDolrimjaModalOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [reasonPickerVisible, setReasonPickerVisible] = useState(false);
  const [reasonPickerContext, setReasonPickerContext] = useState<{ name: string; type: 'liked' | 'disliked' } | null>(null);
  const [reactionCount, setReactionCount] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  function callApiStream(
    body: object,
    onProgress: (msg: string) => void,
  ): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BACKEND_URL}/api/chat/stream`);
      xhr.setRequestHeader('Content-Type', 'application/json');

      let buffer = '';
      let lastIndex = 0;
      let finalResult: ApiResponse | null = null;

      xhr.onreadystatechange = () => {
        if (xhr.readyState >= 3 && xhr.responseText) {
          const newText = xhr.responseText.slice(lastIndex);
          lastIndex = xhr.responseText.length;
          buffer += newText;

          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'progress') onProgress(event.message);
              else if (event.type === 'result') {
                const { type: _, ...rest } = event;
                finalResult = rest as ApiResponse;
              } else if (event.type === 'error') reject(new Error(event.message));
            } catch { /* ignore malformed chunks */ }
          }
        }

        if (xhr.readyState === 4) {
          if (xhr.status !== 200) {
            reject(new Error(`Server error ${xhr.status}`));
          } else if (finalResult) {
            resolve(finalResult);
          } else {
            reject(new Error('No result received'));
          }
        }
      };

      xhr.send(JSON.stringify(body));
    });
  }

  async function handleFormSubmit(form: UserInfoForm) {
    const pad = (n: string) => n.padStart(2, '0');
    const birth_date = `${form.birth_year}-${pad(form.birth_month)}-${pad(form.birth_day)}`;
    const birth_time = form.birth_time_unknown
      ? null
      : (form.birth_hour ? `${pad(form.birth_hour)}:${pad(form.birth_minute || '00')}` : null);

    const user_info = {
      surname: form.surname!.hangul,
      surname_hanja: form.surname!.hanja,
      gender: form.gender,
      birth_date,
      birth_time,
      is_lunar: form.is_lunar,
      돌림자: form.dolrimja?.hangul ?? '',
      돌림자_한자: form.dolrimja?.hanja ?? '',
    };

    setLoading(true);
    try {
      const data = await callApiStream(
        { message: JSON.stringify(user_info), action: 'submit_info' },
        (msg) => setProgressMessage(msg),
      );

      setSessionId(data.session_id);
      setStage(data.stage);
      setLikedNames(data.liked_names);
      setDislikedNames(data.disliked_names);
      setPaymentRequired(data.payment_required);
      setFormSubmitted(true);
      setFormOpen(false);

      const lunarLabel = form.is_lunar ? ' (음력)' : ' (양력)';
      const timeLabel = birth_time ?? '시간 모름';
      const dolrimjaLabel = form.dolrimja ? ` | 돌림자: ${form.dolrimja.hanja}(${form.dolrimja.hangul})` : '';
      const summaryText =
        `${form.surname!.hanja}(${form.surname!.hangul}) | ${form.gender === '남' ? '아들 👦' : '딸 👧'} | ${birth_date}${lunarLabel} | ${timeLabel}${dolrimjaLabel}`;

      setMessages(prev => [
        ...prev,
        { id: 'form-user', role: 'user', content: [{ type: 'TEXT', data: { text: summaryText } }] },
        { id: 'form-ai', role: 'assistant', content: data.content, stage: data.stage, debug: data.debug },
      ]);
    } catch (e: unknown) {
      alert(`오류: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
      setProgressMessage(null);
    }
  }

  async function sendMessage(text: string) {
    if (!text || loading) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: [{ type: 'TEXT', data: { text } }],
    }]);
    setLoading(true);
    try {
      const data = await callApiStream(
        { message: text, session_id: sessionId },
        (msg) => setProgressMessage(msg),
      );
      setSessionId(data.session_id);
      setStage(data.stage);
      setLikedNames(data.liked_names);
      setDislikedNames(data.disliked_names);
      setPaymentRequired(data.payment_required);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        stage: data.stage,
        debug: data.debug,
      }]);
    } catch (e: unknown) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: [{ type: 'TEXT', data: { text: `오류: ${e instanceof Error ? e.message : String(e)}` } }],
      }]);
    } finally {
      setLoading(false);
      setProgressMessage(null);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    await sendMessage(text);
  }

  function shouldShowReasonPicker(count: number): boolean {
    if (count <= 5) return true;
    return count % 3 === 0;
  }

  function sendReasons(name: string, type: 'liked' | 'disliked', reasonKeys: string[]) {
    if (!sessionId || reasonKeys.length === 0) return;
    fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '',
        session_id: sessionId,
        reason_keys: reasonKeys,
        reason_for_name: name,
        reason_preference_type: type,
      }),
    }).catch(() => {});
  }

  async function handleLike(name: string) {
    const op = likedNames.includes(name) ? 'unlike' : 'like';
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '', session_id: sessionId, action: `${op}:${name}` }),
    });
    const data: ApiResponse = await res.json();
    setLikedNames(data.liked_names);
    setDislikedNames(data.disliked_names);
    if (op === 'like') {
      const newCount = reactionCount + 1;
      setReactionCount(newCount);
      if (shouldShowReasonPicker(newCount)) {
        setReasonPickerContext({ name, type: 'liked' });
        setReasonPickerVisible(true);
      }
    }
  }

  async function handleDislike(name: string) {
    const op = dislikedNames.includes(name) ? 'undislike' : 'dislike';
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '', session_id: sessionId, action: `${op}:${name}` }),
    });
    const data: ApiResponse = await res.json();
    setLikedNames(data.liked_names);
    setDislikedNames(data.disliked_names);
    if (op === 'dislike') {
      const newCount = reactionCount + 1;
      setReactionCount(newCount);
      if (shouldShowReasonPicker(newCount)) {
        setReasonPickerContext({ name, type: 'disliked' });
        setReasonPickerVisible(true);
      }
    }
  }

  async function handlePayment() {
    setLoading(true);
    try {
      const data = await callApiStream(
        { message: '결제 완료했습니다', session_id: sessionId, action: 'payment_complete' },
        (msg) => setProgressMessage(msg),
      );
      setStage(data.stage);
      setPaymentRequired(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        stage: data.stage,
        debug: data.debug,
      }]);
    } finally {
      setLoading(false);
      setProgressMessage(null);
    }
  }

  async function handleDolrimjaUpdate(selected: SelectedHanja) {
    setDolrimjaModalOpen(false);
    setLoading(true);
    // 유저 메시지 버블 표시
    const userText = `돌림자를 ${selected.hanja}(${selected.hangul})자로 변경할게요`;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: [{ type: 'TEXT', data: { text: userText } }],
    }]);
    try {
      const data = await callApiStream(
        { message: JSON.stringify(selected), session_id: sessionId, action: 'update_dolrimja' },
        (msg) => setProgressMessage(msg),
      );
      setStage(data.stage);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        stage: data.stage,
        debug: data.debug,
      }]);
    } catch (e: unknown) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: [{ type: 'TEXT', data: { text: `오류: ${e instanceof Error ? e.message : String(e)}` } }],
      }]);
    } finally {
      setLoading(false);
      setProgressMessage(null);
    }
  }

  function handleReset() {
    setMessages([WELCOME_MESSAGE]);
    setSessionId(null);
    setStage('welcome');
    setLikedNames([]);
    setDislikedNames([]);
    setPaymentRequired(false);
    setFormSubmitted(false);
    setInput('');
    setShowLiked(false);
    setReasonPickerVisible(false);
    setReasonPickerContext(null);
    setReactionCount(0);
  }

  async function handleSessionRestore(id: string) {
    setRestoreModalOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/session/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
      const data = await res.json();

      if (!data.found) {
        alert(`세션을 찾을 수 없어요.\n(session_id: ${id.slice(0, 8)}...)`);
        return;
      }

      // 상태 복원
      setSessionId(data.session_id);
      setStage(data.stage ?? 'welcome');
      setLikedNames(data.liked_names ?? []);
      setDislikedNames(data.disliked_names ?? []);
      setPaymentRequired(data.payment_required ?? false);

      // 복원된 메시지 이력 재구성
      if (data.messages && data.messages.length > 0) {
        const restored: ChatMessage[] = data.messages.map(
          (
            m: { role: string; content_blocks: ContentBlock[]; stage?: string },
            i: number
          ) => ({
            id: `restored-${i}`,
            role: m.role as 'user' | 'assistant',
            content: m.content_blocks,
            stage: m.stage,
          })
        );
        setMessages([WELCOME_MESSAGE, ...restored]);
      } else {
        // 저장된 메시지가 없으면 복원 요약 표시
        const userInfoText = data.user_info
          ? `${data.user_info.surname ?? ''} | ${data.user_info.gender ?? ''} | ${data.user_info.birth_date ?? ''}`
          : '';
        const directionText = data.naming_direction ? `\n작명 방향: ${data.naming_direction}` : '';
        const likedText = data.liked_names?.length > 0 ? `\n좋아요: ${data.liked_names.join(', ')}` : '';

        const restoreMsg =
          `세션을 불러왔어요 ✅\n` +
          `ID: ${id.slice(0, 8)}...\n` +
          `단계: ${stageLabel[data.stage] ?? data.stage}` +
          (userInfoText ? `\n아이 정보: ${userInfoText}` : '') +
          directionText +
          likedText;

        setMessages([
          WELCOME_MESSAGE,
          {
            id: 'restored',
            role: 'assistant',
            content: [{ type: 'TEXT', data: { text: restoreMsg } }],
            stage: data.stage,
          },
        ]);
      }

      setFormSubmitted(!['welcome', 'info_collection'].includes(data.stage ?? 'welcome'));
    } catch (e: unknown) {
      alert(`세션 불러오기 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>이름이 ✨</Text>
          <Text style={s.headerSub}>{stageLabel[stage] ?? stage}</Text>
        </View>
        <View style={s.headerRight}>
          <Pressable style={[s.headerBtn, showDebug && s.headerBtnOn]} onPress={() => setShowDebug(v => !v)}>
            <Text style={s.headerBtnText}>DEV</Text>
          </Pressable>
          {formSubmitted && (
            <Pressable style={[s.headerBtn, { marginLeft: 8 }]} onPress={() => setDolrimjaModalOpen(true)}>
              <Text style={s.headerBtnText}>돌림자 수정</Text>
            </Pressable>
          )}
          <Pressable style={[s.headerBtn, { marginLeft: 8 }]} onPress={() => setShowLiked(v => !v)}>
            <Text style={s.headerBtnText}>👍 {likedNames.length}</Text>
          </Pressable>
          <Pressable style={[s.headerBtn, { marginLeft: 8 }]} onPress={() => setRestoreModalOpen(true)}>
            <Text style={s.headerBtnText}>불러오기</Text>
          </Pressable>
          <Pressable style={[s.headerBtn, { marginLeft: 8 }]} onPress={handleReset}>
            <Text style={s.headerBtnText}>↺</Text>
          </Pressable>
        </View>
      </View>

      {/* Session ID chip — 세션이 있을 때만 표시 */}
      {sessionId && (
        <View style={s.sessionChip}>
          <Text style={s.sessionChipText} numberOfLines={1}>
            🔑 {sessionId}
          </Text>
        </View>
      )}

      {/* Liked panel */}
      {showLiked && (
        <View style={s.likedPanel}>
          <Text style={s.likedTitle}>👍 좋아요한 이름</Text>
          {likedNames.length === 0
            ? <Text style={s.likedEmpty}>아직 없어요</Text>
            : likedNames.map(n => <Text key={n} style={s.likedName}>{n}</Text>)}
          {dislikedNames.length > 0 && (
            <>
              <Text style={[s.likedTitle, { marginTop: 8 }]}>👎 별로인 이름</Text>
              {dislikedNames.map(n => <Text key={n} style={s.dislikedName}>{n}</Text>)}
            </>
          )}
        </View>
      )}

      {/* Chat */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          style={s.list}
          contentContainerStyle={s.listContent}
        >
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              liked={likedNames}
              disliked={dislikedNames}
              onLike={handleLike}
              onDislike={handleDislike}
              onOpenForm={() => setFormOpen(true)}
              formSubmitted={formSubmitted}
              showDebug={showDebug}
              onSend={sendMessage}
            />
          ))}
          {loading && (
            <View style={s.loadingRow}>
              <ActivityIndicator color={PURPLE} />
              <Text style={s.loadingText}>
                {progressMessage ?? '이름이가 생각 중...'}
              </Text>
            </View>
          )}
        </ScrollView>

        {paymentRequired && (
          <View style={s.payBanner}>
            <Text style={s.payText}>더 많은 이름을 탐색하려면 결제가 필요해요</Text>
            <Pressable style={s.payBtn} onPress={handlePayment}>
              <Text style={s.payBtnText}>결제하고 계속하기 →</Text>
            </Pressable>
          </View>
        )}

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor="#aaa"
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!loading && formSubmitted}
            multiline
          />
          <Pressable
            style={[s.sendBtn, (!input.trim() || loading || !formSubmitted) && s.sendBtnOff]}
            onPress={handleSend}
            disabled={!input.trim() || loading || !formSubmitted}
          >
            <Text style={s.sendBtnText}>전송</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Info Form Modal */}
      <InfoFormModal
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        loading={loading}
      />

      {/* Dolrimja Modal */}
      <DolrimjaModal
        visible={dolrimjaModalOpen}
        onClose={() => setDolrimjaModalOpen(false)}
        onSubmit={handleDolrimjaUpdate}
        loading={loading}
      />

      {/* Session Restore Modal */}
      <SessionRestoreModal
        visible={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        onRestore={handleSessionRestore}
      />

      {/* Reason Picker */}
      <ReasonPicker
        visible={reasonPickerVisible}
        name={reasonPickerContext?.name ?? ''}
        type={reasonPickerContext?.type ?? 'liked'}
        onSubmit={(keys) => {
          setReasonPickerVisible(false);
          if (reasonPickerContext) {
            sendReasons(reasonPickerContext.name, reasonPickerContext.type, keys);
          }
        }}
        onSkip={() => setReasonPickerVisible(false)}
      />
    </View>
  );
}

// ── Form Modal Styles ──────────────────────────────────────────────────
const fm = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  closeBtn: { padding: 6 },
  closeBtnText: { fontSize: 18, color: '#999' },
  subtitle: { fontSize: 13, color: '#888', lineHeight: 18, marginBottom: 20 },

  row: { flexDirection: 'row', marginBottom: 0 },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  req: { color: '#e74c3c' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },

  input: {
    borderWidth: 1.5,
    borderColor: '#e0dbff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fafafa',
  },
  inputErr: { borderColor: '#e74c3c' },
  errText: { color: '#e74c3c', fontSize: 11, marginTop: 3 },

  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e0dbff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  genderBtnOn: { borderColor: PURPLE, backgroundColor: '#f0eeff' },
  genderText: { fontSize: 13, color: '#888' },
  genderTextOn: { color: PURPLE, fontWeight: '700' },

  lunarRow: { flexDirection: 'row', gap: 4 },
  lunarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  lunarBtnOn: { borderColor: PURPLE, backgroundColor: '#f0eeff' },
  lunarText: { fontSize: 12, color: '#888' },
  lunarTextOn: { color: PURPLE, fontWeight: '700' },

  dateRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  sep: { color: '#666', fontSize: 15, paddingTop: 11 },

  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 2, borderColor: '#ccc',
    marginRight: 8, alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { borderColor: PURPLE, backgroundColor: PURPLE },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  checkLabel: { fontSize: 14, color: '#666' },

  submitBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnOff: { backgroundColor: '#ccc' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  optional: { color: '#aaa', fontWeight: '400' },

  // ── Hanja search (공통) ──
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchResults: {
    borderWidth: 1.5, borderColor: '#e0dbff',
    borderRadius: 10, marginTop: 4,
    backgroundColor: CARD_BG, overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, gap: 10,
  },
  searchResultBorder: { borderBottomWidth: 1, borderBottomColor: '#f0eeff' },
  searchResultHanja: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', width: 34, textAlign: 'center' },
  searchResultEum: { fontSize: 15, fontWeight: '600', color: PURPLE, width: 44 },
  searchResultMean: { fontSize: 12, color: '#888', flex: 1 },
  searchResultStroke: { fontSize: 11, color: '#bbb' },
  searchNoResult: { fontSize: 13, color: '#aaa', marginTop: 6, paddingLeft: 4 },

  hanjaChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: PURPLE, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f0eeff',
  },
  hanjaChipInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hanjaChipChar: { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
  hanjaChipHangul: { fontSize: 16, fontWeight: '700', color: PURPLE },
  hanjaChipMean: { fontSize: 12, color: '#888', maxWidth: 180 },
  hanjaChipClearBtn: {
    backgroundColor: 'rgba(108,99,255,0.12)',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5,
  },
  hanjaChipClearText: { fontSize: 13, color: PURPLE, fontWeight: '600' },
});

// ── Debug styles ────────────────────────────────────────────────────────
const db = StyleSheet.create({
  wrap: {
    width: '100%',
    marginBottom: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  toggle: {
    backgroundColor: '#1e1e2e',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  toggleText: { color: '#7c7cff', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
  scroll: {
    backgroundColor: '#12121f',
    maxHeight: 500,
    padding: 10,
  },
  sectionLabel: {
    color: '#555',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  code: {
    color: '#a8ff78',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 17,
  },
});

// ── Chat Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    backgroundColor: PURPLE,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  headerBtnOn: { backgroundColor: 'rgba(255,220,50,0.35)' },
  headerBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  likedPanel: {
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e4ff',
    padding: 12, paddingHorizontal: 16,
  },
  likedTitle: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 4 },
  likedEmpty: { color: '#aaa', fontSize: 13 },
  likedName: { color: PURPLE, fontSize: 14, fontWeight: '600', paddingVertical: 2 },
  dislikedName: { color: '#e74c3c', fontSize: 14, paddingVertical: 2 },

  list: { flex: 1 },
  listContent: { padding: 14, paddingBottom: 8 },

  userWrap: { alignItems: 'flex-end', marginBottom: 8 },
  userBubble: {
    backgroundColor: PURPLE,
    borderRadius: 18, borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    maxWidth: '78%',
  },
  userText: { color: '#fff', fontSize: 15, lineHeight: 21 },

  aiWrap: { alignItems: 'flex-start', marginBottom: 12, maxWidth: '92%' },
  aiBubble: {
    backgroundColor: CARD_BG,
    borderRadius: 18, borderTopLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  aiText: { color: '#222', fontSize: 15, lineHeight: 23 },

  stagePill: {
    backgroundColor: '#e8e4ff',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4,
  },
  stagePillText: { fontSize: 11, color: PURPLE, fontWeight: '600' },

  formOpenBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  formOpenBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── ChoiceGroup ───────────────────────────────────────────────────────
  choiceGroup: {
    backgroundColor: '#f3f0ff',
    borderRadius: 14, padding: 14, marginBottom: 8, width: '100%',
    borderWidth: 1, borderColor: '#d8d0f5',
  },
  choiceGroupDone: { opacity: 0.6 },
  choiceQuestion: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  choiceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#d0c8f0',
  },
  chipSelected: { backgroundColor: PURPLE, borderColor: PURPLE },
  chipDisabled: { opacity: 0.5 },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  chipCustomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, width: '100%' },
  chipCustomInput: {
    flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, backgroundColor: '#fff',
  },
  followUpRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  followUpInput: {
    flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, backgroundColor: '#fff',
  },
  followUpBtn: {
    backgroundColor: PURPLE, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  followUpBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  multiSubmitBtn: {
    marginTop: 12, backgroundColor: PURPLE, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10, alignSelf: 'flex-end',
  },
  multiSubmitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  choiceDoneText: { fontSize: 12, color: '#888', marginTop: 8, fontStyle: 'italic' },

  nameCard: {
    backgroundColor: CARD_BG, borderRadius: 14, padding: 14, marginBottom: 8,
    width: '100%', borderLeftWidth: 3, borderLeftColor: PURPLE,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  nameHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 },
  nameText: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginRight: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  syllableRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  syllable: { alignItems: 'center', flex: 1, backgroundColor: '#f8f7ff', borderRadius: 8, padding: 8 },
  sylHanja: { fontSize: 20, fontWeight: '700', color: '#333' },
  sylHangul: { fontSize: 13, color: '#888', marginTop: 2 },
  ohaengPill: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 },
  ohaengText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sylMeaning: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 3 },
  nameReason: { fontSize: 13, color: '#555', fontStyle: 'italic', marginBottom: 8 },

  scoreBreakdown: { marginBottom: 10, gap: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreLabel: { fontSize: 11, color: '#888', width: 48 },
  scoreBarBg: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: 6, backgroundColor: PURPLE, borderRadius: 3 },
  scoreValue: { fontSize: 11, color: '#888', width: 32, textAlign: 'right' },

  hanjaOptionsSection: { marginBottom: 8, gap: 6 },
  hanjaOptionsRow: { gap: 4 },
  hanjaOptionsLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
  hanjaOptionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hanjaOptionItem: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f5f5f5', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  hanjaOptionChar: { fontSize: 14, color: '#333', fontWeight: '700' },
  hanjaOptionMeaning: { fontSize: 11, color: '#666' },

  reactionRow: { flexDirection: 'row', gap: 8 },
  reactionBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#ddd',
    borderRadius: 8, paddingVertical: 8, alignItems: 'center',
  },
  reactionLiked: { borderColor: '#2ecc71', backgroundColor: '#f0fdf4' },
  reactionDisliked: { borderColor: '#e74c3c', backgroundColor: '#fef2f2' },
  reactionText: { fontSize: 14, color: '#888' },
  reactionTextActive: { color: '#333', fontWeight: '600' },

  loadingRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  loadingText: { color: '#888', fontSize: 14 },

  payBanner: {
    backgroundColor: '#fff8e1', borderTopWidth: 1, borderTopColor: '#ffe082',
    padding: 14, alignItems: 'center', gap: 8,
  },
  payText: { color: '#795548', fontSize: 14 },
  payBtn: { backgroundColor: '#f59e0b', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  inputRow: {
    flexDirection: 'row', padding: 10, backgroundColor: CARD_BG,
    borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'flex-end', gap: 8,
  },
  input: {
    flex: 1, backgroundColor: BG, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: '#222', maxHeight: 100,
    borderWidth: 1, borderColor: '#e0dbff',
  },
  sendBtn: { backgroundColor: PURPLE, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  sendBtnOff: { backgroundColor: '#ccc' },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  sessionChip: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sessionChipText: {
    color: '#7c7cff',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
