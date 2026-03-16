/**
 * Shared section card wrapper used by all analysis sections.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, textStyles, spacing, radius } from '@/design-system';
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
      <View style={styles.titleRow}>
        <Text style={[textStyles.heading, { color: colors.textPrimary }]}>{title}</Text>
        {badge && (
          <View style={[styles.badge, { borderColor: badgeColor ?? colors.border }]}>
            <Text style={[textStyles.label, { color: badgeColor ?? colors.textSecondary }]}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.card}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['2'],
  },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing['4'],
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    paddingHorizontal: spacing['2'],
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
