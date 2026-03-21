import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
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
import SuriDetailSheet from './SuriDetailSheet';

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

interface SuriCardProps {
  label: string;
  entry: SuriEntry;
  onPress: () => void;
}

function SuriCard({ label, entry, onPress }: SuriCardProps) {
  const color = LEVEL_COLOR[entry.level];
  return (
    <Pressable
      className="w-[47%] bg-surface rounded-md p-3 border border-border"
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
      onPress={onPress}
    >
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
    </Pressable>
  );
}

const GYEOK_LABELS: {
  key: keyof Omit<SurigyeokResult, 'totalScore'>;
  label: string;
}[] = [
  { key: 'wongyeok', label: '원격 (元格)' },
  { key: 'hyeongyeok', label: '형격 (亨格)' },
  { key: 'igyeok', label: '이격 (利格)' },
  { key: 'jeongyeok', label: '정격 (貞格)' },
];

export default function SurigyeokSection({ nameInput, gender, result }: Props) {
  const [selected, setSelected] = useState<{
    label: string;
    entry: SuriEntry;
  } | null>(null);

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
    <>
      <SectionCard title="수리격" badge={badge} badgeColor={badgeColor}>
        {computed ? (
          <View className="flex-row flex-wrap gap-2">
            {GYEOK_LABELS.map(({ key, label }) => (
              <SuriCard
                key={key}
                label={label.split(' ')[0]}
                entry={computed[key]}
                onPress={() => setSelected({ label, entry: computed[key] })}
              />
            ))}
          </View>
        ) : (
          <Font
            tag="secondary"
            className="text-bodySm text-textTertiary text-center py-4"
          >
            한자를 모두 선택하면 수리격이 계산됩니다
          </Font>
        )}
      </SectionCard>

      <SuriDetailSheet
        visible={selected !== null}
        onClose={() => setSelected(null)}
        label={selected?.label ?? ''}
        entry={selected?.entry ?? null}
      />
    </>
  );
}
