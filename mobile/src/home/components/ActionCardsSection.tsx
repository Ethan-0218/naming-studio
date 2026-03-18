import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { primitives } from '@/design-system';
import { Font } from '@/components/Font';

interface Props {
  onAINaming: () => void;
  onSelfNaming: () => void;
}

export default function ActionCardsSection({
  onAINaming,
  onSelfNaming,
}: Props) {
  return (
    <View className="px-4 pt-5">
      <Font
        tag="secondary"
        className="text-textTertiary mb-3 px-1"
        style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}
      >
        시작하기
      </Font>

      <View className="gap-2.5">
        {/* AI Card */}
        <Pressable
          style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
          onPress={onAINaming}
        >
          <View className="bg-fillBold rounded-[18px] overflow-hidden p-[22px]">
            <View className="flex-row items-center gap-1 bg-fillAccent rounded-full py-[3px] px-[9px] self-start mb-[14px]">
              <Ionicons name="sparkles" size={10} color="#fff" />
              <Font
                tag="secondaryMedium"
                style={{ fontSize: 12, color: '#fff', letterSpacing: 0.8 }}
              >
                AI 추천
              </Font>
            </View>
            <Font
              tag="primaryMedium"
              className="text-textInverse mb-2"
              style={{ fontSize: 20, letterSpacing: 1, lineHeight: 27 }}
            >
              {'AI와 함께\n작명하기'}
            </Font>
            <Font
              tag="secondary"
              className="mb-[18px]"
              style={{
                fontSize: 12,
                color: 'rgba(251,247,238,0.6)',
                lineHeight: 20,
              }}
            >
              {
                '성씨와 조건을 입력하면 AI가 오행·수리를\n종합해 최적의 이름을 추천해 드립니다.'
              }
            </Font>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5 bg-fillAccent rounded-full py-[9px] px-[18px]">
                <Font
                  tag="secondaryMedium"
                  style={{ fontSize: 13, color: '#fff', letterSpacing: 0.2 }}
                >
                  시작하기
                </Font>
                <Ionicons name="arrow-forward" size={13} color="#fff" />
              </View>
              <Font
                tag="primaryLight"
                style={{
                  fontSize: 48,
                  color: 'rgba(255,255,255,0.07)',
                  lineHeight: 48,
                  letterSpacing: -2,
                }}
              >
                作名
              </Font>
            </View>
          </View>
        </Pressable>

        {/* Self Card */}
        <Pressable
          style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
          onPress={onSelfNaming}
        >
          <View className="flex-row items-center gap-4 bg-surfaceRaised border border-border rounded-[18px] p-5">
            <View className="w-12 h-12 rounded-[14px] bg-surface border border-border items-center justify-center shrink-0">
              <Font
                tag="primaryMedium"
                className="text-textSecondary"
                style={{ fontSize: 20 }}
              >
                分
              </Font>
            </View>
            <View className="flex-1">
              <Font
                tag="primaryMedium"
                className="text-textPrimary mb-[3px]"
                style={{ fontSize: 16, letterSpacing: 0.5 }}
              >
                스스로 작명하기
              </Font>
              <Font
                tag="secondary"
                className="text-textTertiary"
                style={{ fontSize: 12, lineHeight: 19 }}
              >
                이름을 직접 입력하고 상세 분석을 받아보세요.
              </Font>
            </View>
            <View className="w-7 h-7 rounded-full bg-surface border border-border items-center justify-center shrink-0">
              <Ionicons
                name="chevron-forward"
                size={14}
                color={primitives.ink500}
              />
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
