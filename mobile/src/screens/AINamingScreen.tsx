import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { colors, ohaengColors } from '@/design-system';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BACKEND_URL } from '../../constants/config';
import { RootStackParamList } from '../navigation/types';

type AINamingNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'AINaming'
>;

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
  | { type: 'FORM_BUTTON' }; // 정보 입력 버튼 블록 (로컬 전용)

interface HanjaOption {
  한자: string;
  meaning: string;
  오행: string;
  stroke_count: number;
}

interface NameData {
  한글: string;
  full_name: string;
  syllables: {
    한글: string;
    한자: string;
    meaning: string;
    오행: string;
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
  大吉: colors.positive,
  吉: colors.positive,
  平: colors.fillAccent,
  凶: colors.negative,
  大凶: colors.negative,
};
const rarityColor: Record<string, string> = {
  희귀: colors.positive,
  보통: colors.textSecondary,
  흔한: colors.textDisabled,
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

const PURPLE = colors.negative;
const BG = colors.bg;
const CARD_BG = colors.surfaceRaised;

// ── HanjaSearchField (공통) ────────────────────────────────────────────
function HanjaSearchField({
  selected,
  onSelect,
  onClear,
  error,
  endpoint,
  placeholder,
  chipSuffix = '',
}: {
  selected: SelectedHanja | null;
  onSelect: (s: SelectedHanja) => void;
  onClear: () => void;
  error?: string;
  endpoint: string; // "/api/surname-search" | "/api/hanja-search"
  placeholder: string;
  chipSuffix?: string; // 성씨: "씨", 돌림자: "자"
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HanjaResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${BACKEND_URL}${endpoint}?q=${encodeURIComponent(q)}`,
        );
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
      <View className={fm.hanjaChip}>
        <View className={fm.hanjaChipInner}>
          <Text className={fm.hanjaChipChar}>{selected.hanja}</Text>
          <View>
            <Text className={fm.hanjaChipHangul}>
              {selected.hangul}
              {chipSuffix}
            </Text>
            <Text className={fm.hanjaChipMean} numberOfLines={1}>
              {selected.mean}
            </Text>
          </View>
        </View>
        <Pressable onPress={onClear} className={fm.hanjaChipClearBtn}>
          <Text className={fm.hanjaChipClearText}>변경</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View className={fm.searchRow}>
        <TextInput
          className={clsx(fm.input, error && fm.inputErr)}
          style={{ flex: 1 }}
          value={query}
          onChangeText={search}
          placeholder={placeholder}
          placeholderTextColor="#bbb"
          maxLength={4}
        />
        {searching && (
          <ActivityIndicator
            style={{ marginLeft: 8 }}
            color={PURPLE}
            size="small"
          />
        )}
      </View>
      {error && !query ? <Text className={fm.errText}>{error}</Text> : null}
      {results.length > 0 && (
        <View className={fm.searchResults}>
          {results.map((r, i) => (
            <Pressable
              key={i}
              className={clsx(
                fm.searchResultItem,
                i < results.length - 1 && fm.searchResultBorder,
              )}
              onPress={() => pick(r)}
            >
              <Text className={fm.searchResultHanja}>{r.hanja}</Text>
              <Text className={fm.searchResultEum}>
                {r.eum}
                {chipSuffix}
              </Text>
              <Text className={fm.searchResultMean} numberOfLines={1}>
                {r.mean}
              </Text>
              {r.stroke != null && (
                <Text className={fm.searchResultStroke}>{r.stroke}획</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
      {query.trim() && !searching && results.length === 0 && (
        <Text className={fm.searchNoResult}>검색 결과가 없어요</Text>
      )}
    </View>
  );
}

// ── DolrimjaModal (채팅 중 돌림자 수정) ───────────────────────────────
function DolrimjaModal({
  visible,
  onClose,
  onSubmit,
  loading,
}: {
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable className={fm.backdrop} onPress={handleClose} />
      <View className={fm.sheet} style={{ maxHeight: '60%' }}>
        <View className={fm.handle} />
        <View className={fm.header}>
          <Text className={fm.title}>돌림자 변경</Text>
          <Pressable className={fm.closeBtn} onPress={handleClose}>
            <Text className={fm.closeBtnText}>✕</Text>
          </Pressable>
        </View>
        <Text className={fm.subtitle}>
          새로운 돌림자를 검색해서 선택해주세요
        </Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className={fm.field}>
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
            className={clsx(
              fm.submitBtn,
              (!selected || loading) && fm.submitBtnOff,
            )}
            onPress={() => selected && onSubmit(selected)}
            disabled={!selected || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={fm.submitText}>돌림자 변경하기</Text>
            )}
          </Pressable>
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── InfoForm Modal ─────────────────────────────────────────────────────
function InfoFormModal({
  visible,
  onClose,
  onSubmit,
  loading,
}: {
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
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
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
    if (!form.birth_day || isNaN(d) || d < 1 || d > 31) errs.birth_day = '1-31';
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

  const canSubmit = !!(
    form.surname?.hangul &&
    form.birth_year &&
    form.birth_month &&
    form.birth_day
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable className={fm.backdrop} onPress={onClose} />
      <View className={fm.sheet}>
        <View className={fm.handle} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className={fm.header}>
            <Text className={fm.title}>아이 정보 입력</Text>
            <Pressable className={fm.closeBtn} onPress={onClose}>
              <Text className={fm.closeBtnText}>✕</Text>
            </Pressable>
          </View>
          <Text className={fm.subtitle}>
            정확한 정보를 입력하면 더 잘 어울리는 이름을 추천해드릴 수 있어요
          </Text>

          {/* 성씨 */}
          <View className={fm.field}>
            <Text className={fm.label}>
              성씨 <Text className={fm.req}>*</Text>
            </Text>
            <HanjaSearchField
              selected={form.surname}
              onSelect={(s) => set('surname', s)}
              onClear={() => set('surname', null)}
              endpoint="/api/surname-search"
              placeholder="성씨 검색 (예: 김, 이, 박)"
              chipSuffix="씨"
              error={errors.surname}
            />
          </View>

          {/* 성별 */}
          <View className={fm.field}>
            <Text className={fm.label}>
              성별 <Text className={fm.req}>*</Text>
            </Text>
            <View className={fm.genderRow}>
              {(['남', '여'] as const).map((g) => (
                <Pressable
                  key={g}
                  className={clsx(
                    fm.genderBtn,
                    form.gender === g && fm.genderBtnOn,
                  )}
                  onPress={() => set('gender', g)}
                >
                  <Text
                    className={clsx(
                      fm.genderText,
                      form.gender === g && fm.genderTextOn,
                    )}
                  >
                    {g === '남' ? '👦 아들' : '👧 딸'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 생년월일 */}
          <View className={fm.field}>
            <View className={fm.labelRow}>
              <Text className={fm.label}>
                생년월일 <Text className={fm.req}>*</Text>
              </Text>
              <View className={fm.lunarRow}>
                {([false, true] as const).map((lunar) => (
                  <Pressable
                    key={String(lunar)}
                    className={clsx(
                      fm.lunarBtn,
                      form.is_lunar === lunar && fm.lunarBtnOn,
                    )}
                    onPress={() => set('is_lunar', lunar)}
                  >
                    <Text
                      className={clsx(
                        fm.lunarText,
                        form.is_lunar === lunar && fm.lunarTextOn,
                      )}
                    >
                      {lunar ? '음력' : '양력'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View className={fm.dateRow}>
              <View style={{ flex: 2.2 }}>
                <TextInput
                  className={clsx(fm.input, errors.birth_year && fm.inputErr)}
                  value={form.birth_year}
                  onChangeText={(v) => set('birth_year', v.replace(/\D/g, ''))}
                  placeholder="년도"
                  placeholderTextColor="#bbb"
                  keyboardType="numeric"
                  maxLength={4}
                />
                {errors.birth_year ? (
                  <Text className={fm.errText}>{errors.birth_year}</Text>
                ) : null}
              </View>
              <Text className={fm.sep}>년</Text>
              <View style={{ flex: 1 }}>
                <TextInput
                  className={clsx(fm.input, errors.birth_month && fm.inputErr)}
                  value={form.birth_month}
                  onChangeText={(v) => set('birth_month', v.replace(/\D/g, ''))}
                  placeholder="월"
                  placeholderTextColor="#bbb"
                  keyboardType="numeric"
                  maxLength={2}
                />
                {errors.birth_month ? (
                  <Text className={fm.errText}>{errors.birth_month}</Text>
                ) : null}
              </View>
              <Text className={fm.sep}>월</Text>
              <View style={{ flex: 1 }}>
                <TextInput
                  className={clsx(fm.input, errors.birth_day && fm.inputErr)}
                  value={form.birth_day}
                  onChangeText={(v) => set('birth_day', v.replace(/\D/g, ''))}
                  placeholder="일"
                  placeholderTextColor="#bbb"
                  keyboardType="numeric"
                  maxLength={2}
                />
                {errors.birth_day ? (
                  <Text className={fm.errText}>{errors.birth_day}</Text>
                ) : null}
              </View>
              <Text className={fm.sep}>일</Text>
            </View>
          </View>

          {/* 돌림자 (선택) */}
          <View className={fm.field}>
            <Text className={fm.label}>
              돌림자 <Text className={fm.optional}>(선택)</Text>
            </Text>
            <HanjaSearchField
              selected={form.dolrimja}
              onSelect={(s) => set('dolrimja', s)}
              onClear={() => set('dolrimja', null)}
              endpoint="/api/hanja-search"
              placeholder="돌림자 검색 (예: 준, 현, 민)"
              chipSuffix="자"
            />
          </View>

          {/* 출생시간 */}
          <View className={fm.field}>
            <Text className={fm.label}>출생시간</Text>
            <Pressable
              className={fm.checkRow}
              onPress={() =>
                set('birth_time_unknown', !form.birth_time_unknown)
              }
            >
              <View
                className={clsx(
                  fm.checkbox,
                  form.birth_time_unknown && fm.checkboxOn,
                )}
              >
                {form.birth_time_unknown && (
                  <Text className={fm.checkMark}>✓</Text>
                )}
              </View>
              <Text className={fm.checkLabel}>시간을 모릅니다</Text>
            </Pressable>
            {!form.birth_time_unknown && (
              <View className={fm.dateRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    className={clsx(fm.input, errors.birth_hour && fm.inputErr)}
                    value={form.birth_hour}
                    onChangeText={(v) =>
                      set('birth_hour', v.replace(/\D/g, ''))
                    }
                    placeholder="시"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  {errors.birth_hour ? (
                    <Text className={fm.errText}>{errors.birth_hour}</Text>
                  ) : null}
                </View>
                <Text className={fm.sep}>시</Text>
                <View style={{ flex: 1 }}>
                  <TextInput
                    className={clsx(
                      fm.input,
                      errors.birth_minute && fm.inputErr,
                    )}
                    value={form.birth_minute}
                    onChangeText={(v) =>
                      set('birth_minute', v.replace(/\D/g, ''))
                    }
                    placeholder="분"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  {errors.birth_minute ? (
                    <Text className={fm.errText}>{errors.birth_minute}</Text>
                  ) : null}
                </View>
                <Text className={fm.sep}>분</Text>
                <View style={{ flex: 1 }} />
              </View>
            )}
          </View>

          <Pressable
            className={clsx(
              fm.submitBtn,
              (!canSubmit || loading) && fm.submitBtnOff,
            )}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={fm.submitText}>이름 찾기 시작 →</Text>
            )}
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
    <View className={db.wrap}>
      <Pressable className={db.toggle} onPress={() => setOpen((v) => !v)}>
        <Text className={db.toggleText}>{open ? '▾' : '▸'} DEBUG</Text>
      </Pressable>
      {open && (
        <ScrollView className={db.scroll} nestedScrollEnabled>
          <ScrollView horizontal nestedScrollEnabled>
            <View>
              {debug.raw_llm_output != null && (
                <>
                  <Text className={db.sectionLabel}>── raw LLM output ──</Text>
                  <Text className={db.code}>{debug.raw_llm_output}</Text>
                </>
              )}
              {debug.state != null && (
                <>
                  <Text className={db.sectionLabel} style={{ marginTop: 10 }}>
                    ── state snapshot ──
                  </Text>
                  <Text className={db.code}>
                    {JSON.stringify(debug.state, null, 2)}
                  </Text>
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
function NameCard({
  data,
  liked,
  disliked,
  onLike,
  onDislike,
}: {
  data: NameData;
  liked: boolean;
  disliked: boolean;
  onLike: () => void;
  onDislike: () => void;
}) {
  const harmony = data.발음오행_조화 ?? '반길';
  return (
    <View className={s.nameCard}>
      <View className={s.nameHeader}>
        <Text className={s.nameText}>{data.full_name}</Text>
        <View
          className={s.badge}
          style={{ backgroundColor: harmonyColor[harmony] ?? '#95a1a8' }}
        >
          <Text className={s.badgeText}>{harmony}</Text>
        </View>
        <View
          className={s.badge}
          style={{
            backgroundColor: rarityColor[data.rarity_signal] ?? '#3498db',
          }}
        >
          <Text className={s.badgeText}>{data.rarity_signal}</Text>
        </View>
      </View>
      <View className={s.syllableRow}>
        {data.syllables.map((syl, i) => (
          <View key={i} className={s.syllable}>
            <Text className={s.sylHanja}>{syl.한자 || syl.한글}</Text>
            <Text className={s.sylHangul}>{syl.한글}</Text>
            {syl.오행 ? (
              <View
                className={s.ohaengPill}
                style={{
                  backgroundColor:
                    ohaengColors[syl.오행]?.base ?? colors.textDisabled,
                }}
              >
                <Text className={s.ohaengText}>{syl.오행}</Text>
              </View>
            ) : null}
            <Text className={s.sylMeaning} numberOfLines={2}>
              {syl.meaning}
            </Text>
          </View>
        ))}
      </View>
      {data.reason ? <Text className={s.nameReason}>{data.reason}</Text> : null}
      {data.score_breakdown && Object.keys(data.score_breakdown).length > 0 ? (
        <View className={s.scoreBreakdown}>
          {(Object.entries(data.score_breakdown) as [string, number][]).map(
            ([key, val]) => (
              <View key={key} className={s.scoreRow}>
                <Text className={s.scoreLabel}>{key}</Text>
                <View className={s.scoreBarBg}>
                  <View
                    className={s.scoreBarFill}
                    style={{ width: `${Math.round(val * 100)}%` }}
                  />
                </View>
                <Text className={s.scoreValue}>{Math.round(val * 100)}%</Text>
              </View>
            ),
          )}
        </View>
      ) : null}
      {data.syllables.some(
        (syl) => syl.hanja_options && syl.hanja_options.length > 0,
      ) ? (
        <View className={s.hanjaOptionsSection}>
          {data.syllables.map((syl, i) =>
            syl.hanja_options && syl.hanja_options.length > 0 ? (
              <View key={i} className={s.hanjaOptionsRow}>
                <Text className={s.hanjaOptionsLabel}>
                  {syl.한글} 한자 선택:
                </Text>
                <View className={s.hanjaOptionsList}>
                  {syl.hanja_options.map((opt, j) => (
                    <View key={j} className={s.hanjaOptionItem}>
                      <Text className={s.hanjaOptionChar}>{opt.한자}</Text>
                      <Text className={s.hanjaOptionMeaning}>
                        {opt.meaning}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null,
          )}
        </View>
      ) : null}
      <View className={s.reactionRow}>
        <Pressable
          className={clsx(s.reactionBtn, liked && s.reactionLiked)}
          onPress={onLike}
        >
          <Text className={clsx(s.reactionText, liked && s.reactionTextActive)}>
            👍 좋아요
          </Text>
        </Pressable>
        <Pressable
          className={clsx(s.reactionBtn, disliked && s.reactionDisliked)}
          onPress={onDislike}
        >
          <Text
            className={clsx(s.reactionText, disliked && s.reactionTextActive)}
          >
            👎 별로
          </Text>
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
      return (
        <Text key={i} style={[baseStyle, { fontWeight: 'bold' }]}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return (
      <Text key={i} style={baseStyle}>
        {part}
      </Text>
    );
  });
}

function SimpleMarkdown({
  text,
  baseStyle,
}: {
  text: string;
  baseStyle: object;
}) {
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <Text
              key={i}
              style={[
                baseStyle,
                { fontWeight: 'bold', marginTop: 8, marginBottom: 2 },
              ]}
            >
              {line.slice(4)}
            </Text>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <Text key={i} style={[baseStyle, { paddingLeft: 8 }]}>
              {'• '}
              {renderInlineBold(line.slice(2), baseStyle)}
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
function ChoiceGroupBlock({
  data,
  onSend,
  submitted,
}: {
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
      setSelected((prev) => {
        if (prev.includes(choice)) return prev.filter((c) => c !== choice);
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
    <View className={clsx(s.choiceGroup, done && s.choiceGroupDone)}>
      <Text className={s.choiceQuestion}>{data.question}</Text>
      <View className={s.choiceChips}>
        {data.choices.map((choice) => (
          <Pressable
            key={choice}
            className={clsx(
              s.chip,
              selected.includes(choice) && s.chipSelected,
              done && s.chipDisabled,
            )}
            onPress={() => toggleChoice(choice)}
          >
            <Text
              className={clsx(
                s.chipText,
                selected.includes(choice) && s.chipTextSelected,
              )}
            >
              {choice}
            </Text>
          </Pressable>
        ))}
        {data.allow_custom && !done && (
          <View className={s.chipCustomRow}>
            <TextInput
              className={s.chipCustomInput}
              value={customText}
              onChangeText={(text) => {
                setCustomText(text);
                if (text.trim()) setSelected([]);
              }}
              placeholder="직접 입력"
              placeholderTextColor="#aaa"
            />
          </View>
        )}
      </View>
      {showFollowUp && !done && data.follow_up && (
        <View className={s.followUpRow}>
          <TextInput
            className={s.followUpInput}
            value={followUpText}
            onChangeText={setFollowUpText}
            placeholder={data.follow_up.placeholder}
            placeholderTextColor="#aaa"
            autoFocus
          />
          <Pressable className={s.followUpBtn} onPress={submitFollowUp}>
            <Text className={s.followUpBtnText}>완료</Text>
          </Pressable>
        </View>
      )}
      {data.multi && !done && (
        <Pressable className={s.multiSubmitBtn} onPress={submitMulti}>
          <Text className={s.multiSubmitBtnText}>선택 완료</Text>
        </Pressable>
      )}
      {done && selected.length > 0 && (
        <Text className={s.choiceDoneText}>선택: {selected.join(', ')}</Text>
      )}
    </View>
  );
}

// ── MessageBubble ──────────────────────────────────────────────────────
function MessageBubble({
  msg,
  liked,
  disliked,
  onLike,
  onDislike,
  onOpenForm,
  formSubmitted,
  showDebug,
  onSend,
}: {
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
      .filter((b) => b.type === 'TEXT')
      .map((b) => (b as { type: 'TEXT'; data: { text: string } }).data.text)
      .join('');
    return (
      <View className={s.userWrap}>
        <View className={s.userBubble}>
          <Text className={s.userText}>{text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={s.aiWrap}>
      {msg.stage ? (
        <View className={s.stagePill}>
          <Text className={s.stagePillText}>
            {stageLabel[msg.stage] ?? msg.stage}
          </Text>
        </View>
      ) : null}
      {showDebug && <DebugPanel debug={msg.debug} />}
      {msg.content.map((block, i) => {
        if (block.type === 'TEXT') {
          return (
            <View key={i} className={s.aiBubble}>
              <SimpleMarkdown
                text={block.data.text}
                baseStyle={{
                  fontFamily: 'NotoSansKR_400Regular',
                  color: colors.textPrimary,
                  fontSize: 15,
                  lineHeight: 23,
                }}
              />
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
            <Pressable key={i} className={s.formOpenBtn} onPress={onOpenForm}>
              <Text className={s.formOpenBtnText}>📋 정보 입력하기</Text>
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
  { key: 'pronunciation', label: '발음이 좋아요' },
  { key: 'vibe', label: '분위기가 좋아요' },
  { key: 'meaning', label: '뜻이 좋아요' },
  { key: 'surname_harmony', label: '성과 잘 어울려요' },
  { key: 'rarity', label: '너무 흔하지 않아요' },
  { key: 'other', label: '기타' },
];
const DISLIKE_REASONS = [
  { key: 'pronunciation', label: '발음이 별로예요' },
  { key: 'rarity', label: '너무 흔해요' },
  { key: 'vibe', label: '너무 낯설어요' },
  { key: 'meaning', label: '뜻이 마음에 안 들어요' },
  { key: 'surname_harmony', label: '성과 어울리지 않아요' },
  { key: 'other', label: '기타' },
];

function ReasonPicker({
  visible,
  name,
  type,
  onSubmit,
  onSkip,
}: {
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
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
    if (key === 'other') setOtherText('');
  }

  function handleSubmit() {
    // "기타" 선택 시 텍스트가 있으면 'other:텍스트' 형태로 인코딩
    const keys = selected.map((k) =>
      k === 'other' && otherText.trim() ? `other:${otherText.trim()}` : k,
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

  const canSubmit =
    selected.length > 0 &&
    (!otherSelected || otherText.trim().length > 0 || selected.length > 1);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleSkip}
    >
      <Pressable className={fm.backdrop} onPress={handleSkip} />
      <View className={fm.sheet} style={{ maxHeight: '65%' }}>
        <View className={fm.handle} />
        <View className={fm.header}>
          <Text className={fm.title}>
            {emoji} "{name}" 이름이 {type === 'liked' ? '좋은' : '별로인'}{' '}
            이유가 있나요?
          </Text>
          <Pressable className={fm.closeBtn} onPress={handleSkip}>
            <Text className={fm.closeBtnText}>건너뛰기</Text>
          </Pressable>
        </View>
        <View className={s.choiceChips}>
          {reasons.map((r) => (
            <Pressable
              key={r.key}
              className={clsx(
                s.chip,
                selected.includes(r.key) && s.chipSelected,
              )}
              onPress={() => toggle(r.key)}
            >
              <Text
                className={clsx(
                  s.chipText,
                  selected.includes(r.key) && s.chipTextSelected,
                )}
              >
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {otherSelected && (
          <TextInput
            className={fm.input}
            style={{ marginHorizontal: 16, marginTop: 8 }}
            placeholder="직접 입력해주세요"
            placeholderTextColor="#aaa"
            value={otherText}
            onChangeText={setOtherText}
            maxLength={100}
            returnKeyType="done"
          />
        )}
        <Pressable
          className={clsx(fm.submitBtn, !canSubmit && fm.submitBtnOff)}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text className={fm.submitText}>
            {selected.length === 0
              ? '선택 후 전달하기'
              : `이유 전달하기 (${selected.length}개)`}
          </Text>
        </Pressable>
        <View style={{ height: 16 }} />
      </View>
    </Modal>
  );
}

// ── SessionRestoreModal ────────────────────────────────────────────────
function SessionRestoreModal({
  visible,
  onClose,
  onRestore,
}: {
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable className={fm.backdrop} onPress={handleClose} />
      <View className={fm.sheet} style={{ maxHeight: '40%' }}>
        <View className={fm.handle} />
        <View className={fm.header}>
          <Text className={fm.title}>세션 불러오기</Text>
          <Pressable className={fm.closeBtn} onPress={handleClose}>
            <Text className={fm.closeBtnText}>✕</Text>
          </Pressable>
        </View>
        <Text className={fm.subtitle}>
          이전 대화의 session_id를 입력하면 해당 세션을 이어서 진행합니다
        </Text>
        <View className={fm.field}>
          <TextInput
            className={fm.input}
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
          className={clsx(fm.submitBtn, !inputId.trim() && fm.submitBtnOff)}
          onPress={handleConfirm}
          disabled={!inputId.trim()}
        >
          <Text className={fm.submitText}>불러오기 →</Text>
        </Pressable>
        <View style={{ height: 32 }} />
      </View>
    </Modal>
  );
}

// ── Main AINamingScreen ──────────────────────────────────────────────────────
export default function AINamingScreen() {
  const navigation = useNavigation<AINamingNavProp>();
  const insets = useSafeAreaInsets();
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
  const [reasonPickerContext, setReasonPickerContext] = useState<{
    name: string;
    type: 'liked' | 'disliked';
  } | null>(null);
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
              } else if (event.type === 'error')
                reject(new Error(event.message));
            } catch {
              /* ignore malformed chunks */
            }
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
      : form.birth_hour
        ? `${pad(form.birth_hour)}:${pad(form.birth_minute || '00')}`
        : null;

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
      const dolrimjaLabel = form.dolrimja
        ? ` | 돌림자: ${form.dolrimja.hanja}(${form.dolrimja.hangul})`
        : '';
      const summaryText = `${form.surname!.hanja}(${form.surname!.hangul}) | ${form.gender === '남' ? '아들 👦' : '딸 👧'} | ${birth_date}${lunarLabel} | ${timeLabel}${dolrimjaLabel}`;

      setMessages((prev) => [
        ...prev,
        {
          id: 'form-user',
          role: 'user',
          content: [{ type: 'TEXT', data: { text: summaryText } }],
        },
        {
          id: 'form-ai',
          role: 'assistant',
          content: data.content,
          stage: data.stage,
          debug: data.debug,
        },
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
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: [{ type: 'TEXT', data: { text } }],
      },
    ]);
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
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.content,
          stage: data.stage,
          debug: data.debug,
        },
      ]);
    } catch (e: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: [
            {
              type: 'TEXT',
              data: {
                text: `오류: ${e instanceof Error ? e.message : String(e)}`,
              },
            },
          ],
        },
      ]);
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

  function sendReasons(
    name: string,
    type: 'liked' | 'disliked',
    reasonKeys: string[],
  ) {
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
      body: JSON.stringify({
        message: '',
        session_id: sessionId,
        action: `${op}:${name}`,
      }),
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
      body: JSON.stringify({
        message: '',
        session_id: sessionId,
        action: `${op}:${name}`,
      }),
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
        {
          message: '결제 완료했습니다',
          session_id: sessionId,
          action: 'payment_complete',
        },
        (msg) => setProgressMessage(msg),
      );
      setStage(data.stage);
      setPaymentRequired(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.content,
          stage: data.stage,
          debug: data.debug,
        },
      ]);
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
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: [{ type: 'TEXT', data: { text: userText } }],
      },
    ]);
    try {
      const data = await callApiStream(
        {
          message: JSON.stringify(selected),
          session_id: sessionId,
          action: 'update_dolrimja',
        },
        (msg) => setProgressMessage(msg),
      );
      setStage(data.stage);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          stage: data.stage,
          debug: data.debug,
        },
      ]);
    } catch (e: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: [
            {
              type: 'TEXT',
              data: {
                text: `오류: ${e instanceof Error ? e.message : String(e)}`,
              },
            },
          ],
        },
      ]);
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
      const res = await fetch(
        `${BACKEND_URL}/api/session/${encodeURIComponent(id)}`,
      );
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
            i: number,
          ) => ({
            id: `restored-${i}`,
            role: m.role as 'user' | 'assistant',
            content: m.content_blocks,
            stage: m.stage,
          }),
        );
        setMessages([WELCOME_MESSAGE, ...restored]);
      } else {
        // 저장된 메시지가 없으면 복원 요약 표시
        const userInfoText = data.user_info
          ? `${data.user_info.surname ?? ''} | ${data.user_info.gender ?? ''} | ${data.user_info.birth_date ?? ''}`
          : '';
        const directionText = data.naming_direction
          ? `\n작명 방향: ${data.naming_direction}`
          : '';
        const likedText =
          data.liked_names?.length > 0
            ? `\n좋아요: ${data.liked_names.join(', ')}`
            : '';

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

      setFormSubmitted(
        !['welcome', 'info_collection'].includes(data.stage ?? 'welcome'),
      );
    } catch (e: unknown) {
      alert(
        `세션 불러오기 실패: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className={s.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View className={s.header} style={{ paddingTop: insets.top + 12 }}>
        <View>
          <Text className={s.headerTitle}>이름이 ✨</Text>
          <Text className={s.headerSub}>{stageLabel[stage] ?? stage}</Text>
        </View>
        <View className={s.headerRight}>
          <Pressable
            className={s.headerBtn}
            style={{ marginRight: 8 }}
            onPress={() => navigation.navigate('SelfNaming')}
          >
            <Text className={s.headerBtnText}>작명 도구</Text>
          </Pressable>
          <Pressable
            className={clsx(s.headerBtn, showDebug && s.headerBtnOn)}
            onPress={() => setShowDebug((v) => !v)}
          >
            <Text className={s.headerBtnText}>DEV</Text>
          </Pressable>
          {formSubmitted && (
            <Pressable
              className={s.headerBtn}
              style={{ marginLeft: 8 }}
              onPress={() => setDolrimjaModalOpen(true)}
            >
              <Text className={s.headerBtnText}>돌림자 수정</Text>
            </Pressable>
          )}
          <Pressable
            className={s.headerBtn}
            style={{ marginLeft: 8 }}
            onPress={() => setShowLiked((v) => !v)}
          >
            <Text className={s.headerBtnText}>👍 {likedNames.length}</Text>
          </Pressable>
          <Pressable
            className={s.headerBtn}
            style={{ marginLeft: 8 }}
            onPress={() => setRestoreModalOpen(true)}
          >
            <Text className={s.headerBtnText}>불러오기</Text>
          </Pressable>
          <Pressable
            className={s.headerBtn}
            style={{ marginLeft: 8 }}
            onPress={handleReset}
          >
            <Text className={s.headerBtnText}>↺</Text>
          </Pressable>
        </View>
      </View>

      {/* Session ID chip — 세션이 있을 때만 표시 */}
      {sessionId && (
        <View className={s.sessionChip}>
          <Text className={s.sessionChipText} numberOfLines={1}>
            🔑 {sessionId}
          </Text>
        </View>
      )}

      {/* Liked panel */}
      {showLiked && (
        <View className={s.likedPanel}>
          <Text className={s.likedTitle}>👍 좋아요한 이름</Text>
          {likedNames.length === 0 ? (
            <Text className={s.likedEmpty}>아직 없어요</Text>
          ) : (
            likedNames.map((n) => (
              <Text key={n} className={s.likedName}>
                {n}
              </Text>
            ))
          )}
          {dislikedNames.length > 0 && (
            <>
              <Text className={s.likedTitle} style={{ marginTop: 8 }}>
                👎 별로인 이름
              </Text>
              {dislikedNames.map((n) => (
                <Text key={n} className={s.dislikedName}>
                  {n}
                </Text>
              ))}
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
          className={s.list}
          contentContainerStyle={{ padding: 14, paddingBottom: 8 }}
        >
          {messages.map((msg) => (
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
            <View className={s.loadingRow}>
              <ActivityIndicator color={PURPLE} />
              <Text className={s.loadingText}>
                {progressMessage ?? '이름이가 생각 중...'}
              </Text>
            </View>
          )}
        </ScrollView>

        {paymentRequired && (
          <View className={s.payBanner}>
            <Text className={s.payText}>
              더 많은 이름을 탐색하려면 결제가 필요해요
            </Text>
            <Pressable className={s.payBtn} onPress={handlePayment}>
              <Text className={s.payBtnText}>결제하고 계속하기 →</Text>
            </Pressable>
          </View>
        )}

        <View
          className={s.inputRow}
          style={{ paddingBottom: insets.bottom || 10 }}
        >
          <TextInput
            className={s.input}
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
            className={clsx(
              s.sendBtn,
              (!input.trim() || loading || !formSubmitted) && s.sendBtnOff,
            )}
            onPress={handleSend}
            disabled={!input.trim() || loading || !formSubmitted}
          >
            <Text className={s.sendBtnText}>전송</Text>
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
            sendReasons(
              reasonPickerContext.name,
              reasonPickerContext.type,
              keys,
            );
          }
        }}
        onSkip={() => setReasonPickerVisible(false)}
      />
    </View>
  );
}

// ── Form Modal class names (NativeWind) ──────────────────────────────────
const fm: Record<string, string> = {
  backdrop: 'flex-1 bg-black/40',
  sheet: 'bg-surfaceRaised rounded-t-3xl px-5 pt-3 max-h-[88%]',
  handle: 'w-10 h-1 bg-border rounded-sm self-center mb-4',
  header: 'flex-row items-center justify-between mb-1',
  title: 'font-serif-medium text-xl text-textPrimary',
  closeBtn: 'p-1.5',
  closeBtnText: 'text-lg text-textDisabled',
  subtitle:
    'font-sans-regular text-[13px] text-textTertiary leading-[18px] mb-5',
  row: 'flex-row mb-0',
  field: 'mb-[18px]',
  label: 'font-sans-medium text-sm text-textSecondary mb-2',
  req: 'text-negative',
  labelRow: 'flex-row items-center justify-between mb-2',
  input:
    'border-[1.5px] border-border rounded-[10px] px-3 py-2.5 font-sans-regular text-[15px] text-textPrimary bg-surface',
  inputErr: 'border-negative',
  errText: 'font-sans-regular text-negative text-[11px] mt-0.5',
  genderRow: 'flex-row gap-2',
  genderBtn:
    'flex-1 border-[1.5px] border-border rounded-[10px] py-2.5 items-center',
  genderBtnOn: 'border-negative bg-negativeSub',
  genderText: 'font-sans-regular text-[13px] text-textTertiary',
  genderTextOn: 'font-sans-medium text-negative',
  lunarRow: 'flex-row gap-1',
  lunarBtn: 'px-2.5 py-1 rounded-md border border-border',
  lunarBtnOn: 'border-negative bg-negativeSub',
  lunarText: 'font-sans-regular text-xs text-textTertiary',
  lunarTextOn: 'font-sans-medium text-negative',
  dateRow: 'flex-row items-start gap-1',
  sep: 'font-sans-regular text-textSecondary text-[15px] pt-2.5',
  checkRow: 'flex-row items-center mb-2.5',
  checkbox:
    'w-5 h-5 rounded-md border-2 border-border mr-2 items-center justify-center',
  checkboxOn: 'border-negative bg-negative',
  checkMark: 'text-white text-xs font-bold',
  checkLabel: 'font-sans-regular text-sm text-textSecondary',
  submitBtn: 'bg-negative rounded-xl py-4 items-center mt-2',
  submitBtnOff: 'bg-border',
  submitText: 'font-sans-medium text-white text-base',
  optional: 'text-textDisabled font-normal',
  searchRow: 'flex-row items-center',
  searchResults:
    'border-[1.5px] border-border rounded-[10px] mt-1 bg-surfaceRaised overflow-hidden',
  searchResultItem: 'flex-row items-center px-3 py-2.5 gap-2.5',
  searchResultBorder: 'border-b border-b-surface',
  searchResultHanja:
    'font-serif-medium text-[22px] text-textPrimary w-[34px] text-center',
  searchResultEum: 'font-sans-medium text-[15px] text-negative w-11',
  searchResultMean: 'font-sans-regular text-xs text-textTertiary flex-1',
  searchResultStroke: 'font-sans-regular text-[11px] text-textDisabled',
  searchNoResult: 'font-sans-regular text-[13px] text-textDisabled mt-1.5 pl-1',
  hanjaChip:
    'flex-row items-center justify-between border-[1.5px] border-negativeBorder rounded-[10px] px-3 py-2.5 bg-negativeSub',
  hanjaChipInner: 'flex-row items-center gap-3',
  hanjaChipChar: 'font-serif-medium text-[28px] text-textPrimary',
  hanjaChipHangul: 'font-sans-medium text-base text-negative',
  hanjaChipMean: 'font-sans-regular text-xs text-textTertiary max-w-[180px]',
  hanjaChipClearBtn: 'bg-surface rounded-md px-2.5 py-1.5',
  hanjaChipClearText: 'font-sans-medium text-[13px] text-negative',
};

// ── Debug class names ────────────────────────────────────────────────────
const db: Record<string, string> = {
  wrap: 'w-full mb-1 rounded-lg overflow-hidden border border-[#333]',
  toggle: 'bg-[#1e1e2e] px-2.5 py-1.5',
  toggleText: 'text-[#7c7cff] text-[11px] font-bold font-mono',
  scroll: 'bg-[#12121f] max-h-[500px] p-2.5',
  sectionLabel: 'text-[#555] text-[10px] font-mono mb-1',
  code: 'text-[#a8ff78] text-[11px] font-mono leading-[17px]',
};

// ── Chat class names ────────────────────────────────────────────────────
const s: Record<string, string> = {
  root: 'flex-1 bg-bg',
  header: 'bg-negative pb-3 px-4 flex-row items-center justify-between',
  headerTitle: 'font-serif-medium text-white text-xl tracking-[1px]',
  headerSub: 'font-sans-regular text-white/75 text-xs mt-0.5',
  headerRight: 'flex-row items-center',
  headerBtn: 'bg-white/20 px-2.5 py-1.5 rounded-lg',
  headerBtnOn: 'bg-[rgba(255,220,50,0.35)]',
  headerBtnText: 'font-sans-medium text-white text-[13px]',
  likedPanel: 'bg-surfaceRaised border-b border-border p-3 px-4',
  likedTitle: 'font-sans-medium text-[13px] text-textSecondary mb-1',
  likedEmpty: 'font-sans-regular text-textDisabled text-[13px]',
  likedName: 'font-sans-medium text-negative text-sm py-0.5',
  dislikedName: 'font-sans-regular text-negative text-sm py-0.5',
  list: 'flex-1',
  listContent: 'p-3.5 pb-2',
  userWrap: 'items-end mb-2',
  userBubble:
    'bg-negative rounded-[18px] rounded-br-1 px-3.5 py-2.5 max-w-[78%]',
  userText: 'font-sans-regular text-white text-[15px] leading-[22px]',
  aiWrap: 'items-start mb-3 max-w-[92%]',
  aiBubble: 'bg-surfaceRaised rounded-[18px] rounded-tl-1 px-3.5 py-2.5 mb-1.5',
  aiText: 'font-sans-regular text-textPrimary text-[15px] leading-[23px]',
  stagePill: 'bg-negativeSub rounded-md px-2 py-0.5 mb-1',
  stagePillText: 'font-sans-medium text-[11px] text-negative',
  formOpenBtn: 'bg-negative rounded-xl px-5 py-3 self-start mt-0.5',
  formOpenBtnText: 'font-sans-medium text-white text-[15px]',
  choiceGroup:
    'bg-surface rounded-[14px] p-3.5 mb-2 w-full border border-border',
  choiceGroupDone: 'opacity-60',
  choiceQuestion: 'font-sans-medium text-sm text-textPrimary mb-2.5',
  choiceChips: 'flex-row flex-wrap gap-2',
  chip: 'bg-surfaceRaised rounded-[20px] px-3.5 py-2 border-[1.5px] border-border',
  chipSelected: 'bg-negative border-negative',
  chipDisabled: 'opacity-50',
  chipText: 'font-sans-regular text-[13px] text-textSecondary',
  chipTextSelected: 'font-sans-medium text-white',
  chipCustomRow: 'flex-row items-center mt-2 w-full',
  chipCustomInput:
    'flex-1 border border-border rounded-[10px] px-3 py-1.5 font-sans-regular text-[13px] bg-surfaceRaised',
  followUpRow: 'flex-row items-center mt-2.5 gap-2',
  followUpInput:
    'flex-1 border border-border rounded-[10px] px-3 py-2 font-sans-regular text-[13px] bg-surfaceRaised',
  followUpBtn: 'bg-negative rounded-[10px] px-3.5 py-2',
  followUpBtnText: 'font-sans-medium text-white text-[13px]',
  multiSubmitBtn: 'mt-3 bg-negative rounded-[10px] px-5 py-2.5 self-end',
  multiSubmitBtnText: 'font-sans-medium text-white text-sm',
  choiceDoneText: 'font-sans-regular text-xs text-textTertiary mt-2 italic',
  nameCard:
    'bg-surfaceRaised rounded-[14px] p-3.5 mb-2 w-full border-l-4 border-l-negative',
  nameHeader: 'flex-row items-center mb-2.5 flex-wrap gap-1.5',
  nameText: 'font-serif-medium text-[22px] text-textPrimary mr-1',
  badge: 'rounded-md px-2 py-0.5',
  badgeText: 'font-sans-medium text-white text-xs',
  syllableRow: 'flex-row gap-2 mb-2',
  syllable: 'items-center flex-1 bg-surface rounded-lg p-2',
  sylHanja: 'font-serif-medium text-xl text-textPrimary',
  sylHangul: 'font-sans-regular text-[13px] text-textTertiary mt-0.5',
  ohaengPill: 'rounded px-1.5 py-0.5 mt-0.5',
  ohaengText: 'font-sans-medium text-white text-[11px]',
  sylMeaning:
    'font-sans-regular text-[11px] text-textDisabled text-center mt-0.5',
  nameReason: 'font-sans-regular text-[13px] text-textSecondary italic mb-2',
  scoreBreakdown: 'mb-2.5 gap-1',
  scoreRow: 'flex-row items-center gap-1.5',
  scoreLabel: 'font-sans-regular text-[11px] text-textTertiary w-12',
  scoreBarBg: 'flex-1 h-1.5 bg-surface rounded-sm overflow-hidden',
  scoreBarFill: 'h-1.5 bg-negative rounded-sm',
  scoreValue: 'font-sans-regular text-[11px] text-textTertiary w-8 text-right',
  hanjaOptionsSection: 'mb-2 gap-1.5',
  hanjaOptionsRow: 'gap-1',
  hanjaOptionsLabel: 'font-sans-medium text-[11px] text-textTertiary',
  hanjaOptionsList: 'flex-row flex-wrap gap-1.5',
  hanjaOptionItem:
    'flex-row items-center gap-0.5 bg-surface rounded-md px-1.5 py-0.5',
  hanjaOptionChar: 'font-serif-medium text-sm text-textPrimary',
  hanjaOptionMeaning: 'font-sans-regular text-[11px] text-textTertiary',
  reactionRow: 'flex-row gap-2',
  reactionBtn:
    'flex-1 border-[1.5px] border-border rounded-lg py-2 items-center',
  reactionLiked: 'border-ohaeng-wood-border bg-ohaeng-wood-light',
  reactionDisliked: 'border-negativeBorder bg-negativeSub',
  reactionText: 'font-sans-regular text-sm text-textTertiary',
  reactionTextActive: 'font-sans-medium text-textPrimary',
  loadingRow: 'flex-row items-center p-3 gap-2',
  loadingText: 'font-sans-regular text-textTertiary text-sm',
  payBanner:
    'bg-warningSub border-t border-warningBorder p-3.5 items-center gap-2',
  payText: 'font-sans-regular text-textSecondary text-sm',
  payBtn: 'bg-fillAccent rounded-[10px] px-5 py-2.5',
  payBtnText: 'font-sans-medium text-white text-[15px]',
  inputRow:
    'flex-row p-2.5 bg-surfaceRaised border-t border-border items-end gap-2',
  input:
    'flex-1 bg-bg rounded-xl px-3.5 py-2.5 font-sans-regular text-[15px] text-textPrimary max-h-[100px] border border-border',
  sendBtn: 'bg-negative rounded-xl px-4 py-3',
  sendBtnOff: 'bg-border',
  sendBtnText: 'font-sans-medium text-white text-[15px]',
  sessionChip: 'bg-[#1a1a2e] px-3.5 py-1.5 border-b border-[#333]',
  sessionChipText: 'text-[#7c7cff] text-[11px] font-mono',
};
