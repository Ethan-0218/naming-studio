import React from 'react';
import { View, Pressable } from 'react-native';
import { Font } from '@/components/Font';

interface Props {
  onSubmit: () => void;
  disabled?: boolean;
}

export default function AddMyeongJuFooter({ onSubmit, disabled }: Props) {
  return (
    <View className="px-5 pt-3 pb-[14px] bg-bgSubtle border-t border-border">
      <Pressable
        disabled={disabled}
        className="items-center justify-center bg-fillBold rounded-[16px] h-[52px]"
        style={({ pressed }) => ({
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        })}
        onPress={onSubmit}
      >
        <Font
          tag="primaryMedium"
          className="text-textInverse"
          style={{ fontSize: 16, letterSpacing: 0.5 }}
        >
          명주 등록하기
        </Font>
      </Pressable>
    </View>
  );
}
