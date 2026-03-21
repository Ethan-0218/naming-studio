import React from 'react';
import { View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';

export default function HeroSection() {
  return (
    <View
      style={{
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 24,
        position: 'relative',
      }}
    >
      <Font
        tag="primaryLight"
        style={{
          position: 'absolute',
          right: 22,
          top: 22,
          fontSize: 52,
          color: colors.border,
          lineHeight: 52,
        }}
        pointerEvents="none"
      >
        名
      </Font>
      <Font
        tag="secondary"
        style={{
          fontSize: 12,
          letterSpacing: 2.5,
          color: colors.textTertiary,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        이름공방 · 작명 서비스
      </Font>
      <Font
        tag="primaryMedium"
        style={{
          fontSize: 26,
          letterSpacing: 0.5,
          color: colors.textPrimary,
          lineHeight: 38,
        }}
      >
        {'좋은 이름 하나가\n'}
        <Font tag="primaryMedium" style={{ color: colors.fillAccent }}>
          한 사람의 삶
        </Font>
        {'을 이끕니다.'}
      </Font>
      <Font
        tag="secondary"
        style={{
          fontSize: 13,
          color: colors.textTertiary,
          lineHeight: 22,
          marginTop: 10,
        }}
      >
        {
          '오행·수리·음양을 종합해 이름을 분석하거나\nAI가 최적의 이름을 추천해 드립니다.'
        }
      </Font>
    </View>
  );
}
