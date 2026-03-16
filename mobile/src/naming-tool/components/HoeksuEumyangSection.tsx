import React from 'react';
import { Text, View } from 'react-native';
import { colors, fontFamily } from '@/design-system';
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
      {slots.some((s) => s.strokeEumyang !== null || s.strokeCount !== null) ? (
        <View className="flex-row gap-2 mb-2">
          {slots.map((slot, i) => {
            const ey = slot.strokeEumyang;
            const oc = ey ? EUMYANG_COLOR[ey] : null;
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
                <Text
                  className="text-uiSm"
                  style={{ fontFamily: fontFamily.sansMedium, color: oc?.text ?? colors.textDisabled }}
                >
                  {slot.hanja || slot.hangul || '?'}
                </Text>
                {slot.strokeCount != null && (
                  <Text
                    className="text-overline text-textTertiary mt-0.5 uppercase"
                    style={{ fontFamily: fontFamily.sansMedium }}
                  >
                    {slot.strokeCount}획
                  </Text>
                )}
                <Text
                  className="text-overline mt-0.5 uppercase"
                  style={{ fontFamily: fontFamily.sansMedium, color: oc?.text ?? colors.textDisabled }}
                >
                  {ey ?? '–'}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text
          className="text-bodySm text-textDisabled text-center py-4"
          style={{ fontFamily: fontFamily.sansRegular }}
        >
          한자를 선택하면 획수음양이 표시됩니다
        </Text>
      )}
      {result && (
        <Text
          className="text-bodySm text-textSecondary mt-2"
          style={{ fontFamily: fontFamily.sansRegular }}
        >
          {result.reason}
        </Text>
      )}
    </SectionCard>
  );
}
