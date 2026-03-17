/**
 * 한 자 행의 개별 슬롯 — 한자 선택 버튼
 * - 선택 전: + 아이콘 + "한자 선택" (점선 테두리)
 * - 선택 후: 한자 글자 + 뜻 (자원오행 색상)
 * - 탭 시 HanjaPickerSheet 바텀시트 오픈
 */
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import clsx from 'clsx';
import { ohaengColors, colors, fontFamily } from '@/design-system';
import { CharSlotData, HanjaSelection } from '../types';
import HanjaPickerSheet from './HanjaPickerSheet';

interface Props {
  label: string;
  hangul: string;
  value: CharSlotData;
  onUpdateHanja: (selection: HanjaSelection) => void;
  role: 'surname' | 'name';
}

export default function HanjaSlotInput({ label, hangul, value, onUpdateHanja, role }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasHanja = !!value.hanja;
  const oc = value.charOhaeng ? ohaengColors[value.charOhaeng] : null;

  return (
    <View className="flex-1 items-center min-w-0" style={{ gap: 4 }}>
      <Text
        className="text-overline text-textTertiary uppercase"
        style={{ fontFamily: fontFamily.sansMedium }}
      >
        {label}
      </Text>

      <Pressable
        onPress={() => { if (hangul) setSheetOpen(true); }}
        className={clsx(
          'w-full rounded-md border-[1.5px] items-center justify-center',
          !hasHanja && 'border-dashed bg-surface border-border',
        )}
        style={[
          { height: 54 },
          hasHanja && {
            borderColor: oc?.border ?? colors.borderStrong,
            backgroundColor: oc?.light ?? colors.surface,
          },
        ]}
      >
        {hasHanja ? (
          <>
            <Text
              className="text-hanjaLg text-center"
              style={{
                fontFamily: fontFamily.serifMedium,
                color: oc?.base ?? colors.textSecondary,
              }}
            >
              {value.hanja}
            </Text>
            <Text
              className="text-center text-caption"
              style={{
                fontFamily: fontFamily.sansMedium,
                color: oc?.base ?? colors.textSecondary,
                fontSize: 10,
                lineHeight: 14,
              }}
              numberOfLines={1}
            >
              {value.mean} {value.hangul}
            </Text>
          </>
        ) : (
          <>
            <Text
              className="text-textDisabled"
              style={{ fontFamily: fontFamily.serifLight, fontSize: 22, lineHeight: 26 }}
            >
              +
            </Text>
            <Text
              className="text-overline text-textTertiary uppercase"
              style={{ fontFamily: fontFamily.sansMedium }}
            >
              한자 선택
            </Text>
          </>
        )}
      </Pressable>

      <HanjaPickerSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        hangul={hangul}
        role={role}
        onSelect={(data) => onUpdateHanja({ forHangul: hangul, ...data })}
      />
    </View>
  );
}
