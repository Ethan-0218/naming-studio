import React from 'react';
import { View } from 'react-native';
import { Font } from '@/components/Font';
import { NameInput, OhaengHarmonyResult } from '../types';
import { getOhaengCombinationDescription } from '../domain/ohaengCombinationDescriptions';
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

  const hasInput = nodes.some((n) => n.ohaeng !== null);
  const badge = result?.level;
  const badgeColor = result ? harmonyBadgeColor(result.level) : undefined;

  return (
    <SectionCard title="자원오행" badge={badge} badgeColor={badgeColor}>
      <View className="gap-3">
        {hasInput ? (
          <OhaengRelationDiagram nodes={nodes} />
        ) : (
          <Font
            tag="secondary"
            className="text-bodySm text-textDisabled text-center py-4"
          >
            한자를 선택하면 자원오행이 표시됩니다
          </Font>
        )}
        {result && (() => {
          const desc = getOhaengCombinationDescription(result.combinationKey);
          if (!desc) return null;
          return (
            <>
              <View className="border-b border-border" />
              <Font
                tag="secondary"
                className="text-bodySm text-textSecondary"
                style={{ lineHeight: 18 }}
              >
                {desc.description}
              </Font>
            </>
          );
        })()}
      </View>
    </SectionCard>
  );
}
