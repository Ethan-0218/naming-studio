import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, ohaengColors, textStyles, spacing, radius } from '@/design-system';
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
  상생: { label: '상생 ✓', color: palette.teal },
  동일: { label: '동일', color: palette.gold },
  상극: { label: '상극 ✗', color: palette.vermillion },
};

export default function YongsinSection({ sajuInput, nameInput, onUpdate }: Props) {
  const { yongsin } = sajuInput;
  const slots = [nameInput.surname, nameInput.first1, nameInput.first2];

  return (
    <SectionCard title="용신 보완">
      <Text style={[textStyles.bodySm, { color: palette.inkMid, marginBottom: spacing['3'] }]}>
        아이의 용신 오행을 선택하면 이름 글자들과의 궁합을 분석합니다.
      </Text>

      {/* 오행 selector */}
      <View style={styles.selectorRow}>
        {OHAENG_LIST.map(o => {
          const colors = ohaengColors[o];
          const selected = yongsin === o;
          return (
            <Pressable
              key={o}
              style={[
                styles.ohaengBtn,
                { borderColor: colors.border },
                selected && { backgroundColor: colors.light },
              ]}
              onPress={() => onUpdate({ yongsin: selected ? null : o })}
            >
              <Text style={[textStyles.uiSm, { color: selected ? colors.base : palette.inkMid }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Compatibility grid */}
      {yongsin && (
        <View style={styles.compatGrid}>
          {slots.map((slot, i) => {
            const charOhaeng = slot.charOhaeng ?? (slot.hangul ? baleumOhaengFromChar(slot.hangul) : null);
            const relation = charOhaeng ? getRelation(charOhaeng, yongsin) : null;
            const badge = relation ? RELATION_BADGE[relation] : null;
            return (
              <View key={i} style={styles.compatRow}>
                <Text style={[textStyles.uiSm, { color: palette.ink, width: 40 }]}>
                  {slot.hanja || slot.hangul || '?'}
                </Text>
                {charOhaeng ? (
                  <View style={[styles.ohaengPill, { backgroundColor: ohaengColors[charOhaeng].light, borderColor: ohaengColors[charOhaeng].border }]}>
                    <Text style={[textStyles.overline, { color: ohaengColors[charOhaeng].base }]}>{charOhaeng}</Text>
                  </View>
                ) : <View style={{ width: 36 }} />}
                <Text style={[textStyles.bodySm, { color: palette.inkLight, marginHorizontal: spacing['2'] }]}>→</Text>
                <View style={[styles.ohaengPill, { backgroundColor: ohaengColors[yongsin].light, borderColor: ohaengColors[yongsin].border }]}>
                  <Text style={[textStyles.overline, { color: ohaengColors[yongsin].base }]}>{yongsin} (용신)</Text>
                </View>
                {badge && (
                  <View style={[styles.relationBadge, { borderColor: badge.color }]}>
                    <Text style={[textStyles.overline, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {!yongsin && (
        <Text style={[textStyles.bodySm, { color: palette.inkFaint, textAlign: 'center', paddingVertical: spacing['2'] }]}>
          용신 오행을 선택해주세요
        </Text>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  selectorRow: {
    flexDirection: 'row',
    gap: spacing['2'],
    marginBottom: spacing['3'],
  },
  ohaengBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing['2'],
    alignItems: 'center',
  },
  compatGrid: {
    gap: spacing['2'],
    paddingTop: spacing['2'],
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  compatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ohaengPill: {
    paddingHorizontal: spacing['2'],
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  relationBadge: {
    marginLeft: spacing['2'],
    paddingHorizontal: spacing['2'],
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
