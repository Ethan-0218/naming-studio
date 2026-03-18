import React from 'react';
import { View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';
import { Eumyang, EumyangHarmonyResult, NameInput } from '../types';
import { getEumyangCombinationDescription } from '../domain/eumyangCombinationDescriptions';
import { soundEumyangFromHangul } from '../domain/soundEumyangMap';
import SectionCard from './SectionCard';

type EumyangSectionVariant = { variant: 'baleum' } | { variant: 'hoeksu' };

interface BaseProps {
  nameInput: NameInput;
  result: EumyangHarmonyResult | null;
}

type Props = EumyangSectionVariant & BaseProps;

const EUMYANG_COLOR = {
  음: { text: colors.yin, bg: colors.yinSub, border: colors.yinBorder },
  양: { text: colors.yang, bg: colors.yangSub, border: colors.yangBorder },
};

const VARIANT_META = {
  baleum: {
    title: '발음음양',
    emptyText: '이름을 입력하면 발음음양이 표시됩니다',
  },
  hoeksu: {
    title: '획수음양',
    emptyText: '한자를 선택하면 획수음양이 표시됩니다',
  },
} as const;

function deriveSlotData(
  slot: NameInput['surname'],
  variant: 'baleum' | 'hoeksu',
  chars: (Eumyang | null)[],
  i: number,
) {
  if (variant === 'baleum') {
    const ey =
      chars[i] ?? slot.soundEumyang ?? soundEumyangFromHangul(slot.hangul);
    return { label: slot.hangul || '?', eumyang: ey, subLabel: null };
  } else {
    const ey = slot.strokeEumyang;
    const subLabel = slot.strokeCount != null ? `${slot.strokeCount}획` : null;
    return { label: slot.hanja || slot.hangul || '?', eumyang: ey, subLabel };
  }
}

function hasData(slot: NameInput['surname'], variant: 'baleum' | 'hoeksu') {
  return variant === 'baleum'
    ? slot.soundEumyang !== null || !!slot.hangul
    : slot.strokeEumyang !== null || slot.strokeCount !== null;
}

function EumyangBalanceBar({
  yinCount,
  yangCount,
}: {
  yinCount: number;
  yangCount: number;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Font
        tag="secondaryMedium"
        className="text-overline"
        style={{ color: colors.yin }}
      >
        음(陰)
      </Font>
      <View
        className="flex-1 flex-row rounded-full overflow-hidden"
        style={{ height: 6, backgroundColor: colors.border }}
      >
        <View style={{ flex: yinCount, backgroundColor: colors.yin }} />
        <View style={{ flex: yangCount, backgroundColor: colors.yang }} />
      </View>
      <Font
        tag="secondaryMedium"
        className="text-overline"
        style={{ color: colors.yang }}
      >
        양(陽)
      </Font>
    </View>
  );
}

export default function EumyangSection({ variant, nameInput, result }: Props) {
  const slots = [nameInput.surname, nameInput.first1, nameInput.first2];
  const chars = result?.chars ?? [];
  const { title, emptyText } = VARIANT_META[variant];

  const combinationDescription = result
    ? getEumyangCombinationDescription(result.combinationKey)
    : null;
  const badge = result ? (result.harmonious ? '좋음' : '아쉬움') : undefined;
  const badgeColor = result
    ? result.harmonious
      ? colors.positive
      : colors.negative
    : undefined;

  const dataAvailable = slots.some((s) => hasData(s, variant));
  const allNamesEntered = slots.every((s) => !!s.hangul);

  const slotDataList = slots.map((slot, i) =>
    deriveSlotData(slot, variant, chars, i),
  );
  const yinCount = slotDataList.filter((d) => d.eumyang === '음').length;
  const yangCount = slotDataList.filter((d) => d.eumyang === '양').length;

  return (
    <SectionCard title={title} badge={badge} badgeColor={badgeColor}>
      <View className="gap-3">
        {allNamesEntered && (
          <EumyangBalanceBar yinCount={yinCount} yangCount={yangCount} />
        )}
        {dataAvailable ? (
          <View className="flex-row gap-2">
            {slotDataList.map(({ label, eumyang, subLabel }, i) => {
              const oc = eumyang ? EUMYANG_COLOR[eumyang] : null;
              return (
                <View
                  key={i}
                  className="flex-1 border rounded-md py-3 items-center"
                  style={
                    oc
                      ? { backgroundColor: oc.bg, borderColor: oc.border }
                      : { borderColor: colors.border }
                  }
                >
                  <Font
                    tag="secondaryMedium"
                    className="text-uiMd"
                    style={{ color: oc?.text ?? colors.textDisabled }}
                  >
                    {label}
                  </Font>
                  <View className="flex-row items-center mt-0.5">
                    {subLabel && (
                      <>
                        <Font
                          tag="secondaryMedium"
                          className="text-overline"
                          style={{ color: oc?.text ?? colors.textDisabled }}
                        >
                          {subLabel}
                        </Font>
                        <Font
                          tag="secondaryMedium"
                          className="text-overline mx-0.5"
                          style={{ color: oc?.text ?? colors.textDisabled }}
                        >
                          ·
                        </Font>
                      </>
                    )}
                    <Font
                      tag="secondaryMedium"
                      className="text-overline"
                      style={{ color: oc?.text ?? colors.textDisabled }}
                    >
                      {eumyang === '음'
                        ? '음(陰)'
                        : eumyang === '양'
                          ? '양(陽)'
                          : '미선택'}
                    </Font>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Font
            tag="secondary"
            className="text-bodySm text-textDisabled text-center py-4"
          >
            {emptyText}
          </Font>
        )}
        {result && combinationDescription && (
          <>
            <View className="border-b border-border" />
            <Font tag="secondary" className="text-bodySm text-textSecondary">
              {combinationDescription}
            </Font>
          </>
        )}
      </View>
    </SectionCard>
  );
}
