import React from 'react';
import { View } from 'react-native';
import { colors, ohaengColors } from '@/design-system';
import { Font } from '@/components/Font';
import { NameInput, NamingAnalysis } from '@/naming-tool/types';
import ScoreSummarySection from './ScoreSummarySection';

interface Props {
  nameInput: NameInput;
  analysis: NamingAnalysis;
}

const SLOT_LABELS = { surname: '성', first1: '첫째', first2: '둘째' } as const;
const SLOTS = ['surname', 'first1', 'first2'] as const;

export default function NameDisplaySection({ nameInput, analysis }: Props) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <Font tag="primaryMedium" className="text-heading text-textPrimary">
          이름
        </Font>
      </View>

      <View
        className="bg-surfaceRaised rounded-lg p-4 border border-border"
        style={{ gap: 12 }}
      >
        {/* 한글 행 */}
        <View style={{ gap: 4 }}>
          <Font
            tag="secondaryMedium"
            className="text-serifLabel text-textSecondary uppercase"
          >
            한 글
          </Font>
          <View className="flex-row items-stretch" style={{ gap: 8 }}>
            {SLOTS.map((slot) => {
              const data = nameInput[slot];
              return (
                <View
                  key={slot}
                  className="flex-1 min-w-0 items-center"
                  style={{ gap: 4 }}
                >
                  <Font
                    tag="secondaryMedium"
                    className="text-label text-textTertiary uppercase"
                  >
                    {SLOT_LABELS[slot]}
                  </Font>
                  <View
                    className="w-full rounded-md border border-border bg-bg items-center justify-center"
                    style={{ height: 54 }}
                  >
                    <Font
                      tag="primaryMedium"
                      style={{
                        fontSize: 24,
                        color: data.hangul
                          ? colors.textPrimary
                          : colors.textDisabled,
                      }}
                    >
                      {data.hangul || '-'}
                    </Font>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View className="h-px bg-border" />

        {/* 한자 행 */}
        <View style={{ gap: 4 }}>
          <Font
            tag="secondaryMedium"
            className="text-serifLabel text-textSecondary uppercase"
          >
            한 자
          </Font>
          <View className="flex-row items-stretch" style={{ gap: 8 }}>
            {SLOTS.map((slot) => {
              const data = nameInput[slot];
              const oc = data.charOhaeng ? ohaengColors[data.charOhaeng] : null;
              return (
                <View
                  key={slot}
                  className="flex-1 min-w-0 rounded-md border border-border p-2 items-center"
                  style={{
                    backgroundColor: oc ? oc.light : colors.surface,
                    borderColor: oc ? oc.border : colors.border,
                    gap: 3,
                  }}
                >
                  <Font
                    tag="primaryMedium"
                    style={{
                      fontSize: 22,
                      color: data.hanja
                        ? colors.textPrimary
                        : colors.textDisabled,
                    }}
                  >
                    {data.hanja || '-'}
                  </Font>
                  {data.charOhaeng && (
                    <View
                      className="px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: oc?.base }}
                    >
                      <Font
                        tag="secondaryMedium"
                        style={{
                          fontSize: 10,
                          color: '#fff',
                          letterSpacing: 0,
                        }}
                      >
                        {data.charOhaeng}
                      </Font>
                    </View>
                  )}
                  {data.mean ? (
                    <Font
                      tag="secondary"
                      className="text-center"
                      style={{
                        fontSize: 10,
                        color: colors.textTertiary,
                        lineHeight: 14,
                      }}
                      numberOfLines={2}
                    >
                      {data.mean}
                    </Font>
                  ) : null}
                  {data.strokeCount != null && (
                    <Font
                      tag="secondary"
                      style={{ fontSize: 10, color: colors.textDisabled }}
                    >
                      {data.strokeCount}획
                    </Font>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <ScoreSummarySection
          score={analysis.totalScore}
          ohaengScore={analysis.ohaengScore}
          suriScore={analysis.suriScore}
          eumyangScore={analysis.eumyangScore}
        />
      </View>
    </View>
  );
}
