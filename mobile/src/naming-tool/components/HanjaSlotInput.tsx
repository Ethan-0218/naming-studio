/**
 * 한 자 행의 개별 슬롯 — 한자 선택 버튼
 * - 선택 전: + 아이콘 + "한자 선택" (점선 테두리)
 * - 선택 후: 한자 글자 + 뜻 (자원오행 색상)
 * - 탭 시 HanjaPickerSheet 바텀시트 오픈
 */
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import clsx from 'clsx';
import { ohaengColors, colors } from '@/design-system';
import { Font, FONT_MAP } from '@/components/Font';
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
      <Font
        tag="secondaryMedium"
        className="text-overline text-textTertiary uppercase"
      >
        {label}
      </Font>

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
            <Font
              tag="primaryMedium"
              className="text-hanjaLg text-center"
              style={{ color: oc?.base ?? colors.textSecondary }}
            >
              {value.hanja}
            </Font>
            <Font
              tag="secondaryMedium"
              className="text-center text-caption"
              style={{
                color: oc?.base ?? colors.textSecondary,
                fontSize: 10,
                lineHeight: 14,
              }}
              numberOfLines={1}
            >
              {value.mean} {value.hangul}
            </Font>
          </>
        ) : (
          <>
            <Font
              tag="primaryLight"
              className="text-textDisabled"
              style={{ fontSize: 22, lineHeight: 26 }}
            >
              +
            </Font>
            <Font
              tag="secondaryMedium"
              className="text-overline text-textTertiary uppercase"
            >
              한자 선택
            </Font>
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
