import { useEffect, useRef, useState } from 'react';
import { MyeongJuProfile } from '@/myeongju/types';
import { SelectedHanja } from '@/shared/components/HanjaSearchField';
import { BACKEND_URL } from '../../../constants/config';
import { ApiResponse, ChatMessage, ContentBlock } from '../types';
import { isCompleteNameData } from '../utils';

/**
 * 구 포맷·불완전 NAME 블록을 걸러냅니다.
 * (`firstCharacter` 키만 있고 값이 undefined인 JSON도 `in`으로는 통과하므로 값 검증 필요)
 */
function filterLegacyContentBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.filter((b) => b.type !== 'NAME' || isCompleteNameData(b.data));
}

function parseBirthTime(birthTime: string): string | null {
  if (!birthTime || birthTime === '시간 모름') return null;
  const match = birthTime.match(/(오전|오후)\s+(\d+):(\d+)/);
  if (!match) return null;
  const ampm = match[1];
  let hour = parseInt(match[2]);
  const min = parseInt(match[3]);
  if (ampm === '오후' && hour !== 12) hour += 12;
  if (ampm === '오전' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function shouldShowReasonPicker(count: number): boolean {
  if (count <= 5) return true;
  return count % 3 === 0;
}

export interface AINamingSessionState {
  messages: ChatMessage[];
  input: string;
  setInput: (text: string) => void;
  loading: boolean;
  progressMessage: string | null;
  sessionId: string | null;
  likedNames: string[];
  dislikedNames: string[];
  paymentRequired: boolean;
  showPaymentModal: boolean;
  setShowPaymentModal: (v: boolean) => void;
  showLiked: boolean;
  setShowLiked: (v: boolean) => void;
  dolrimjaModalOpen: boolean;
  setDolrimjaModalOpen: (v: boolean) => void;
  showDebug: boolean;
  setShowDebug: React.Dispatch<React.SetStateAction<boolean>>;
  restoreModalOpen: boolean;
  setRestoreModalOpen: (v: boolean) => void;
  reasonPickerVisible: boolean;
  reasonPickerContext: { name: string; type: 'liked' | 'disliked' } | null;
  sessionStarted: boolean;
  canInput: boolean;
  handleSend: () => void;
  sendMessage: (text: string) => Promise<void>;
  handleLike: (name: string) => Promise<void>;
  handleDislike: (name: string) => Promise<void>;
  handlePayment: () => Promise<void>;
  handleDolrimjaUpdate: (selected: SelectedHanja) => Promise<void>;
  handleReset: () => void;
  handleSessionRestore: (id: string) => Promise<void>;
  handleReasonPickerSubmit: (keys: string[]) => void;
  handleReasonPickerSkip: () => void;
}

export function useAINamingSession(
  sessionId: string,
  profile: MyeongJuProfile | null,
): AINamingSessionState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [, setStage] = useState('preference_interview');
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

  const sessionStartedRef = useRef(false);

  useEffect(() => {
    if (!sessionId || !profile) return;

    let cancelled = false;

    sessionStartedRef.current = false;
    setSessionStarted(false);
    setCurrentSessionId(null);
    setMessages([]);
    setLikedNames([]);
    setDislikedNames([]);
    setPaymentRequired(false);

    async function init() {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/session/${encodeURIComponent(sessionId)}`,
        );
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.found && data.messages && data.messages.length > 0) {
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
                content: filterLegacyContentBlocks(m.content_blocks),
                stage: m.stage,
              }),
            );
            if (cancelled) return;
            setCurrentSessionId(data.session_id);
            setStage(data.stage ?? 'preference_interview');
            setLikedNames(data.liked_names ?? []);
            setDislikedNames(data.disliked_names ?? []);
            setPaymentRequired(data.payment_required ?? false);
            setMessages(restored);
            setSessionStarted(true);
            sessionStartedRef.current = true;
            return;
          }
        }
      } catch {
        /* 네트워크 오류 → 새 세션 시작 */
      }
      if (!cancelled) {
        await handleStart();
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, profile?.id ?? '']);

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
    if (!profile || sessionStartedRef.current) return;
    sessionStartedRef.current = true;
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

    try {
      const data = await callApiStream(
        {
          message: JSON.stringify(user_info),
          action: 'submit_info',
          session_id: sessionId,
        },
        (msg) => setProgressMessage(msg),
      );

      setCurrentSessionId(data.session_id);
      setStage(data.stage);
      setLikedNames(data.liked_names);
      setDislikedNames(data.disliked_names);
      setPaymentRequired(data.payment_required);

      setMessages([
        {
          id: 'ai-start',
          role: 'assistant',
          content: filterLegacyContentBlocks(data.content),
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
        { message: text, session_id: currentSessionId },
        (msg) => setProgressMessage(msg),
      );
      setCurrentSessionId(data.session_id);
      setStage(data.stage);
      setLikedNames(data.liked_names);
      setDislikedNames(data.disliked_names);
      setPaymentRequired(data.payment_required);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: filterLegacyContentBlocks(data.content),
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

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    sendMessage(text);
  }

  function sendReasons(
    name: string,
    type: 'liked' | 'disliked',
    reasonKeys: string[],
  ) {
    if (!currentSessionId || reasonKeys.length === 0) return;
    fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '',
        session_id: currentSessionId,
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
        session_id: currentSessionId,
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
        session_id: currentSessionId,
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
          session_id: currentSessionId,
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
          content: filterLegacyContentBlocks(data.content),
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
          session_id: currentSessionId,
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
          content: filterLegacyContentBlocks(data.content),
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
    sessionStartedRef.current = false;
    setMessages([]);
    setCurrentSessionId(null);
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

      setCurrentSessionId(data.session_id);
      setStage(data.stage ?? 'preference_interview');
      setLikedNames(data.liked_names ?? []);
      setDislikedNames(data.disliked_names ?? []);
      setPaymentRequired(data.payment_required ?? false);
      setSessionStarted(true);
      sessionStartedRef.current = true;

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
            content: filterLegacyContentBlocks(m.content_blocks),
            stage: m.stage,
          }),
        );
        setMessages(restored);
      } else {
        setMessages([
          {
            id: 'restored',
            role: 'assistant',
            content: [
              {
                type: 'TEXT',
                data: { text: `이전 대화를 불러왔어요.` },
              },
            ],
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

  function handleReasonPickerSubmit(keys: string[]) {
    setReasonPickerVisible(false);
    if (reasonPickerContext) {
      sendReasons(reasonPickerContext.name, reasonPickerContext.type, keys);
    }
  }

  function handleReasonPickerSkip() {
    setReasonPickerVisible(false);
  }

  const canInput = sessionStarted && !loading;

  return {
    messages,
    input,
    setInput,
    loading,
    progressMessage,
    sessionId: currentSessionId,
    likedNames,
    dislikedNames,
    paymentRequired,
    showPaymentModal,
    setShowPaymentModal,
    showLiked,
    setShowLiked,
    dolrimjaModalOpen,
    setDolrimjaModalOpen,
    showDebug,
    setShowDebug,
    restoreModalOpen,
    setRestoreModalOpen,
    reasonPickerVisible,
    reasonPickerContext,
    sessionStarted,
    canInput,
    handleSend,
    sendMessage,
    handleLike,
    handleDislike,
    handlePayment,
    handleDolrimjaUpdate,
    handleReset,
    handleSessionRestore,
    handleReasonPickerSubmit,
    handleReasonPickerSkip,
  };
}
