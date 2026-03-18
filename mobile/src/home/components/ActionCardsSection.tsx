import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { primitives } from '@/design-system';

interface Props {
  onAINaming: () => void;
  onSelfNaming: () => void;
}

export default function ActionCardsSection({ onAINaming, onSelfNaming }: Props) {
  return (
    <View className="px-4 pt-5">
      <Text
        className="font-sansRegular text-textTertiary mb-3 px-1"
        style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}
      >
        시작하기
      </Text>

      <View className="gap-2.5">
        {/* AI Card */}
        <Pressable
          style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
          onPress={onAINaming}
        >
          <View className="bg-fillBold rounded-[18px] overflow-hidden p-[22px]">
            <View className="flex-row items-center gap-1 bg-fillAccent rounded-full py-[3px] px-[9px] self-start mb-[14px]">
              <Ionicons name="sparkles" size={10} color="#fff" />
              <Text className="font-sansMedium" style={{ fontSize: 10, color: '#fff', letterSpacing: 0.8 }}>
                AI 추천
              </Text>
            </View>
            <Text
              className="font-serif-medium text-textInverse mb-2"
              style={{ fontSize: 20, letterSpacing: 1, lineHeight: 27 }}
            >
              {'AI와 함께\n작명하기'}
            </Text>
            <Text
              className="font-sansRegular mb-[18px]"
              style={{ fontSize: 12, color: 'rgba(251,247,238,0.6)', lineHeight: 20 }}
            >
              {'성씨와 조건을 입력하면 AI가 오행·수리를\n종합해 최적의 이름을 추천해 드립니다.'}
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5 bg-fillAccent rounded-full py-[9px] px-[18px]">
                <Text className="font-sansMedium" style={{ fontSize: 13, color: '#fff', letterSpacing: 0.2 }}>
                  시작하기
                </Text>
                <Ionicons name="arrow-forward" size={13} color="#fff" />
              </View>
              <Text
                className="font-serif"
                style={{ fontSize: 48, color: 'rgba(255,255,255,0.07)', lineHeight: 48, letterSpacing: -2 }}
              >
                作名
              </Text>
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
              <Text className="font-serif-medium text-textSecondary" style={{ fontSize: 20 }}>分</Text>
            </View>
            <View className="flex-1">
              <Text
                className="font-serif-medium text-textPrimary mb-[3px]"
                style={{ fontSize: 16, letterSpacing: 0.5 }}
              >
                스스로 작명하기
              </Text>
              <Text className="font-sansRegular text-textTertiary" style={{ fontSize: 12, lineHeight: 19 }}>
                이름을 직접 입력하고 상세 분석을 받아보세요.
              </Text>
            </View>
            <View className="w-7 h-7 rounded-full bg-surface border border-border items-center justify-center shrink-0">
              <Ionicons name="chevron-forward" size={14} color={primitives.ink500} />
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
