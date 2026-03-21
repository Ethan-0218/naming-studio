import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Font } from '@/components/Font';
import { colors } from '@/design-system';
import { ChoiceGroupData } from '../types';

interface Props {
  data: ChoiceGroupData;
  onSend: (text: string) => void;
  submitted: boolean;
}

export default function ChoiceGroupBlock({ data, onSend, submitted }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [done, setDone] = useState(submitted);

  function toggleChoice(choice: string) {
    if (done) return;
    if (data.multi) {
      setSelected((prev) => {
        if (prev.includes(choice)) return prev.filter((c) => c !== choice);
        if (data.max_select && prev.length >= data.max_select) return prev;
        return [...prev, choice];
      });
      setCustomText('');
    } else {
      if (data.follow_up && choice === data.follow_up.trigger) {
        setSelected([choice]);
        setShowFollowUp(true);
      } else {
        setSelected([choice]);
        setDone(true);
        onSend(choice);
      }
    }
  }

  function submitMulti() {
    if (done) return;
    const parts = [...selected];
    if (customText.trim()) parts.push(customText.trim());
    const msg = parts.length > 0 ? parts.join(', ') : '상관없어요';
    setDone(true);
    onSend(msg);
  }

  function submitFollowUp() {
    if (done) return;
    const msg = followUpText.trim()
      ? `${selected[0]}: ${followUpText.trim()}`
      : selected[0];
    setDone(true);
    onSend(msg);
  }

  return (
    <View
      className="rounded-[14px] p-3.5 mb-2 w-full border border-border"
      style={{
        backgroundColor: colors.surface,
        opacity: done ? 0.6 : 1,
      }}
    >
      <Font
        tag="secondaryMedium"
        style={{ fontSize: 13, color: colors.textPrimary, marginBottom: 10 }}
      >
        {data.question}
      </Font>
      <View className="flex-row flex-wrap gap-2">
        {data.choices.map((choice) => (
          <Pressable
            key={choice}
            className="rounded-full px-3.5 py-2 border-[1.5px]"
            style={{
              borderColor: selected.includes(choice)
                ? colors.fillBold
                : colors.border,
              backgroundColor: selected.includes(choice)
                ? colors.fillBold
                : colors.surfaceRaised,
            }}
            onPress={() => toggleChoice(choice)}
          >
            <Font
              tag={selected.includes(choice) ? 'secondaryMedium' : 'secondary'}
              style={{
                fontSize: 13,
                color: selected.includes(choice)
                  ? '#fff'
                  : colors.textSecondary,
              }}
            >
              {choice}
            </Font>
          </Pressable>
        ))}
        {data.allow_custom && !done && (
          <View className="flex-row items-center mt-2 w-full">
            <TextInput
              className="flex-1 border border-border rounded-[10px] px-3 py-1.5 bg-surfaceRaised"
              style={{ fontSize: 13, color: colors.textPrimary }}
              value={customText}
              onChangeText={(text) => {
                setCustomText(text);
                if (text.trim()) setSelected([]);
              }}
              placeholder="직접 입력"
              placeholderTextColor={colors.textDisabled}
            />
          </View>
        )}
      </View>
      {showFollowUp && !done && data.follow_up && (
        <View className="flex-row items-center mt-2.5 gap-2">
          <TextInput
            className="flex-1 border border-border rounded-[10px] px-3 py-2 bg-surfaceRaised"
            style={{ fontSize: 13, color: colors.textPrimary }}
            value={followUpText}
            onChangeText={setFollowUpText}
            placeholder={data.follow_up.placeholder}
            placeholderTextColor={colors.textDisabled}
            autoFocus
          />
          <Pressable
            className="rounded-[10px] px-3.5 py-2"
            style={{ backgroundColor: colors.fillBold }}
            onPress={submitFollowUp}
          >
            <Font tag="secondaryMedium" style={{ fontSize: 13, color: '#fff' }}>
              완료
            </Font>
          </Pressable>
        </View>
      )}
      {data.multi && !done && (
        <Pressable
          className="mt-3 rounded-[10px] px-5 py-2.5 self-end"
          style={{ backgroundColor: colors.fillBold }}
          onPress={submitMulti}
        >
          <Font tag="secondaryMedium" style={{ fontSize: 14, color: '#fff' }}>
            선택 완료
          </Font>
        </Pressable>
      )}
      {done && selected.length > 0 && (
        <Font
          tag="secondary"
          style={{ fontSize: 12, color: colors.textTertiary, marginTop: 8 }}
        >
          선택: {selected.join(', ')}
        </Font>
      )}
    </View>
  );
}
