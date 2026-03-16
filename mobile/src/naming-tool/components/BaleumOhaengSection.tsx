import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { palette, textStyles, spacing } from '@/design-system';
import { NameInput, OhaengHarmonyResult } from '../types';
import { baleumOhaengFromChar } from '../domain/baleumOhaeng';
import OhaengRelationDiagram from './OhaengRelationDiagram';
import SectionCard, { harmonyBadgeColor } from './SectionCard';

interface Props {
  nameInput: NameInput;
  result: OhaengHarmonyResult | null;
}

export default function BaleumOhaengSection({ nameInput, result }: Props) {
  const { surname, first1, first2 } = nameInput;

  const nodes: React.ComponentProps<typeof OhaengRelationDiagram>['nodes'] = [
    { character: surname.hangul || null, ohaeng: surname.hangul ? baleumOhaengFromChar(surname.hangul) : null, positionLabel: '성' },
    { character: first1.hangul || null, ohaeng: first1.hangul ? baleumOhaengFromChar(first1.hangul) : null, positionLabel: '첫째' },
    { character: first2.hangul || null, ohaeng: first2.hangul ? baleumOhaengFromChar(first2.hangul) : null, positionLabel: '둘째' },
  ];

  const hasInput = nodes.some(n => n.character);
  const badge = result ? result.level : undefined;
  const badgeColor = result ? harmonyBadgeColor(result.level) : undefined;

  return (
    <SectionCard title="발음오행" badge={badge} badgeColor={badgeColor}>
      {hasInput ? (
        <OhaengRelationDiagram nodes={nodes} />
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
