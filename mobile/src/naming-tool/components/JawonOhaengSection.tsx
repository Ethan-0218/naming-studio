import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { palette, textStyles, spacing } from '@/design-system';
import { NameInput, OhaengHarmonyResult } from '../types';
import OhaengRelationDiagram from './OhaengRelationDiagram';
import SectionCard, { harmonyBadgeColor } from './SectionCard';

interface Props {
  nameInput: NameInput;
  result: OhaengHarmonyResult | null;
}

export default function JawonOhaengSection({ nameInput, result }: Props) {
  const { surname, first1, first2 } = nameInput;

  const nodes: React.ComponentProps<typeof OhaengRelationDiagram>['nodes'] = [
    { character: surname.hanja || surname.hangul || null, ohaeng: surname.charOhaeng, positionLabel: '성' },
    { character: first1.hanja || first1.hangul || null, ohaeng: first1.charOhaeng, positionLabel: '첫째' },
    { character: first2.hanja || first2.hangul || null, ohaeng: first2.charOhaeng, positionLabel: '둘째' },
  ];

  const hasInput = nodes.some(n => n.ohaeng !== null);
  const badge = result?.level;
  const badgeColor = result ? harmonyBadgeColor(result.level) : undefined;

  return (
    <SectionCard title="자원오행" badge={badge} badgeColor={badgeColor}>
      {hasInput ? (
        <OhaengRelationDiagram nodes={nodes} />
      ) : (
        <Text style={[textStyles.bodySm, { color: palette.inkFaint, textAlign: 'center', paddingVertical: spacing['4'] }]}>
          한자를 선택하면 자원오행이 표시됩니다
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
  },
});
