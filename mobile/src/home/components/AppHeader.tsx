import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { primitives } from '@/design-system';
import { Font } from '@/components/Font';

export default function AppHeader() {
  return (
    <View className="flex-row items-center justify-between bg-bgSubtle px-6 pt-3 pb-4">
      <View>
        <Font
          tag="primaryMedium"
          className="text-textPrimary"
          style={{ fontSize: 22, letterSpacing: 2, lineHeight: 28 }}
        >
          이름공방
        </Font>
        <Font
          tag="secondary"
          className="text-textTertiary mt-px"
          style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}
        >
          名工房 · 이름 분석 및 작명
        </Font>
      </View>
      <View className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center">
        <Ionicons
          name="notifications-outline"
          size={18}
          color={primitives.ink500}
        />
      </View>
    </View>
  );
}
