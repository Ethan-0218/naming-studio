import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, textStyles, spacing, radius } from '@/design-system';
import { EumyangHarmonyResult, NameInput } from '../types';
import SectionCard from './SectionCard';

interface Props {
  nameInput: NameInput;
  result: EumyangHarmonyResult | null;
}

const EUMYANG_COLOR = {
  음: { text: palette.teal, bg: palette.tealLight, border: palette.tealBorder },
  양: { text: palette.vermillion, bg: palette.vermillionLight, border: palette.vermillionBorder },
};

export default function HoeksuEumyangSection({ nameInput, result }: Props) {
  const slots = [nameInput.surname, nameInput.first1, nameInput.first2];
  const badge = result ? (result.harmonious ? '균형' : '불균형') : undefined;
  const badgeColor = result ? (result.harmonious ? palette.teal : palette.vermillion) : undefined;

  return (
    <SectionCard title="획수음양" badge={badge} badgeColor={badgeColor}>
      {slots.some(s => s.strokeEumyang !== null || s.strokeCount !== null) ? (
        <View style={styles.row}>
          {slots.map((slot, i) => {
            const ey = slot.strokeEumyang;
            const colors = ey ? EUMYANG_COLOR[ey] : null;
            return (
              <View key={i} style={[styles.box, colors && { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Text style={[textStyles.cardTitle, { color: colors?.text ?? palette.inkFaint }]}>
                  {slot.hanja || slot.hangul || '?'}
                </Text>
                {slot.strokeCount != null && (
                  <Text style={[textStyles.sectionLabel, { color: palette.inkLight, marginTop: 2 }]}>
                    {slot.strokeCount}획
                  </Text>
                )}
                <Text style={[textStyles.sectionLabel, { color: colors?.text ?? palette.inkFaint, marginTop: 2 }]}>
                  {ey ?? '–'}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={[textStyles.body, { color: palette.inkFaint, textAlign: 'center', paddingVertical: spacing['4'] }]}>
          한자를 선택하면 획수음양이 표시됩니다
        </Text>
      )}
      {result && (
        <Text style={[textStyles.body, styles.reason]}>{result.reason}</Text>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing['2'],
    marginBottom: spacing['2'],
  },
  box: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingVertical: spacing['3'],
    alignItems: 'center',
  },
  reason: {
    color: palette.inkMid,
    marginTop: spacing['2'],
  },
});
