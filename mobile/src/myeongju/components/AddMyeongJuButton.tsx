import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onPress?: () => void;
}

export default function AddMyeongJuButton({ onPress }: Props) {
  return (
    <View className="p-4 pb-[14px] border-b border-border">
      <Pressable
        className="flex-row items-center gap-2.5 bg-fillBold rounded-[14px] p-[14px] px-[18px]"
        style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
        onPress={onPress}
      >
        <View className="w-[26px] h-[26px] rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
          <Ionicons name="add" size={16} color="rgba(255,255,255,0.85)" />
        </View>
        <View className="flex-1">
          <Text
            className="font-serif-medium text-textInverse"
            style={{ fontSize: 15, letterSpacing: 0.5 }}
          >
            새 명주 추가
          </Text>
          <Text
            className="font-sansRegular mt-0.5"
            style={{ fontSize: 11, color: 'rgba(251,247,238,0.4)', letterSpacing: 0.4 }}
          >
            사주·성별 정보로 등록
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.30)" />
      </Pressable>
    </View>
  );
}
