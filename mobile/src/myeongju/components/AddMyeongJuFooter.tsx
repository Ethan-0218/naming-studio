import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Font } from '@/components/Font';

interface Props {
  onSubmit: () => void;
}

export default function AddMyeongJuFooter({ onSubmit }: Props) {
  return (
    <View className="px-5 pt-3 pb-[14px] bg-bgSubtle border-t border-border">
      <Pressable
        className="flex-row items-center justify-center gap-2 bg-fillBold rounded-[16px] h-[52px]"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        onPress={onSubmit}
      >
        <Font
          tag="primaryMedium"
          className="text-textInverse"
          style={{ fontSize: 16, letterSpacing: 0.5 }}
        >
          명주 등록하기
        </Font>
        <Ionicons name="chevron-forward" size={18} color="rgba(251,247,238,0.5)" />
      </Pressable>
    </View>
  );
}
