import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/design-system';

export default function AppHeader() {
  return (
    <View style={{
      backgroundColor: colors.bgSubtle,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <View>
        <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 22, letterSpacing: 2, color: colors.textPrimary, lineHeight: 28 }}>
          이름공방
        </Text>
        <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 10, letterSpacing: 3, color: colors.textTertiary, textTransform: 'uppercase', marginTop: 1 }}>
          名工房 · 이름 분석 및 작명
        </Text>
      </View>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
      </View>
    </View>
  );
}
