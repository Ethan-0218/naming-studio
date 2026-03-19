import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Font } from '@/components/Font';
import { colors } from '@/design-system';
import HanjaSearchField, {
  SelectedHanja,
} from '@/shared/components/HanjaSearchField';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (selected: SelectedHanja) => void;
  loading: boolean;
}

export default function DolrimjaModal({
  visible,
  onClose,
  onSubmit,
  loading,
}: Props) {
  const [selected, setSelected] = useState<SelectedHanja | null>(null);

  function handleClose() {
    setSelected(null);
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
        style={{ maxHeight: '60%' }}
      >
        <View className="w-10 h-1 bg-border rounded-sm self-center mb-4" />
        <View className="flex-row items-center justify-between mb-1">
          <Font
            tag="primaryMedium"
            style={{ fontSize: 20, color: colors.textPrimary }}
          >
            돌림자 변경
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
          새로운 돌림자를 검색해서 선택해주세요
        </Font>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-[18px]">
            <HanjaSearchField
              selected={selected}
              onSelect={setSelected}
              onClear={() => setSelected(null)}
              endpoint="/api/hanja-search"
              placeholder="돌림자 검색 (예: 준, 현, 민)"
              chipSuffix="자"
            />
          </View>
          <Pressable
            className="rounded-xl py-4 items-center mt-2"
            style={{
              backgroundColor:
                !selected || loading ? colors.border : colors.fillBold,
            }}
            onPress={() => selected && onSubmit(selected)}
            disabled={!selected || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Font
                tag="secondaryMedium"
                style={{ fontSize: 16, color: '#fff' }}
              >
                돌림자 변경하기
              </Font>
            )}
          </Pressable>
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}
