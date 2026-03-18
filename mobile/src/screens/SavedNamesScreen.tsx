import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';
import AppHeader from '@/home/components/AppHeader';

export default function SavedNamesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Font tag="primaryMedium" style={{ fontSize: 18, color: colors.textPrimary }}>
          저장된 이름
        </Font>
        <Font tag="secondary" style={{ fontSize: 14, color: colors.textTertiary }}>
          저장된 이름 목록이 여기에 표시됩니다.
        </Font>
      </View>
    </SafeAreaView>
  );
}
