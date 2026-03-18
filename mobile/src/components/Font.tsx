import React from 'react';
import { Text, TextProps } from 'react-native';

// 폰트 교체 시 이 매핑만 수정하면 앱 전체에 반영됨
// primary  = 장식/헤딩 폰트 (현재: Noto Serif KR)
// secondary = UI/본문 폰트  (현재: Noto Sans KR)
export const FONT_MAP = {
  primaryLight:    'NotoSerifKR_300Light',
  primary:         'NotoSerifKR_400Regular',
  primaryMedium:   'NotoSerifKR_500Medium',
  primaryBold:     'NotoSerifKR_600SemiBold',
  secondaryLight:  'NotoSansKR_300Light',
  secondary:       'NotoSansKR_400Regular',
  secondaryMedium: 'NotoSansKR_500Medium',
} as const;

export type FontTag = keyof typeof FONT_MAP;

interface FontProps extends TextProps {
  tag: FontTag;
}

export function Font({ tag, style, ...rest }: FontProps) {
  return <Text style={[{ fontFamily: FONT_MAP[tag] }, style]} {...rest} />;
}
