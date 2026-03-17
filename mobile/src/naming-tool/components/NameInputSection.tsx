import React, { useEffect, useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import clsx from 'clsx';
import { colors, fontFamily } from '@/design-system';
import { CharSlotData, Gender, NameInput, NamingAnalysis } from '../types';
import HanjaSlotInput from './HanjaSlotInput';
import ScoreSummarySection from './ScoreSummarySection';
import { useHanjaSearch } from '../hooks/useHanjaSearch';

interface Props {
  analysis: NamingAnalysis;
  nameInput: NameInput;
  onUpdate: (slot: 'surname' | 'first1' | 'first2', data: Partial<CharSlotData>) => void;
  gender: Gender;
  onGenderChange: (g: Gender) => void;
}

const SLOT_LABELS = { surname: '성', first1: '첫째', first2: '둘째' } as const;
type SlotKey = 'surname' | 'first1' | 'first2';
const SLOTS: SlotKey[] = ['surname', 'first1', 'first2'];

export default function NameInputSection({
  analysis,
  nameInput,
  onUpdate,
  gender,
  onGenderChange,
}: Props) {
  const { results: surnameResults, search: searchSurname } = useHanjaSearch('surname');
  const autoSelectPending = useRef(false);

  useEffect(() => {
    if (autoSelectPending.current && surnameResults.length === 1) {
      const r = surnameResults[0];
      onUpdate('surname', {
        hanja: r.hanja,
        mean: r.mean,
        strokeCount: r.strokeCount,
        charOhaeng: r.charOhaeng,
        baleumOhaeng: r.baleumOhaeng,
        soundEumyang: r.soundEumyang,
        strokeEumyang: r.strokeEumyang,
      });
    }
    autoSelectPending.current = false;
  }, [surnameResults]);

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-heading text-textPrimary"
          style={{ fontFamily: fontFamily.serifMedium }}
        >
          이름 입력
        </Text>
        <View className="flex-row gap-1">
          {(['male', 'female'] as Gender[]).map((g) => (
            <Pressable
              key={g}
              className={clsx(
                'px-3 py-1 rounded-full border',
                gender === g ? 'bg-textSecondary border-textSecondary' : 'border-border',
              )}
              onPress={() => onGenderChange(g)}
            >
              <Text
                className="text-label"
                style={{
                  fontFamily: fontFamily.sansMedium,
                  color: gender === g ? colors.textInverse : colors.textSecondary,
                }}
              >
                {g === 'male' ? '남' : '여'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="bg-surfaceRaised rounded-lg p-4 border border-border" style={{ gap: 12 }}>
        <View style={{ gap: 4 }}>
          <Text
            className="text-overline text-textTertiary uppercase"
            style={{ fontFamily: fontFamily.sansMedium }}
          >
            한 글
          </Text>
          <View className="flex-row items-stretch" style={{ gap: 8 }}>
            {SLOTS.map((slot) => (
              <View key={slot} className="flex-1 min-w-0 items-center" style={{ gap: 4 }}>
                <Text
                  className="text-overline text-textTertiary uppercase"
                  style={{ fontFamily: fontFamily.sansMedium }}
                >
                  {SLOT_LABELS[slot]}
                </Text>
                <TextInput
                  className="w-full rounded-md border border-border bg-bg text-center"
                  style={{
                    height: 54,
                    borderWidth: 1.5,
                    fontFamily: fontFamily.serifMedium,
                    fontSize: 24,
                    lineHeight: 24,
                    color: colors.textPrimary,
                  }}
                  value={nameInput[slot].hangul}
                  onChangeText={(text) => {
                    const last = text.slice(-1);
                    onUpdate(slot, { hangul: last });
                    if (slot === 'surname' && last) {
                      autoSelectPending.current = true;
                      searchSurname(last);
                    }
                  }}
                  placeholder="ㅡ"
                  placeholderTextColor={colors.textDisabled}
                  maxLength={2}
                  textAlign="center"
                />
              </View>
            ))}
          </View>
        </View>

        <View className="h-px bg-border" />

        <View style={{ gap: 4 }}>
          <Text
            className="text-overline text-textTertiary uppercase"
            style={{ fontFamily: fontFamily.sansMedium }}
          >
            한 자
          </Text>
          <View className="flex-row items-stretch" style={{ gap: 8 }}>
            {SLOTS.map((slot) => (
              <View key={slot} className="flex-1 min-w-0">
                <HanjaSlotInput
                  label={SLOT_LABELS[slot]}
                  hangul={nameInput[slot].hangul}
                  value={nameInput[slot]}
                  onUpdate={(d) => onUpdate(slot, d)}
                  role={slot === 'surname' ? 'surname' : 'name'}
                />
              </View>
            ))}
          </View>
        </View>

        <ScoreSummarySection score={analysis.totalScore} />
      </View>
    </View>
  );
}
