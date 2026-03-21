import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Font } from '@/components/Font';
import { colors } from '@/design-system';
import { ChatMessage, ContentBlock, NameData } from '../types';
import { isCompleteNameData } from '../utils';
import ChoiceGroupBlock from './ChoiceGroupBlock';
import NameCard from './NameCard';
import DebugPanel from './DebugPanel';
import SimpleMarkdown from './SimpleMarkdown';
import TypewriterText from './TypewriterText';

interface Props {
  msg: ChatMessage;
  liked: string[];
  disliked: string[];
  onLike: (name: string) => void;
  onDislike: (name: string) => void;
  showDebug: boolean;
  onSend: (text: string) => void;
  /** 바로 다음 메시지가 사용자 답변이면 선택지는 이미 제출된 것으로 표시 (복원 UI) */
  hasUserReplyBelow?: boolean;
  /** 새로 도착한 메시지에 타이프라이터 효과 적용 */
  animate?: boolean;
  /** NAME 카드의 상세 분석 보기 버튼 콜백 */
  onNameDetailPress?: (nameData: NameData) => void;
}

export default function MessageBubble({
  msg,
  liked,
  disliked,
  onLike,
  onDislike,
  showDebug,
  onSend,
  hasUserReplyBelow = false,
  animate = false,
  onNameDetailPress,
}: Props) {
  const textCount = useMemo(
    () => msg.content.filter((b) => b.type === 'TEXT').length,
    [msg.content],
  );

  // 각 content block에 대해 몇 번째 TEXT 블록인지 미리 계산 (-1 = TEXT 아님)
  const textIndices = useMemo(() => {
    let idx = 0;
    return msg.content.map((b) => (b.type === 'TEXT' ? idx++ : -1));
  }, [msg.content]);

  // 현재 애니메이션 중인 TEXT 블록 인덱스
  // animate=false이면 전체 완료로 시작
  const [animatingTextIdx, setAnimatingTextIdx] = useState(
    animate ? 0 : textCount,
  );

  useEffect(() => {
    setAnimatingTextIdx(animate ? 0 : textCount);
  }, [animate, msg.id, textCount]);

  const handleTextDone = useCallback(() => {
    setAnimatingTextIdx((i) => i + 1);
  }, []);

  const nonTextVisible = animatingTextIdx >= textCount;

  if (msg.role === 'user') {
    const text = msg.content
      .filter((b) => b.type === 'TEXT')
      .map((b) => (b as { type: 'TEXT'; data: { text: string } }).data.text)
      .join('');
    return (
      <View className="items-end mb-3">
        <View
          className="rounded-[16px] px-3.5 py-2.5 max-w-[78%]"
          style={{
            backgroundColor: colors.fillBold,
            borderTopRightRadius: 3,
          }}
        >
          <Font
            tag="secondary"
            style={{
              fontSize: 13.5,
              color: '#fff',
              lineHeight: 21,
            }}
          >
            {text}
          </Font>
        </View>
      </View>
    );
  }

  return (
    <View className="items-start mb-3 flex-row gap-1.5 max-w-[92%]">
      {/* AI 아바타 */}
      <View
        className="w-[26px] items-center justify-center rounded-[7px] flex-shrink-0"
        style={{
          height: 26,
          backgroundColor: colors.fillBold,
          marginTop: 3,
        }}
      >
        <Font
          tag="primaryMedium"
          style={{ fontSize: 12, color: '#fff', lineHeight: 16 }}
        >
          名
        </Font>
      </View>

      {/* 메시지 컨텐츠 */}
      <View className="flex-1 min-w-0">
        {showDebug && <DebugPanel debug={msg.debug} />}
        {msg.content.map((block, i) => {
          if (block.type === 'TEXT') {
            const myTextIdx = textIndices[i];
            // 아직 차례가 되지 않은 TEXT 블록은 숨김
            if (myTextIdx > animatingTextIdx) return null;
            const isAnimating = animate && myTextIdx === animatingTextIdx;
            return (
              <View
                key={i}
                className="rounded-[16px] px-3.5 py-2.5 mb-1.5 border border-border"
                style={{
                  backgroundColor: colors.surfaceRaised,
                  borderTopLeftRadius: 3,
                }}
              >
                {isAnimating ? (
                  <TypewriterText
                    text={block.data.text}
                    animate={true}
                    msPerChar={50}
                    onDone={handleTextDone}
                  />
                ) : (
                  <SimpleMarkdown text={block.data.text} />
                )}
              </View>
            );
          }
          if (!nonTextVisible) return null;
          if (block.type === 'CHOICE_GROUP') {
            return (
              <ChoiceGroupBlock
                key={i}
                data={block.data}
                onSend={onSend}
                submitted={hasUserReplyBelow}
              />
            );
          }
          if (block.type === 'NAME') {
            const nameBlock = (block as Extract<ContentBlock, { type: 'NAME' }>)
              .data;
            if (!isCompleteNameData(nameBlock)) {
              return null;
            }
            const name = nameBlock.한글;
            return (
              <NameCard
                key={i}
                data={nameBlock}
                liked={liked.includes(name)}
                disliked={disliked.includes(name)}
                onLike={() => onLike(name)}
                onDislike={() => onDislike(name)}
                onDetailPress={
                  onNameDetailPress
                    ? () => onNameDetailPress(nameBlock)
                    : undefined
                }
              />
            );
          }
          return null;
        })}
      </View>
    </View>
  );
}
