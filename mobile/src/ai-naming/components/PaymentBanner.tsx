import React from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';

interface Props {
  onPress: () => void;
}

export default function PaymentBanner({ onPress }: Props) {
  return (
    <View
      className="border-t border-border px-4 py-3 items-center gap-2.5"
      style={{ backgroundColor: colors.bgSubtle }}
    >
      <Font
        tag="secondary"
        style={{
          fontSize: 12,
          color: colors.textTertiary,
          textAlign: 'center',
        }}
      >
        이용권 결제 후 이름 추천을 받을 수 있어요
      </Font>
      <Pressable
        className="w-full rounded-[14px] py-3 items-center flex-row justify-center gap-1.5"
        style={{ backgroundColor: colors.fillBold }}
        onPress={onPress}
      >
        <Font tag="secondaryMedium" style={{ fontSize: 15, color: '#fff' }}>
          이용권 결제하기
        </Font>
      </Pressable>
    </View>
  );
}
