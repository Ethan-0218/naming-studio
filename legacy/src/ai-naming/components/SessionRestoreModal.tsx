import React, { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { Font } from '@/components/Font';
import { colors } from '@/design-system';

interface Props {
  visible: boolean;
  onClose: () => void;
  onRestore: (id: string) => void;
}

export default function SessionRestoreModal({
  visible,
  onClose,
  onRestore,
}: Props) {
  const [inputId, setInputId] = useState('');

  function handleConfirm() {
    const trimmed = inputId.trim();
    if (!trimmed) return;
    onRestore(trimmed);
    setInputId('');
  }

  function handleClose() {
    setInputId('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={handleClose} />
      <View
        className="bg-surfaceRaised rounded-t-3xl px-5 pt-3"
        style={{ maxHeight: '40%' }}
      >
        <View className="w-10 h-1 bg-border rounded-sm self-center mb-4" />
        <View className="flex-row items-center justify-between mb-1">
          <Font
            tag="primaryMedium"
            style={{ fontSize: 20, color: colors.textPrimary }}
          >
            세션 불러오기
          </Font>
          <Pressable className="p-1.5" onPress={handleClose}>
            <Font
              tag="secondary"
              style={{ fontSize: 18, color: colors.textDisabled }}
            >
              ✕
            </Font>
          </Pressable>
        </View>
        <Font
          tag="secondary"
          style={{
            fontSize: 13,
            color: colors.textTertiary,
            lineHeight: 18,
            marginBottom: 20,
          }}
        >
          이전 대화의 session_id를 입력하면 해당 세션을 이어서 진행합니다
        </Font>
        <View className="mb-[18px]">
          <TextInput
            className="border-[1.5px] border-border rounded-[10px] px-3 py-2.5 bg-surface"
            style={{ fontSize: 15, color: colors.textPrimary }}
            value={inputId}
            onChangeText={setInputId}
            placeholder="session_id를 붙여넣으세요"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />
        </View>
        <Pressable
          className="rounded-xl py-4 items-center mt-2"
          style={{
            backgroundColor: inputId.trim() ? colors.fillBold : colors.border,
          }}
          onPress={handleConfirm}
          disabled={!inputId.trim()}
        >
          <Font tag="secondaryMedium" style={{ fontSize: 16, color: '#fff' }}>
            불러오기 →
          </Font>
        </Pressable>
        <View style={{ height: 32 }} />
      </View>
    </Modal>
  );
}
