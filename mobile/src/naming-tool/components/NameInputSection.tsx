import { Font, FONT_MAP } from '@/components/Font';
import { colors } from '@/design-system';
import React, { useEffect, useRef } from 'react';
import { TextInput, View } from 'react-native';
import { useHanjaSearch } from '../hooks/useHanjaSearch';
import { HanjaSelection, NameInput, NamingAnalysis } from '../types';
import HanjaSlotInput from './HanjaSlotInput';
import ScoreSummarySection from './ScoreSummarySection';

type SlotKey = 'surname' | 'first1' | 'first2';

interface Props {
  analysis: NamingAnalysis;
  nameInput: NameInput;
  onUpdateHangul: (slot: SlotKey, hangul: string) => void;
  onUpdateHanja: (slot: SlotKey, selection: HanjaSelection) => void;
  lockedSurname?: { hangul: string; hanja: string };
}

const SLOT_LABELS = { surname: '성', first1: '첫째', first2: '둘째' } as const;
const SLOTS: SlotKey[] = ['surname', 'first1', 'first2'];

function NameInputSection({
  analysis,
  nameInput,
  onUpdateHangul,
  onUpdateHanja,
  lockedSurname,
}: Props) {
  const {
    results: surnameResults,
    search: searchSurname,
    activeQuery: surnameActiveQuery,
    hasResults: surnameHasResults,
  } = useHanjaSearch('surname');
  const autoSelectPending = useRef(false);
  const surnameSearchedFor = useRef('');

  // lockedSurname이 변경될 때 성씨 자동 입력 + 한자 검색 시작
  useEffect(() => {
    if (!lockedSurname) return;
    onUpdateHangul('surname', lockedSurname.hangul);
    if (lockedSurname.hangul) {
      autoSelectPending.current = true;
      surnameSearchedFor.current = lockedSurname.hangul;
      searchSurname(lockedSurname.hangul);
    }
  }, [lockedSurname?.hangul, lockedSurname?.hanja]);

  useEffect(() => {
    if (!autoSelectPending.current) return;
    if (!surnameHasResults || surnameActiveQuery !== surnameSearchedFor.current)
      return;

    if (lockedSurname) {
      // locked 모드: profile의 hanja와 일치하는 결과를 우선 선택
      const match = surnameResults.find((r) => r.hanja === lockedSurname.hanja);
      const r =
        match ?? (surnameResults.length === 1 ? surnameResults[0] : null);
      if (r) {
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
    } else if (surnameResults.length === 1) {
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
        <Font tag="primaryMedium" className="text-heading text-textPrimary">
          이름 입력
        </Font>
      </View>

      <View
        className="bg-surfaceRaised rounded-lg p-4 border border-border"
        style={{ gap: 12 }}
      >
        <View style={{ gap: 4 }}>
          <Font
            tag="secondaryMedium"
            className="text-serifLabel text-textSecondary uppercase"
          >
            한 글
          </Font>
          <View className="flex-row items-stretch" style={{ gap: 8 }}>
            {SLOTS.map((slot, index) => (
              <View
                key={slot}
                className="flex-1 min-w-0 items-center"
                style={{ gap: 4 }}
              >
                <Font
                  tag="secondaryMedium"
                  className="text-label text-textTertiary uppercase"
                >
                  {SLOT_LABELS[slot]}
                </Font>
                <TextInput
                  className="w-full rounded-md border border-border bg-bg text-center"
                  style={{
                    height: 54,
                    borderWidth: 1.5,
                    fontFamily: FONT_MAP.primaryMedium,
                    fontSize: 24,
                    lineHeight: 32,
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
                  placeholder="-"
                  placeholderTextColor={colors.textDisabled}
                  maxLength={2}
                  textAlign="center"
                  editable={index !== 0 || !lockedSurname}
                />
              </View>
            ))}
          </View>
        </View>

        <View className="h-px bg-border" />

        <View style={{ gap: 4 }}>
          <Font
            tag="secondaryMedium"
            className="text-serifLabel text-textSecondary uppercase"
          >
            한 자
          </Font>
          <View className="flex-row items-stretch" style={{ gap: 8 }}>
            {SLOTS.map((slot) => (
              <View key={slot} className="flex-1 min-w-0">
                <HanjaSlotInput
                  label={SLOT_LABELS[slot]}
                  hangul={nameInput[slot].hangul}
                  value={nameInput[slot]}
                  onUpdateHanja={(sel) => onUpdateHanja(slot, sel)}
                  role={slot === 'surname' ? 'surname' : 'name'}
                  disabled={slot === 'surname' && !!lockedSurname}
                />
              </View>
            ))}
          </View>
        </View>

        <ScoreSummarySection
          score={analysis.totalScore}
          ohaengScore={analysis.ohaengScore}
          suriScore={analysis.suriScore}
          eumyangScore={analysis.eumyangScore}
        />
      </View>
    </View>
  );
}

export default React.memo(NameInputSection);
