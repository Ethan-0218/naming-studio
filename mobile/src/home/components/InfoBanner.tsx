import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/design-system';

export default function InfoBanner() {
  return (
    <View style={{
      marginHorizontal: 16,
      marginTop: 20,
      backgroundColor: colors.fillAccentSub,
      borderWidth: 1,
      borderColor: colors.warningBorder,
      borderRadius: 14,
      padding: 16,
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 20, color: colors.fillAccent, lineHeight: 24, flexShrink: 0 }}>
        五
      </Text>
      <View>
        <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 14, color: colors.fillAccent, marginBottom: 4 }}>
          오행이란 무엇인가요?
        </Text>
        <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 12, color: colors.textSecondary, lineHeight: 20 }}>
          목·화·토·금·수의 기운이 이름의 소리와 글자에 담깁니다. 상생·상극 관계가 이름의 조화를 결정합니다.
        </Text>
      </View>
    </View>
  );
}
