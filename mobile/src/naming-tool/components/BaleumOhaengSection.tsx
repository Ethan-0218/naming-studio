import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, textStyles, spacing } from '@/design-system';
import { NameInput, OhaengHarmonyResult } from '../types';
import { baleumOhaengFromChar } from '../domain/baleumOhaeng';
import OhaengFlowDiagram from './OhaengFlowDiagram';
import SectionCard, { harmonyBadgeColor } from './SectionCard';

interface Props {
  nameInput: NameInput;
  result: OhaengHarmonyResult | null;
}

export default function BaleumOhaengSection({ nameInput, result }: Props) {
  const { surname, first1, first2 } = nameInput;

  const elements = [
    surname.hangul ? baleumOhaengFromChar(surname.hangul) : null,
    first1.hangul ? baleumOhaengFromChar(first1.hangul) : null,
    first2.hangul ? baleumOhaengFromChar(first2.hangul) : null,
  ];

  const relations = result?.pairs.map(p => p.relation) ?? [null, null];

  const badge = result ? result.level : undefined;
  const badgeColor = result ? harmonyBadgeColor(result.level) : undefined;

  return (
    <SectionCard title="발음오행" badge={badge} badgeColor={badgeColor}>
      {elements.some(e => e !== null) ? (
        <OhaengFlowDiagram elements={elements} relations={relations} />
      ) : (
        <Text style={[textStyles.bodySm, { color: palette.inkFaint, textAlign: 'center', paddingVertical: spacing['4'] }]}>
          이름을 입력하면 발음오행이 표시됩니다
        </Text>
      )}
      {result && (
        <Text style={[textStyles.bodySm, styles.reason]}>{result.reason}</Text>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  reason: {
    color: palette.inkMid,
    marginTop: spacing['2'],
    lineHeight: 18,
  },
});
