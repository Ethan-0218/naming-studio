import React from 'react';
import { View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';
import {
  NameInput,
  SuriEntry,
  SurigyeokResult,
  SuriLevel,
  Gender,
} from '../types';
import { computeSurigyeok } from '../domain/surigyeok';
import SectionCard from './SectionCard';

interface Props {
  nameInput: NameInput;
  gender: Gender;
  result: SurigyeokResult | null;
}

const LEVEL_COLOR: Record<SuriLevel, string> = {
  大吉: colors.positive,
  吉: colors.positive,
  中吉: colors.fillAccent,
  中凶: colors.warning,
  凶: colors.negative,
  大凶: colors.negative,
};

function SuriCard({ label, entry }: { label: string; entry: SuriEntry }) {
  const color = LEVEL_COLOR[entry.level];
  return (
    <View className="w-[47%] bg-surface rounded-md p-3 border border-border">
      <Font
        tag="secondaryMedium"
        className="text-overline text-textTertiary uppercase"
      >
        {label}
      </Font>
      <Font
        tag="primaryMedium"
        className="text-numeralMd"
        style={{ color, marginTop: 4 }}
      >
        {entry.number}
      </Font>
      <Font tag="secondaryMedium" className="text-uiSm text-textPrimary mt-1">
        {entry.name1}
      </Font>
      <View
        className="self-start px-2 py-0.5 rounded-full border mt-1"
        style={{ borderColor: color }}
      >
        <Font
          tag="secondaryMedium"
          className="text-overline uppercase"
          style={{ color }}
        >
          {entry.level}
        </Font>
      </View>
      <Font
        tag="secondary"
        className="text-bodySm text-textTertiary mt-1"
        numberOfLines={2}
      >
        {entry.easyInterpretation}
      </Font>
    </View>
  );
}

export default function SurigyeokSection({ nameInput, gender, result }: Props) {
  const computed =
    result ??
    (nameInput.surname.strokeCount != null &&
    nameInput.first1.strokeCount != null
      ? computeSurigyeok(
          nameInput.surname.strokeCount,
          nameInput.first1.strokeCount,
          nameInput.first2.strokeCount,
          gender,
        )
      : null);

  function suriTotalLabel(score: number): string {
    if (score >= 0.8) return '매우좋음';
    if (score >= 0.6) return '좋음';
    if (score >= 0.4) return '보통';
    return '아쉬움';
  }
  function suriTotalColor(score: number): string {
    if (score >= 0.6) return colors.positive;
    if (score >= 0.4) return colors.fillAccent;
    return colors.negative;
  }

  const badge = computed ? suriTotalLabel(computed.totalScore) : undefined;
  const badgeColor = computed ? suriTotalColor(computed.totalScore) : undefined;

  return (
    <SectionCard title="수리격" badge={badge} badgeColor={badgeColor}>
      {computed ? (
        <View className="flex-row flex-wrap gap-2">
          <SuriCard label="원격" entry={computed.wongyeok} />
          <SuriCard label="형격" entry={computed.hyeongyeok} />
          <SuriCard label="이격" entry={computed.igyeok} />
          <SuriCard label="정격" entry={computed.jeongyeok} />
        </View>
      ) : (
        <Font
          tag="secondary"
          className="text-bodySm text-textDisabled text-center py-4"
        >
          한자의 획수를 모두 입력하면 수리격이 계산됩니다
        </Font>
      )}
    </SectionCard>
  );
}
