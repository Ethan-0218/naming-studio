import React, { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { Font } from '@/components/Font';
import { colors } from '@/design-system';

const LIKE_REASONS = [
  { key: 'pronunciation', label: '발음이 좋아요' },
  { key: 'vibe', label: '분위기가 좋아요' },
  { key: 'meaning', label: '뜻이 좋아요' },
  { key: 'surname_harmony', label: '성과 잘 어울려요' },
  { key: 'rarity', label: '너무 흔하지 않아요' },
  { key: 'other', label: '기타' },
];
const DISLIKE_REASONS = [
  { key: 'pronunciation', label: '발음이 별로예요' },
  { key: 'rarity', label: '너무 흔해요' },
  { key: 'vibe', label: '너무 낯설어요' },
  { key: 'meaning', label: '뜻이 마음에 안 들어요' },
  { key: 'surname_harmony', label: '성과 어울리지 않아요' },
  { key: 'other', label: '기타' },
];

interface Props {
  visible: boolean;
  name: string;
  type: 'liked' | 'disliked';
  onSubmit: (keys: string[]) => void;
  onSkip: () => void;
}

export default function ReasonPicker({
  visible,
  name,
  type,
  onSubmit,
  onSkip,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const reasons = type === 'liked' ? LIKE_REASONS : DISLIKE_REASONS;
  const emoji = type === 'liked' ? '👍' : '👎';
  const otherSelected = selected.includes('other');

  function toggle(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
    if (key === 'other') setOtherText('');
  }

  function handleSubmit() {
    const keys = selected.map((k) =>
      k === 'other' && otherText.trim() ? `other:${otherText.trim()}` : k,
    );
    onSubmit(keys);
    setSelected([]);
    setOtherText('');
  }

  function handleSkip() {
    setSelected([]);
    setOtherText('');
    onSkip();
  }

  const canSubmit =
    selected.length > 0 &&
    (!otherSelected || otherText.trim().length > 0 || selected.length > 1);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleSkip}
    >
      <Pressable className="flex-1 bg-black/40" onPress={handleSkip} />
      <View
        className="bg-surfaceRaised rounded-t-3xl px-5 pt-3"
        style={{ maxHeight: '65%' }}
      >
        <View className="w-10 h-1 bg-border rounded-sm self-center mb-4" />
        <View className="flex-row items-center justify-between mb-4">
          <Font
            tag="primaryMedium"
            style={{ fontSize: 17, color: colors.textPrimary, flex: 1 }}
          >
            {emoji} "{name}" 이름이 {type === 'liked' ? '좋은' : '별로인'}{' '}
            이유가 있나요?
          </Font>
          <Pressable className="p-1.5" onPress={handleSkip}>
            <Font
              tag="secondary"
              style={{ fontSize: 14, color: colors.textDisabled }}
            >
              건너뛰기
            </Font>
          </Pressable>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {reasons.map((r) => (
            <Pressable
              key={r.key}
              className="rounded-full px-3.5 py-2 border-[1.5px]"
              style={{
                borderColor: selected.includes(r.key)
                  ? colors.fillBold
                  : colors.border,
                backgroundColor: selected.includes(r.key)
                  ? colors.fillBold
                  : colors.surfaceRaised,
              }}
              onPress={() => toggle(r.key)}
            >
              <Font
                tag={selected.includes(r.key) ? 'secondaryMedium' : 'secondary'}
                style={{
                  fontSize: 13,
                  color: selected.includes(r.key)
                    ? '#fff'
                    : colors.textSecondary,
                }}
              >
                {r.label}
              </Font>
            </Pressable>
          ))}
        </View>
        {otherSelected && (
          <TextInput
            className="border border-border rounded-[10px] px-3 py-2 bg-surfaceRaised mt-2 mx-0"
            style={{
              fontSize: 13,
              color: colors.textPrimary,
              marginHorizontal: 0,
              marginTop: 8,
            }}
            placeholder="직접 입력해주세요"
            placeholderTextColor={colors.textDisabled}
            value={otherText}
            onChangeText={setOtherText}
            maxLength={100}
            returnKeyType="done"
          />
        )}
        <Pressable
          className="rounded-xl py-4 items-center mt-3"
          style={{
            backgroundColor: canSubmit ? colors.fillBold : colors.border,
          }}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Font tag="secondaryMedium" style={{ fontSize: 16, color: '#fff' }}>
            {selected.length === 0
              ? '선택 후 전달하기'
              : `이유 전달하기 (${selected.length}개)`}
          </Font>
        </Pressable>
        <View style={{ height: 16 }} />
      </View>
    </Modal>
  );
}
