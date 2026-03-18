/**
 * Shared section card wrapper used by all analysis sections.
 */
import React from 'react';
import { View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';
interface Props {
  title: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}

export function ratingLabel(rating: string): string {
  if (rating === '大吉') return '매우좋음';
  if (rating === '吉') return '좋음';
  if (rating === '平') return '보통';
  return '아쉬움'; // 凶, 大凶
}

export function ratingColor(rating: string): string {
  if (rating === '大吉' || rating === '吉') return colors.positive;
  if (rating === '平') return colors.fillAccent;
  return colors.negative;
}

export default function SectionCard({
  title,
  badge,
  badgeColor,
  children,
}: Props) {
  return (
    <View className="bg-surfaceRaised rounded-lg p-4 border border-border">
      <View className="flex-row items-center justify-between mb-3">
        <Font
          tag="secondaryMedium"
          className="text-serifLabel text-textSecondary"
        >
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
      {children}
    </View>
  );
}
