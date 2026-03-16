import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, ohaengColors, fontFamily } from '@/design-system';
import { NameInput, Ohaeng, SajuInput } from '../types';
import { getRelation } from '../domain/ohaeng';
import { baleumOhaengFromChar } from '../domain/baleumOhaeng';
import SectionCard from './SectionCard';

const OHAENG_LIST: Ohaeng[] = ['목', '화', '토', '금', '수'];

interface Props {
  sajuInput: SajuInput;
  nameInput: NameInput;
  onUpdate: (data: Partial<SajuInput>) => void;
}

const RELATION_BADGE: Record<string, { label: string; color: string }> = {
  상생: { label: '상생 ✓', color: colors.positive },
  동일: { label: '동일', color: colors.fillAccent },
  상극: { label: '상극 ✗', color: colors.negative },
};

export default function YongsinSection({ sajuInput, nameInput, onUpdate }: Props) {
  const { yongsin } = sajuInput;
  const slots = [nameInput.surname, nameInput.first1, nameInput.first2];

  return (
    <SectionCard title="용신 보완">
      <Text
        className="text-bodySm text-textSecondary mb-3"
        style={{ fontFamily: fontFamily.sansRegular }}
      >
        아이의 용신 오행을 선택하면 이름 글자들과의 궁합을 분석합니다.
      </Text>

      <View className="flex-row gap-2 mb-3">
        {OHAENG_LIST.map((o) => {
          const oc = ohaengColors[o];
          const selected = yongsin === o;
          return (
            <Pressable
              key={o}
              className="flex-1 border-[1.5px] rounded-md py-2 items-center"
              style={{
                borderColor: oc.border,
                backgroundColor: selected ? oc.light : undefined,
              }}
              onPress={() => onUpdate({ yongsin: selected ? null : o })}
            >
              <Text
                className="text-uiSm"
                style={{
                  fontFamily: fontFamily.sansMedium,
                  color: selected ? oc.base : colors.textSecondary,
                }}
              >
                {o}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {yongsin && (
        <View className="gap-2 pt-2 border-t border-border">
          {slots.map((slot, i) => {
            const charOhaeng = slot.charOhaeng ?? (slot.hangul ? baleumOhaengFromChar(slot.hangul) : null);
            const relation = charOhaeng ? getRelation(charOhaeng, yongsin) : null;
            const badge = relation ? RELATION_BADGE[relation] : null;
            return (
              <View key={i} className="flex-row items-center">
                <Text
                  className="text-uiSm text-textPrimary w-10"
                  style={{ fontFamily: fontFamily.sansMedium }}
                >
                  {slot.hanja || slot.hangul || '?'}
                </Text>
                {charOhaeng ? (
                  <View
                    className="px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: ohaengColors[charOhaeng].light,
                      borderColor: ohaengColors[charOhaeng].border,
                    }}
                  >
                    <Text
                      className="text-overline uppercase"
                      style={{ fontFamily: fontFamily.sansMedium, color: ohaengColors[charOhaeng].base }}
                    >
                      {charOhaeng}
                    </Text>
                  </View>
                ) : (
                  <View className="w-9" />
                )}
                <Text
                  className="text-bodySm text-textTertiary mx-2"
                  style={{ fontFamily: fontFamily.sansRegular }}
                >
                  →
                </Text>
                <View
                  className="px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: ohaengColors[yongsin].light,
                    borderColor: ohaengColors[yongsin].border,
                  }}
                >
                  <Text
                    className="text-overline uppercase"
                    style={{ fontFamily: fontFamily.sansMedium, color: ohaengColors[yongsin].base }}
                  >
                    {yongsin} (용신)
                  </Text>
                </View>
                {badge && (
                  <View
                    className="ml-2 px-2 py-0.5 rounded-full border"
                    style={{ borderColor: badge.color }}
                  >
                    <Text
                      className="text-overline uppercase"
                      style={{ fontFamily: fontFamily.sansMedium, color: badge.color }}
                    >
                      {badge.label}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {!yongsin && (
        <Text
          className="text-bodySm text-textDisabled text-center py-2"
          style={{ fontFamily: fontFamily.sansRegular }}
        >
          용신 오행을 선택해주세요
        </Text>
      )}
    </SectionCard>
  );
}
