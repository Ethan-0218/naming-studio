/**
 * Shared section card wrapper used by all analysis sections.
 */
import React from 'react';
import { View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';
import { HarmonyLevel } from '../types';

interface Props {
  title: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}

const HARMONY_COLOR: Record<HarmonyLevel, string> = {
  大吉: colors.positive,
  平: colors.fillAccent,
  大凶: colors.negative,
};

export function harmonyBadgeColor(level: HarmonyLevel): string {
  return HARMONY_COLOR[level];
}

export default function SectionCard({
  title,
  badge,
  badgeColor,
  children,
}: Props) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <Font tag="primaryMedium" className="text-heading text-textPrimary">
          {title}
        </Font>
        {badge && (
          <View
            className="px-2 py-0.5 rounded-full border border-solid"
            style={{ borderColor: badgeColor ?? colors.border }}
          >
            <Font
              tag="secondaryMedium"
              className="text-label"
              style={{ color: badgeColor ?? colors.textSecondary }}
            >
              {badge}
            </Font>
          </View>
        )}
      </View>
      <View className="bg-surfaceRaised rounded-lg p-4 border border-border">
        {children}
      </View>
    </View>
  );
}
