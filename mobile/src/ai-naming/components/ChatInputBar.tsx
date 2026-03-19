import React from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';

interface Props {
  input: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  canInput: boolean;
  loading: boolean;
  paddingBottom: number;
}

export default function ChatInputBar({
  input,
  onChangeText,
  onSend,
  canInput,
  loading,
  paddingBottom,
}: Props) {
  return (
    <View
      className="flex-row items-end gap-2 border-t border-border px-3 py-2.5"
      style={{
        backgroundColor: colors.bgSubtle,
        paddingBottom,
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
        onChangeText={onChangeText}
        placeholder="이름이에게 메시지를 보내세요"
        placeholderTextColor={colors.textDisabled}
        onSubmitEditing={onSend}
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
        onPress={onSend}
        disabled={!input.trim() || !canInput}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Font tag="secondaryMedium" style={{ fontSize: 15, color: '#fff' }}>
            ↑
          </Font>
        )}
      </Pressable>
    </View>
  );
}
