import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { palette, textStyles, spacing } from '@/design-system';
import { NameInput, OhaengHarmonyResult } from '../types';
import OhaengFlowDiagram from './OhaengFlowDiagram';
import SectionCard, { harmonyBadgeColor } from './SectionCard';

interface Props {
  nameInput: NameInput;
  result: OhaengHarmonyResult | null;
}

export default function JawonOhaengSection({ nameInput, result }: Props) {
  const { surname, first1, first2 } = nameInput;

  const elements = [
    surname.charOhaeng,
    first1.charOhaeng,
    first2.charOhaeng,
  ];

  const relations = result?.pairs.map(p => p.relation) ?? [null, null];
  const badge = result?.level;
  const badgeColor = result ? harmonyBadgeColor(result.level) : undefined;

  return (
    <SectionCard title="자원오행" badge={badge} badgeColor={badgeColor}>
      {elements.some(e => e !== null) ? (
        <OhaengFlowDiagram elements={elements} relations={relations} />
      ) : (
        <Text style={[textStyles.body, { color: palette.inkFaint, textAlign: 'center', paddingVertical: spacing['4'] }]}>
          한자를 선택하면 자원오행이 표시됩니다
        </Text>
      )}
      {result && (
        <Text style={[textStyles.body, styles.reason]}>{result.reason}</Text>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  reason: {
    color: palette.inkMid,
    marginTop: spacing['2'],
  },
});
