import React, { useEffect, useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import clsx from 'clsx';
import { colors, fontFamily } from '@/design-system';
import { HanjaSelection, Gender, NameInput, NamingAnalysis } from '../types';
import HanjaSlotInput from './HanjaSlotInput';
import ScoreSummarySection from './ScoreSummarySection';
import { useHanjaSearch } from '../hooks/useHanjaSearch';

type SlotKey = 'surname' | 'first1' | 'first2';

interface Props {
  analysis: NamingAnalysis;
  nameInput: NameInput;
  onUpdateHangul: (slot: SlotKey, hangul: string) => void;
  onUpdateHanja: (slot: SlotKey, selection: HanjaSelection) => void;
  gender: Gender;
  onGenderChange: (g: Gender) => void;
}

const SLOT_LABELS = { surname: '성', first1: '첫째', first2: '둘째' } as const;
const SLOTS: SlotKey[] = ['surname', 'first1', 'first2'];

export default function NameInputSection({
  analysis,
  nameInput,
  onUpdateHangul,
  onUpdateHanja,
  gender,
  onGenderChange,
}: Props) {
  const { results: surnameResults, search: searchSurname, activeQuery: surnameActiveQuery, hasResults: surnameHasResults } = useHanjaSearch('surname');
  const autoSelectPending = useRef(false);
  const surnameSearchedFor = useRef('');

  useEffect(() => {
    if (!autoSelectPending.current) return;
    // 현재 기다리는 쿼리에 대한 결과가 fetch 완료된 경우에만 처리.
    // 이전 쿼리의 stale 결과가 도착하거나 fetch 중인 빈 결과가
    // autoSelectPending을 잘못 리셋하는 타이밍 이슈를 방지한다.
    if (!surnameHasResults || surnameActiveQuery !== surnameSearchedFor.current) return;

    if (surnameResults.length === 1) {
      const r = surnameResults[0];
      onUpdateHanja('surname', {
        forHangul: surnameSearchedFor.current,
        hanja: r.hanja,
        mean: r.mean,
        strokeCount: r.strokeCount,
        charOhaeng: r.charOhaeng,
        soundEumyang: r.soundEumyang,
        strokeEumyang: r.strokeEumyang,
      });
    }
    autoSelectPending.current = false;
  }, [surnameResults, surnameActiveQuery, surnameHasResults]);

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
                    onUpdateHangul(slot, last);
                    if (slot === 'surname') {
                      if (last) {
                        autoSelectPending.current = true;
                        surnameSearchedFor.current = last;
                        searchSurname(last);
                      } else {
                        autoSelectPending.current = false;
                      }
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
                  onUpdateHanja={(sel) => onUpdateHanja(slot, sel)}
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
