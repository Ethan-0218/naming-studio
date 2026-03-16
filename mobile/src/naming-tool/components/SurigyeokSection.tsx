import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, textStyles, spacing, radius } from '@/design-system';
import { NameInput, SuriEntry, SurigyeokResult, SuriLevel, Gender } from '../types';
import { computeSurigyeok } from '../domain/surigyeok';
import SectionCard from './SectionCard';

interface Props {
  nameInput: NameInput;
  gender: Gender;
  result: SurigyeokResult | null;
}

const LEVEL_COLOR: Record<SuriLevel, string> = {
  '大吉': palette.teal,
  '吉': palette.teal,
  '中吉': palette.gold,
  '中凶': palette.amber,
  '凶': palette.vermillion,
  '大凶': palette.vermillion,
};

function SuriCard({ label, entry }: { label: string; entry: SuriEntry }) {
  const color = LEVEL_COLOR[entry.level];
  return (
    <View style={styles.suriCard}>
      <Text style={[textStyles.overline, { color: palette.inkLight }]}>{label}</Text>
      <Text style={[textStyles.numeralMd, { color, marginTop: spacing['1'] }]}>{entry.number}</Text>
      <Text style={[textStyles.uiSm, { color: palette.ink, marginTop: spacing['1'] }]}>
        {entry.name1}
      </Text>
      <View style={[styles.levelBadge, { borderColor: color }]}>
        <Text style={[textStyles.overline, { color }]}>{entry.level}</Text>
      </View>
      <Text style={[textStyles.bodySm, { color: palette.inkLight, marginTop: spacing['1'] }]} numberOfLines={2}>
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
    <SectionCard title="수리격" badge={badge} badgeColor={computed ? (computed.totalScore >= 24 ? palette.teal : palette.gold) : undefined}>
      {computed ? (
        <View style={styles.grid}>
          <SuriCard label="원격" entry={computed.wongyeok} />
          <SuriCard label="형격" entry={computed.hyeongyeok} />
          <SuriCard label="이격" entry={computed.igyeok} />
          <SuriCard label="정격" entry={computed.jeongyeok} />
        </View>
      ) : (
        <Text style={[textStyles.bodySm, { color: palette.inkFaint, textAlign: 'center', paddingVertical: spacing['4'] }]}>
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
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing['3'],
    borderWidth: 1,
    borderColor: palette.border,
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
