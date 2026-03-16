/**
 * 한 자 행의 개별 슬롯 — 한자 선택 버튼
 * - 선택 전: + 아이콘 + "한자 선택" (점선 테두리)
 * - 선택 후: 한자 글자 + 뜻 (자원오행 색상)
 * - 탭 시 HanjaPickerSheet 바텀시트 오픈
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ohaengColors, palette, radius, spacing, textStyles } from '@/design-system';
import { CharSlotData } from '../types';
import HanjaPickerSheet from './HanjaPickerSheet';

interface Props {
  label: string;
  hangul: string;
  value: CharSlotData;
  onUpdate: (data: Partial<CharSlotData>) => void;
  role: 'surname' | 'name';
}

export default function HanjaSlotInput({ label, hangul, value, onUpdate, role }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasHanja = !!value.hanja;
  // 자원오행 기반 색상
  const oc = value.charOhaeng ? ohaengColors[value.charOhaeng] : null;

  return (
    <View style={styles.wrapper}>
      <Text style={[textStyles.overline, styles.label]}>{label}</Text>

      <Pressable
        onPress={() => setSheetOpen(true)}
        style={[
          styles.box,
          hasHanja
            ? {
                borderColor: oc?.border ?? palette.borderMd,
                backgroundColor: oc?.light ?? palette.surface,
              }
            : styles.boxEmpty,
        ]}
      >
        {hasHanja ? (
          <>
            {/* 한자 글자 — 자원오행 색상 */}
            <Text style={[textStyles.hanjaLg, { color: oc?.base ?? palette.inkMid }]}>
              {value.hanja}
            </Text>
            <Text style={[styles.mean, { color: oc?.base ?? palette.inkMid }]} numberOfLines={1}>
              {value.mean} {value.hangul}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.plusIcon, { color: palette.inkFaint }]}>+</Text>
            <Text style={[textStyles.overline, { color: palette.inkLight }]}>한자 선택</Text>
          </>
        )}
      </Pressable>

      <HanjaPickerSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        hangul={hangul}
        role={role}
        onSelect={onUpdate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    gap: spacing['1'],
  },
  label: {
    color: palette.inkLight,
  },
  box: {
    width: '100%',
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxEmpty: {
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderStyle: 'dashed',
  },
  plusIcon: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '300',
  },
  mean: {
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
});
