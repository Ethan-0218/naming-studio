import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/design-system';

export default function HeroSection() {
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, position: 'relative' }}>
      <Text
        style={{
          position: 'absolute',
          right: 22,
          top: 22,
          fontFamily: 'NotoSerifKR_300Light',
          fontSize: 52,
          color: colors.border,
          lineHeight: 52,
        }}
        pointerEvents="none"
      >
        名
      </Text>
      <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 11, letterSpacing: 2.5, color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 10 }}>
        이름공방 · 작명 서비스
      </Text>
      <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 26, letterSpacing: 0.5, color: colors.textPrimary, lineHeight: 38 }}>
        {'좋은 이름 하나가\n'}
        <Text style={{ color: colors.fillAccent }}>한 사람의 삶</Text>
        {'을 이끕니다.'}
      </Text>
      <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 13, color: colors.textTertiary, lineHeight: 22, marginTop: 10 }}>
        {'오행·수리·음양을 종합해 이름을 분석하거나\nAI가 최적의 이름을 추천해 드립니다.'}
      </Text>
    </View>
  );
}
