import React from 'react';
import { View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';

interface Props {
  likedNames: string[];
}

export default function LikedNamesPanel({ likedNames }: Props) {
  return (
    <View className="bg-bgSubtle border-b border-border p-3 px-4">
      <Font
        tag="secondaryMedium"
        style={{
          fontSize: 12,
          color: colors.textDisabled,
          marginBottom: 6,
          letterSpacing: 0.8,
        }}
      >
        좋아요한 이름
      </Font>
      {likedNames.length === 0 ? (
        <Font
          tag="secondary"
          style={{ fontSize: 13, color: colors.textDisabled }}
        >
          아직 없어요
        </Font>
      ) : (
        <View className="flex-row flex-wrap gap-1.5">
          {likedNames.map((n) => (
            <View
              key={n}
              className="rounded-full px-2.5 py-1 border"
              style={{
                backgroundColor: colors.fillAccentSub,
                borderColor: colors.fillAccent,
              }}
            >
              <Font
                tag="primaryMedium"
                style={{ fontSize: 13, color: colors.fillAccent }}
              >
                {n}
              </Font>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
