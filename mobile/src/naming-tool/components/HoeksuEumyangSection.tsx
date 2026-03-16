import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, textStyles, spacing, radius } from '@/design-system';
import { EumyangHarmonyResult, NameInput } from '../types';
import SectionCard from './SectionCard';

interface Props {
  nameInput: NameInput;
  result: EumyangHarmonyResult | null;
}

const EUMYANG_COLOR = {
  음: { text: colors.yin, bg: colors.yinSub, border: colors.yinBorder },
  양: { text: colors.yang, bg: colors.yangSub, border: colors.yangBorder },
};

export default function HoeksuEumyangSection({ nameInput, result }: Props) {
  const slots = [nameInput.surname, nameInput.first1, nameInput.first2];
  const badge = result ? (result.harmonious ? '균형' : '불균형') : undefined;
  const badgeColor = result ? (result.harmonious ? colors.positive : colors.negative) : undefined;

  return (
    <SectionCard title="획수음양" badge={badge} badgeColor={badgeColor}>
      {slots.some(s => s.strokeEumyang !== null || s.strokeCount !== null) ? (
        <View style={styles.row}>
          {slots.map((slot, i) => {
            const ey = slot.strokeEumyang;
            const oc = ey ? EUMYANG_COLOR[ey] : null;
            return (
              <View key={i} style={[styles.box, oc && { backgroundColor: oc.bg, borderColor: oc.border }]}>
                <Text style={[textStyles.uiSm, { color: oc?.text ?? colors.textDisabled }]}>
                  {slot.hanja || slot.hangul || '?'}
                </Text>
                {slot.strokeCount != null && (
                  <Text style={[textStyles.overline, { color: colors.textTertiary, marginTop: 2 }]}>
                    {slot.strokeCount}획
                  </Text>
                )}
                <Text style={[textStyles.overline, { color: oc?.text ?? colors.textDisabled, marginTop: 2 }]}>
                  {ey ?? '–'}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={[textStyles.bodySm, { color: colors.textDisabled, textAlign: 'center', paddingVertical: spacing['4'] }]}>
          한자를 선택하면 획수음양이 표시됩니다
        </Text>
      )}
      {result && (
        <Text style={[textStyles.bodySm, styles.reason]}>{result.reason}</Text>
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
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing['3'],
    alignItems: 'center',
  },
  reason: {
    color: colors.textSecondary,
    marginTop: spacing['2'],
  },
});
