import React from 'react';
import { View } from 'react-native';
import { Font } from '@/components/Font';
import { colors } from '@/design-system';
import { ChatMessage, ContentBlock } from '../types';
import ChoiceGroupBlock from './ChoiceGroupBlock';
import NameCard from './NameCard';
import DebugPanel from './DebugPanel';

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

function renderInlineBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Font
          key={i}
          tag="secondaryMedium"
          style={{ fontSize: 13.5, color: colors.textPrimary }}
        >
          {part.slice(2, -2)}
        </Font>
      );
    }
    return (
      <Font
        key={i}
        tag="secondary"
        style={{ fontSize: 13.5, color: colors.textPrimary }}
      >
        {part}
      </Font>
    );
  });
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <Font
              key={i}
              tag="secondaryMedium"
              style={{
                fontSize: 13.5,
                color: colors.textPrimary,
                marginTop: 8,
                marginBottom: 2,
              }}
            >
              {line.slice(4)}
            </Font>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <View key={i} className="flex-row" style={{ paddingLeft: 8 }}>
              <Font
                tag="secondary"
                style={{ fontSize: 13.5, color: colors.textPrimary }}
              >
                {'• '}
              </Font>
              <View className="flex-1 flex-row flex-wrap">
                {renderInlineBold(line.slice(2))}
              </View>
            </View>
          );
        }
        if (line === '') {
          return <View key={i} style={{ height: 6 }} />;
        }
        return (
          <View key={i} className="flex-row flex-wrap">
            {renderInlineBold(line)}
          </View>
        );
      })}
    </View>
  );
}

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
}: Props) {
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
        {msg.stage ? (
          <View
            className="self-start rounded-md px-2 py-0.5 mb-1"
            style={{ backgroundColor: colors.fillAccentSub }}
          >
            <Font
              tag="secondaryMedium"
              style={{ fontSize: 11, color: colors.fillAccent }}
            >
              {stageLabel[msg.stage] ?? msg.stage}
            </Font>
          </View>
        ) : null}
        {showDebug && <DebugPanel debug={msg.debug} />}
        {msg.content.map((block, i) => {
          if (block.type === 'TEXT') {
            return (
              <View
                key={i}
                className="rounded-[16px] px-3.5 py-2.5 mb-1.5 border border-border"
                style={{
                  backgroundColor: colors.surfaceRaised,
                  borderTopLeftRadius: 3,
                }}
              >
                <SimpleMarkdown text={block.data.text} />
              </View>
            );
          }
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
    </View>
  );
}
