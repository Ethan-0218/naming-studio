/**
 * Shared section card wrapper used by all analysis sections.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { colors, fontFamily } from '@/design-system';
import { HarmonyLevel } from '../types';

interface Props {
  title: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}

const HARMONY_COLOR: Record<HarmonyLevel, string> = {
  '대길': colors.positive,
  '반길': colors.fillAccent,
  '대흉': colors.negative,
};

export function harmonyBadgeColor(level: HarmonyLevel): string {
  return HARMONY_COLOR[level];
}

export default function SectionCard({ title, badge, badgeColor, children }: Props) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-heading text-textPrimary"
          style={{ fontFamily: fontFamily.serifMedium }}
        >
          {title}
        </Text>
        {badge && (
          <View
            className="px-2 py-0.5 rounded-full border border-solid"
            style={{ borderColor: badgeColor ?? colors.border }}
          >
            <Text
              className="text-label"
              style={{
                fontFamily: fontFamily.sansMedium,
                color: badgeColor ?? colors.textSecondary,
              }}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>
      <View className="bg-surfaceRaised rounded-lg p-4 border border-border">
        {children}
      </View>
    </View>
  );
}
