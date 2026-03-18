import React from 'react';
import { View, Text } from 'react-native';

export default function InfoBanner() {
  return (
    <View className="mx-4 mt-5 bg-fillAccentSub border border-warningBorder rounded-[14px] p-4 flex-row gap-3 items-start">
      <Text className="font-serif-medium text-fillAccent shrink-0" style={{ fontSize: 20, lineHeight: 24 }}>
        五
      </Text>
      <View>
        <Text className="font-serif-medium text-fillAccent mb-1" style={{ fontSize: 14 }}>
          오행이란 무엇인가요?
        </Text>
        <Text className="font-sans-regular text-textSecondary" style={{ fontSize: 12, lineHeight: 20 }}>
          목·화·토·금·수의 기운이 이름의 소리와 글자에 담깁니다. 상생·상극 관계가 이름의 조화를 결정합니다.
        </Text>
      </View>
    </View>
  );
}
