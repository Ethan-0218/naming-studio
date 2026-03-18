import React from 'react';
import { Pressable, View } from 'react-native';
import { colors, ohaengColors } from '@/design-system';
import { Font } from '@/components/Font';
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

export default function YongsinSection({
  sajuInput,
  nameInput,
  onUpdate,
}: Props) {
  const { yongsin } = sajuInput;
  const slots = [nameInput.surname, nameInput.first1, nameInput.first2];

  return (
    <SectionCard title="용신 보완">
      <Font tag="secondary" className="text-bodySm text-textSecondary mb-3">
        아이의 용신 오행을 선택하면 이름 글자들과의 궁합을 분석합니다.
      </Font>

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
              <Font
                tag="secondaryMedium"
                className="text-uiSm"
                style={{ color: selected ? oc.base : colors.textSecondary }}
              >
                {o}
              </Font>
            </Pressable>
          );
        })}
      </View>

      {yongsin && (
        <View className="gap-2 pt-2 border-t border-border">
          {slots.map((slot, i) => {
            const charOhaeng =
              slot.charOhaeng ??
              (slot.hangul ? baleumOhaengFromChar(slot.hangul) : null);
            const relation = charOhaeng
              ? getRelation(charOhaeng, yongsin)
              : null;
            const badge = relation ? RELATION_BADGE[relation] : null;
            return (
              <View key={i} className="flex-row items-center">
                <Font
                  tag="secondaryMedium"
                  className="text-uiSm text-textPrimary w-10"
                >
                  {slot.hanja || slot.hangul || '?'}
                </Font>
                {charOhaeng ? (
                  <View
                    className="px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: ohaengColors[charOhaeng].light,
                      borderColor: ohaengColors[charOhaeng].border,
                    }}
                  >
                    <Font
                      tag="secondaryMedium"
                      className="text-overline uppercase"
                      style={{ color: ohaengColors[charOhaeng].base }}
                    >
                      {charOhaeng}
                    </Font>
                  </View>
                ) : (
                  <View className="w-9" />
                )}
                <Font
                  tag="secondary"
                  className="text-bodySm text-textTertiary mx-2"
                >
                  →
                </Font>
                <View
                  className="px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: ohaengColors[yongsin].light,
                    borderColor: ohaengColors[yongsin].border,
                  }}
                >
                  <Font
                    tag="secondaryMedium"
                    className="text-overline uppercase"
                    style={{ color: ohaengColors[yongsin].base }}
                  >
                    {yongsin} (용신)
                  </Font>
                </View>
                {badge && (
                  <View
                    className="ml-2 px-2 py-0.5 rounded-full border"
                    style={{ borderColor: badge.color }}
                  >
                    <Font
                      tag="secondaryMedium"
                      className="text-overline uppercase"
                      style={{ color: badge.color }}
                    >
                      {badge.label}
                    </Font>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {!yongsin && (
        <Font
          tag="secondary"
          className="text-bodySm text-textDisabled text-center py-2"
        >
          용신 오행을 선택해주세요
        </Font>
      )}
    </SectionCard>
  );
}
