import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
type ContentBlock =
  | { type: 'TEXT'; data: { text: string } }
  | { type: 'NAME'; data: NameData };

interface NameData {
  한글: string;
  full_name: string;
  syllables: { 한글: string; 한자: string; meaning: string; 오행: string }[];
  발음오행_조화: string;
  rarity_signal: string;
  reason: string;
  hanja_options: unknown[];
}

interface ApiResponse {
  session_id: string;
  stage: string;
  content: ContentBlock[];
  liked_names: string[];
  disliked_names: string[];
  payment_required: boolean;
  naming_direction: string | null;
  requirement_summary: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: ContentBlock[];
  stage?: string;
}

// ── Harmony badge colour ───────────────────────────────────────────────
const harmonyColor: Record<string, string> = {
  대길: '#2ecc71',
  반길: '#f39c12',
  대흉: '#e74c3c',
};

const rarityColor: Record<string, string> = {
  희귀: '#9b59b6',
  보통: '#3498db',
  흔한: '#95a1a8',
};

const ohaengColor: Record<string, string> = {
  목: '#27ae60',
  화: '#e74c3c',
  토: '#d4a017',
  금: '#7f8c8d',
  수: '#2980b9',
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

// ── Sub-components ────────────────────────────────────────────────────
function StageBadge({ stage }: { stage: string }) {
  return (
    <View style={s.stageBadge}>
      <Text style={s.stageBadgeText}>{stageLabel[stage] ?? stage}</Text>
    </View>
  );
}

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
    <View style={s.nameCard}>
      <View style={s.nameHeader}>
        <Text style={s.nameText}>{data.full_name}</Text>
        <View style={[s.harmonyBadge, { backgroundColor: harmonyColor[harmony] ?? '#95a1a8' }]}>
          <Text style={s.harmonyText}>{harmony}</Text>
        </View>
        <View style={[s.rarityBadge, { backgroundColor: rarityColor[data.rarity_signal] ?? '#3498db' }]}>
          <Text style={s.rarityText}>{data.rarity_signal}</Text>
        </View>
      </View>

      {/* 음절 분석 */}
      <View style={s.syllableRow}>
        {data.syllables.map((syl, i) => (
          <View key={i} style={s.syllable}>
            <Text style={s.sylHanja}>{syl.한자 || syl.한글}</Text>
            <Text style={s.sylHangul}>{syl.한글}</Text>
            {syl.오행 ? (
              <View style={[s.ohaengDot, { backgroundColor: ohaengColor[syl.오행] ?? '#ccc' }]}>
                <Text style={s.ohaengText}>{syl.오행}</Text>
              </View>
            ) : null}
            <Text style={s.sylMeaning} numberOfLines={2}>{syl.meaning}</Text>
          </View>
        ))}
      </View>

      {data.reason ? <Text style={s.nameReason}>{data.reason}</Text> : null}

      {/* 좋아요/싫어요 */}
      <View style={s.reactionRow}>
        <Pressable
          style={[s.reactionBtn, liked && s.reactionBtnActive]}
          onPress={onLike}
        >
          <Text style={[s.reactionBtnText, liked && s.reactionBtnTextActive]}>
            👍 좋아요
          </Text>
        </Pressable>
        <Pressable
          style={[s.reactionBtn, disliked && s.reactionBtnDislike]}
          onPress={onDislike}
        >
          <Text style={[s.reactionBtnText, disliked && s.reactionBtnTextActive]}>
            👎 별로
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function MessageBubble({
  msg,
  liked,
  disliked,
  onLike,
  onDislike,
}: {
  msg: ChatMessage;
  liked: string[];
  disliked: string[];
  onLike: (name: string) => void;
  onDislike: (name: string) => void;
}) {
  const isUser = msg.role === 'user';
  if (isUser) {
    const text = msg.content.map(b => b.type === 'TEXT' ? b.data.text : '').join('');
    return (
      <View style={s.userBubbleWrap}>
        <View style={s.userBubble}>
          <Text style={s.userBubbleText}>{text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.assistantBubbleWrap}>
      {msg.stage ? <StageBadge stage={msg.stage} /> : null}
      {msg.content.map((block, i) => {
        if (block.type === 'TEXT') {
          return (
            <View key={i} style={s.assistantBubble}>
              <Text style={s.assistantBubbleText}>{block.data.text}</Text>
            </View>
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

// ── Main App ──────────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState('welcome');
  const [likedNames, setLikedNames] = useState<string[]>([]);
  const [dislikedNames, setDislikedNames] = useState<string[]>([]);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [showLiked, setShowLiked] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  async function sendRequest(message: string, action?: string) {
    setLoading(true);
    try {
      const body: Record<string, string | null> = { message, session_id: sessionId };
      if (action) body.action = action;

      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? 'Server error');
      }
      const data: ApiResponse = await res.json();

      setSessionId(data.session_id);
      setStage(data.stage);
      setLikedNames(data.liked_names);
      setDislikedNames(data.disliked_names);
      setPaymentRequired(data.payment_required);

      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        stage: data.stage,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: unknown) {
      const errMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: [{ type: 'TEXT', data: { text: `오류: ${e instanceof Error ? e.message : String(e)}` } }],
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: [{ type: 'TEXT', data: { text } }],
    };
    setMessages(prev => [...prev, userMsg]);
    await sendRequest(text);
  }

  async function handleLike(name: string) {
    const already = likedNames.includes(name);
    const action = already ? `unlike:${name}` : `like:${name}`;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', session_id: sessionId, action }),
      });
      const data: ApiResponse = await res.json();
      setLikedNames(data.liked_names);
      setDislikedNames(data.disliked_names);
    } finally {
      setLoading(false);
    }
  }

  async function handleDislike(name: string) {
    const already = dislikedNames.includes(name);
    const action = already ? `undislike:${name}` : `dislike:${name}`;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', session_id: sessionId, action }),
      });
      const data: ApiResponse = await res.json();
      setLikedNames(data.liked_names);
      setDislikedNames(data.disliked_names);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '결제 완료했습니다', session_id: sessionId, action: 'payment_complete' }),
      });
      const data: ApiResponse = await res.json();
      setSessionId(data.session_id);
      setStage(data.stage);
      setLikedNames(data.liked_names);
      setDislikedNames(data.disliked_names);
      setPaymentRequired(false);
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        stage: data.stage,
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([]);
    setSessionId(null);
    setStage('welcome');
    setLikedNames([]);
    setDislikedNames([]);
    setPaymentRequired(false);
    setInput('');
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>이름이 ✨</Text>
          <Text style={s.headerStage}>{stageLabel[stage] ?? stage}</Text>
        </View>
        <View style={s.headerRight}>
          <Pressable style={s.headerBtn} onPress={() => setShowLiked(v => !v)}>
            <Text style={s.headerBtnText}>👍 {likedNames.length}</Text>
          </Pressable>
          <Pressable style={[s.headerBtn, { marginLeft: 8 }]} onPress={handleReset}>
            <Text style={s.headerBtnText}>↺ 초기화</Text>
          </Pressable>
        </View>
      </View>

      {/* Liked panel */}
      {showLiked && (
        <View style={s.likedPanel}>
          <Text style={s.likedTitle}>👍 좋아요한 이름</Text>
          {likedNames.length === 0
            ? <Text style={s.likedEmpty}>아직 없어요</Text>
            : likedNames.map(n => (
              <Text key={n} style={s.likedName}>{n}</Text>
            ))}
          {dislikedNames.length > 0 && (
            <>
              <Text style={[s.likedTitle, { marginTop: 8 }]}>👎 별로인 이름</Text>
              {dislikedNames.map(n => (
                <Text key={n} style={s.dislikedName}>{n}</Text>
              ))}
            </>
          )}
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          style={s.messageList}
          contentContainerStyle={s.messageListContent}
        >
          {messages.length === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>안녕하세요 👋</Text>
              <Text style={s.emptyDesc}>
                메시지를 보내면 이름이와 작명 여정을 시작합니다.
              </Text>
              <Pressable style={s.startBtn} onPress={() => sendRequest('안녕하세요')}>
                <Text style={s.startBtnText}>대화 시작하기</Text>
              </Pressable>
            </View>
          )}
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              liked={likedNames}
              disliked={dislikedNames}
              onLike={handleLike}
              onDislike={handleDislike}
            />
          ))}
          {loading && (
            <View style={s.loadingWrap}>
              <ActivityIndicator color="#6c63ff" />
              <Text style={s.loadingText}>이름이가 생각 중...</Text>
            </View>
          )}
        </ScrollView>

        {/* Payment gate */}
        {paymentRequired && (
          <View style={s.paymentBanner}>
            <Text style={s.paymentText}>더 많은 이름을 탐색하려면 결제가 필요해요</Text>
            <Pressable style={s.paymentBtn} onPress={handlePayment}>
              <Text style={s.paymentBtnText}>결제하고 계속하기 →</Text>
            </Pressable>
          </View>
        )}

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor="#aaa"
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!loading}
            multiline
          />
          <Pressable
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
            <Text style={s.sendBtnText}>전송</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const PURPLE = '#6c63ff';
const BG = '#f4f3ff';
const CARD_BG = '#ffffff';

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
  headerStage: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  likedPanel: {
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e4ff',
    padding: 12,
    paddingHorizontal: 16,
  },
  likedTitle: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 4 },
  likedEmpty: { color: '#aaa', fontSize: 13 },
  likedName: { color: PURPLE, fontSize: 14, fontWeight: '600', paddingVertical: 2 },
  dislikedName: { color: '#e74c3c', fontSize: 14, paddingVertical: 2 },

  messageList: { flex: 1 },
  messageListContent: { padding: 12, paddingBottom: 8 },

  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },
  startBtn: {
    marginTop: 24,
    backgroundColor: PURPLE,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  userBubbleWrap: { alignItems: 'flex-end', marginBottom: 8 },
  userBubble: {
    backgroundColor: PURPLE,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '78%',
  },
  userBubbleText: { color: '#fff', fontSize: 15, lineHeight: 21 },

  assistantBubbleWrap: { alignItems: 'flex-start', marginBottom: 10, maxWidth: '92%' },
  assistantBubble: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 6,
  },
  assistantBubbleText: { color: '#222', fontSize: 15, lineHeight: 23 },

  stageBadge: {
    backgroundColor: '#e8e4ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  stageBadgeText: { fontSize: 11, color: PURPLE, fontWeight: '600' },

  nameCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: PURPLE,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  nameHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 },
  nameText: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginRight: 4 },
  harmonyBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  harmonyText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  rarityBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  rarityText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  syllableRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  syllable: { alignItems: 'center', flex: 1, backgroundColor: '#f8f7ff', borderRadius: 8, padding: 8 },
  sylHanja: { fontSize: 20, fontWeight: '700', color: '#333' },
  sylHangul: { fontSize: 13, color: '#888', marginTop: 2 },
  ohaengDot: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
  },
  ohaengText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sylMeaning: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 3 },

  nameReason: { fontSize: 13, color: '#555', fontStyle: 'italic', marginBottom: 8 },

  reactionRow: { flexDirection: 'row', gap: 8 },
  reactionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  reactionBtnActive: { borderColor: '#2ecc71', backgroundColor: '#f0fdf4' },
  reactionBtnDislike: { borderColor: '#e74c3c', backgroundColor: '#fef2f2' },
  reactionBtnText: { fontSize: 14, color: '#888' },
  reactionBtnTextActive: { color: '#333', fontWeight: '600' },

  loadingWrap: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  loadingText: { color: '#888', fontSize: 14 },

  paymentBanner: {
    backgroundColor: '#fff8e1',
    borderTopWidth: 1,
    borderTopColor: '#ffe082',
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  paymentText: { color: '#795548', fontSize: 14 },
  paymentBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  paymentBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  inputRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0dbff',
  },
  sendBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
