import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';
import NavBar from '@/components/NavBar';
import MyeongJuStrip from '@/naming-tool/components/MyeongJuStrip';
import { useMyeongJuList } from '@/myeongju/hooks/useMyeongJuList';
import { RootStackParamList } from '../navigation/types';
import { ApiResponse, ChatMessage, ContentBlock } from '../ai-naming/types';
import { SelectedHanja } from '../shared/components/HanjaSearchField';
import AIPaymentModal from '../payment/components/AIPaymentModal';
import { usePurchaseStatus } from '../payment/hooks/usePurchaseStatus';
import MessageBubble from '../ai-naming/components/MessageBubble';
import DolrimjaModal from '../ai-naming/components/DolrimjaModal';
import ReasonPicker from '../ai-naming/components/ReasonPicker';
import SessionRestoreModal from '../ai-naming/components/SessionRestoreModal';
import { BACKEND_URL } from '../../constants/config';

type AINamingNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'AINaming'
>;
type AINamingRoute = RouteProp<RootStackParamList, 'AINaming'>;

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

// "묘시(卯時) · 오전 5:30" → "05:30" (24h)
function parseBirthTime(birthTime: string): string | null {
  if (!birthTime || birthTime === '시간 모름') return null;
  // Extract "오전 5:30" or "오후 2:30"
  const match = birthTime.match(/(오전|오후)\s+(\d+):(\d+)/);
  if (!match) return null;
  const ampm = match[1];
  let hour = parseInt(match[2]);
  const min = parseInt(match[3]);
  if (ampm === '오후' && hour !== 12) hour += 12;
  if (ampm === '오전' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// ── Typing indicator ────────────────────────────────────────────────────────
function TypingIndicator({ label }: { label: string }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    function pulse(val: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      );
    }
    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row items-end gap-1.5 mb-3">
      <View
        className="w-[26px] items-center justify-center rounded-[7px] flex-shrink-0"
        style={{
          height: 26,
          backgroundColor: colors.fillBold,
          marginBottom: 3,
        }}
      >
        <Font tag="primaryMedium" style={{ fontSize: 12, color: '#fff' }}>
          名
        </Font>
      </View>
      <View
        className="flex-row items-center gap-1 rounded-[16px] px-3.5 py-2.5 border border-border"
        style={{
          backgroundColor: colors.surfaceRaised,
          borderTopLeftRadius: 3,
        }}
      >
        {[dot1, dot2, dot3].map((val, i) => (
          <Animated.View
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: 99,
              backgroundColor: colors.textDisabled,
              opacity: val,
            }}
          />
        ))}
        <Font
          tag="secondary"
          style={{ fontSize: 12, color: colors.textDisabled, marginLeft: 4 }}
        >
          {label}
        </Font>
      </View>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────
export default function AINamingScreen() {
  const navigation = useNavigation<AINamingNavProp>();
  const route = useRoute<AINamingRoute>();
  const { profileId } = route.params;
  const insets = useSafeAreaInsets();

  const { data: profiles = [] } = useMyeongJuList();
  const profile = profiles.find((p) => p.id === profileId) ?? null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState('preference_interview');
  const [likedNames, setLikedNames] = useState<string[]>([]);
  const [dislikedNames, setDislikedNames] = useState<string[]>([]);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
  const [sessionStarted, setSessionStarted] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { data: purchaseStatus } = usePurchaseStatus(sessionId ?? undefined);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  // 프로필 로드되면 자동으로 세션 시작
  useEffect(() => {
    if (profile && !sessionStarted && !loading) {
      handleStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

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

  async function handleStart() {
    if (!profile || sessionStarted) return;
    setSessionStarted(true);
    setLoading(true);

    const user_info = {
      surname: profile.surname,
      surname_hanja: profile.surnameHanja,
      gender: profile.gender === 'male' ? '남' : '여',
      birth_date: profile.birthDate,
      birth_time: parseBirthTime(profile.birthTime),
      is_lunar: profile.calendarType === '음력',
      돌림자: '',
      돌림자_한자: '',
    };

    const summaryText = [
      `${profile.surnameHanja}(${profile.surname})`,
      profile.gender === 'male' ? '아들' : '딸',
      profile.birthDate,
      profile.calendarType,
      parseBirthTime(profile.birthTime) ?? '시간 모름',
      '돌림자 없음',
    ].join(' · ');

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

      setMessages([
        {
          id: 'user-info',
          role: 'user',
          content: [{ type: 'TEXT', data: { text: summaryText } }],
        },
        {
          id: 'ai-start',
          role: 'assistant',
          content: data.content,
          stage: data.stage,
          debug: data.debug,
        },
      ]);
    } catch (e: unknown) {
      setMessages([
        {
          id: 'error',
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
    setMessages([]);
    setSessionId(null);
    setStage('preference_interview');
    setLikedNames([]);
    setDislikedNames([]);
    setPaymentRequired(false);
    setInput('');
    setShowLiked(false);
    setReasonPickerVisible(false);
    setReasonPickerContext(null);
    setReactionCount(0);
    setSessionStarted(false);
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

      setSessionId(data.session_id);
      setStage(data.stage ?? 'preference_interview');
      setLikedNames(data.liked_names ?? []);
      setDislikedNames(data.disliked_names ?? []);
      setPaymentRequired(data.payment_required ?? false);
      setSessionStarted(true);

      if (data.messages && data.messages.length > 0) {
        const restored: ChatMessage[] = data.messages.map(
          (
            m: {
              role: string;
              content_blocks: ContentBlock[];
              stage?: string;
            },
            i: number,
          ) => ({
            id: `restored-${i}`,
            role: m.role as 'user' | 'assistant',
            content: m.content_blocks,
            stage: m.stage,
          }),
        );
        setMessages(restored);
      } else {
        const restoreMsg =
          `세션을 불러왔어요 ✅\n` +
          `ID: ${id.slice(0, 8)}...\n` +
          `단계: ${stageLabel[data.stage] ?? data.stage}`;
        setMessages([
          {
            id: 'restored',
            role: 'assistant',
            content: [{ type: 'TEXT', data: { text: restoreMsg } }],
            stage: data.stage,
          },
        ]);
      }
    } catch (e: unknown) {
      alert(
        `세션 불러오기 실패: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  const canInput = sessionStarted && !loading;

  return (
    <View className="flex-1 bg-bg">
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={{ paddingTop: insets.top }}>
        <NavBar
          title="이름이 ✦"
          subtitle={`${stageLabel[stage] ?? stage} · AI 작명`}
          onBack={() => navigation.goBack()}
        />
      </View>

      {/* DEV 툴바 */}
      {__DEV__ && (
        <View className="flex-row gap-2 px-3 py-1 bg-surface border-b border-border">
          <Pressable onPress={() => setShowDebug((v) => !v)}>
            <Font
              tag="secondary"
              style={{ fontSize: 11, color: colors.textDisabled }}
            >
              {showDebug ? 'DEBUG ON' : 'DEBUG OFF'}
            </Font>
          </Pressable>
          <Pressable onPress={handleReset}>
            <Font
              tag="secondary"
              style={{ fontSize: 11, color: colors.textDisabled }}
            >
              RESET
            </Font>
          </Pressable>
        </View>
      )}

      {/* 명주 스트립 */}
      {profile && <MyeongJuStrip profile={profile} readOnly />}

      {/* 좋아요 패널 */}
      {showLiked && (
        <View className="bg-bgSubtle border-b border-border p-3 px-4">
          <Font
            tag="secondaryMedium"
            style={{
              fontSize: 12,
              color: colors.textDisabled,
              marginBottom: 6,
              letterSpacing: 0.8,
            }}
          >
            좋아요한 이름
          </Font>
          {likedNames.length === 0 ? (
            <Font
              tag="secondary"
              style={{ fontSize: 13, color: colors.textDisabled }}
            >
              아직 없어요
            </Font>
          ) : (
            <View className="flex-row flex-wrap gap-1.5">
              {likedNames.map((n) => (
                <View
                  key={n}
                  className="rounded-full px-2.5 py-1 border"
                  style={{
                    backgroundColor: colors.fillAccentSub,
                    borderColor: colors.fillAccent,
                  }}
                >
                  <Font
                    tag="primaryMedium"
                    style={{ fontSize: 13, color: colors.fillAccent }}
                  >
                    {n}
                  </Font>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 채팅 + 인풋 */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1 bg-bg"
          contentContainerStyle={{ padding: 13, paddingBottom: 8 }}
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              liked={likedNames}
              disliked={dislikedNames}
              onLike={handleLike}
              onDislike={handleDislike}
              showDebug={showDebug}
              onSend={sendMessage}
            />
          ))}
          {loading && (
            <TypingIndicator label={progressMessage ?? '이름이가 생각 중...'} />
          )}
        </ScrollView>

        {/* 결제 배너 */}
        {paymentRequired && (
          <View
            className="border-t border-border px-4 py-3 items-center gap-2.5"
            style={{ backgroundColor: colors.bgSubtle }}
          >
            <Font
              tag="secondary"
              style={{
                fontSize: 12,
                color: colors.textTertiary,
                textAlign: 'center',
              }}
            >
              이용권 결제 후 이름 추천을 받을 수 있어요
            </Font>
            <Pressable
              className="w-full rounded-[14px] py-3 items-center flex-row justify-center gap-1.5"
              style={{ backgroundColor: colors.fillBold }}
              onPress={() => setShowPaymentModal(true)}
            >
              <Font
                tag="secondaryMedium"
                style={{ fontSize: 15, color: '#fff' }}
              >
                이용권 결제하기
              </Font>
            </Pressable>
          </View>
        )}

        {/* 입력창 */}
        <View
          className="flex-row items-end gap-2 border-t border-border px-3 py-2.5"
          style={{
            backgroundColor: colors.bgSubtle,
            paddingBottom: Math.max(insets.bottom, 10),
          }}
        >
          <TextInput
            className="flex-1 border border-border rounded-[14px] px-3.5 py-2.5 bg-surfaceRaised"
            style={{
              fontSize: 14,
              color: colors.textPrimary,
              maxHeight: 100,
              minHeight: 42,
            }}
            value={input}
            onChangeText={setInput}
            placeholder="이름이에게 메시지를 보내세요"
            placeholderTextColor={colors.textDisabled}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={canInput}
            multiline
          />
          <Pressable
            className="rounded-xl items-center justify-center flex-shrink-0"
            style={{
              width: 42,
              height: 42,
              backgroundColor:
                !input.trim() || !canInput ? colors.border : colors.fillBold,
            }}
            onPress={handleSend}
            disabled={!input.trim() || !canInput}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Font
                tag="secondaryMedium"
                style={{ fontSize: 15, color: '#fff' }}
              >
                ↑
              </Font>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* 플로팅 헤더 버튼들 (세션 복원, 좋아요, 돌림자, 리셋, DEV) */}
      {/* 이 버튼들은 NavBar 오른쪽에 넣기 어려워 일단 숨김 처리 — 필요시 NavBar 확장 */}

      {/* 모달들 */}
      <DolrimjaModal
        visible={dolrimjaModalOpen}
        onClose={() => setDolrimjaModalOpen(false)}
        onSubmit={handleDolrimjaUpdate}
        loading={loading}
      />

      <SessionRestoreModal
        visible={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        onRestore={handleSessionRestore}
      />

      <AIPaymentModal
        visible={showPaymentModal}
        sessionId={sessionId ?? ''}
        purchasedCount={purchaseStatus?.aiNamingPurchasedCount ?? 0}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          handlePayment();
        }}
      />

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
