import React from 'react';
import { View } from 'react-native';
import { Font } from '@/components/Font';
import { NameInput, OhaengHarmonyResult } from '../types';
import { baleumOhaengFromChar } from '../domain/baleumOhaeng';
import { getOhaengCombinationDescription } from '../domain/ohaengCombinationDescriptions';
import OhaengRelationDiagram from './OhaengRelationDiagram';
import SectionCard, { ratingLabel, ratingColor } from './SectionCard';

interface Props {
  nameInput: NameInput;
  result: OhaengHarmonyResult | null;
}

export default function BaleumOhaengSection({ nameInput, result }: Props) {
  const { surname, first1, first2 } = nameInput;

  const nodes: React.ComponentProps<typeof OhaengRelationDiagram>['nodes'] = [
    {
      character: surname.hangul || null,
      ohaeng: surname.hangul ? baleumOhaengFromChar(surname.hangul) : null,
      positionLabel: '성',
    },
    {
      character: first1.hangul || null,
      ohaeng: first1.hangul ? baleumOhaengFromChar(first1.hangul) : null,
      positionLabel: '첫째',
    },
    {
      character: first2.hangul || null,
      ohaeng: first2.hangul ? baleumOhaengFromChar(first2.hangul) : null,
      positionLabel: '둘째',
    },
  ];

  const hasInput = nodes.some((n) => n.character);
  const desc = result
    ? getOhaengCombinationDescription(result.combinationKey)
    : null;
  const raw = desc?.rating ?? result?.level;
  const badge = raw ? ratingLabel(raw) : undefined;
  const badgeColor = raw ? ratingColor(raw) : undefined;

  return (
    <SectionCard title="발음오행" badge={badge} badgeColor={badgeColor}>
      <View className="gap-3">
        {hasInput ? (
          <OhaengRelationDiagram nodes={nodes} />
        ) : (
          <Font
            tag="secondary"
            className="text-bodySm text-textTertiary text-center py-4"
          >
            이름을 입력하면 발음오행이 표시됩니다
          </Font>
        )}
        {desc && (
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
        )}
      </View>
    </SectionCard>
  );
}
