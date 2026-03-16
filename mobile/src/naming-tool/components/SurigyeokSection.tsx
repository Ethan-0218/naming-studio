import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, textStyles, spacing, radius } from '@/design-system';
import { NameInput, SuriEntry, SurigyeokResult, SuriLevel, Gender } from '../types';
import { computeSurigyeok } from '../domain/surigyeok';
import SectionCard from './SectionCard';

interface Props {
  nameInput: NameInput;
  gender: Gender;
  result: SurigyeokResult | null;
}

const LEVEL_COLOR: Record<SuriLevel, string> = {
  '大吉': colors.positive,
  '吉': colors.positive,
  '中吉': colors.fillAccent,
  '中凶': colors.warning,
  '凶': colors.negative,
  '大凶': colors.negative,
};

function SuriCard({ label, entry }: { label: string; entry: SuriEntry }) {
  const color = LEVEL_COLOR[entry.level];
  return (
    <View style={styles.suriCard}>
      <Text style={[textStyles.overline, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[textStyles.numeralMd, { color, marginTop: spacing['1'] }]}>{entry.number}</Text>
      <Text style={[textStyles.uiSm, { color: colors.textPrimary, marginTop: spacing['1'] }]}>
        {entry.name1}
      </Text>
      <View style={[styles.levelBadge, { borderColor: color }]}>
        <Text style={[textStyles.overline, { color }]}>{entry.level}</Text>
      </View>
      <Text style={[textStyles.bodySm, { color: colors.textTertiary, marginTop: spacing['1'] }]} numberOfLines={2}>
        {entry.easyInterpretation}
      </Text>
    </View>
  );
}

export default function SurigyeokSection({ nameInput, gender, result }: Props) {
  const computed = result ?? (
    nameInput.surname.strokeCount != null && nameInput.first1.strokeCount != null
      ? computeSurigyeok(
          nameInput.surname.strokeCount,
          nameInput.first1.strokeCount,
          nameInput.first2.strokeCount,
          gender,
        )
      : null
  );

  const badge = computed ? `총 ${computed.totalScore}점` : undefined;

  return (
    <SectionCard title="수리격" badge={badge} badgeColor={computed ? (computed.totalScore >= 24 ? colors.positive : colors.warning) : undefined}>
      {computed ? (
        <View style={styles.grid}>
          <SuriCard label="원격" entry={computed.wongyeok} />
          <SuriCard label="형격" entry={computed.hyeongyeok} />
          <SuriCard label="이격" entry={computed.igyeok} />
          <SuriCard label="정격" entry={computed.jeongyeok} />
        </View>
      ) : (
        <Text style={[textStyles.bodySm, { color: colors.textDisabled, textAlign: 'center', paddingVertical: spacing['4'] }]}>
          한자의 획수를 모두 입력하면 수리격이 계산됩니다
        </Text>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['2'],
  },
  suriCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing['3'],
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['2'],
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    marginTop: spacing['1'],
  },
});
