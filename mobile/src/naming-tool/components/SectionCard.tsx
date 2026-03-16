/**
 * Shared section card wrapper used by all analysis sections.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, textStyles, spacing, radius } from '@/design-system';
import { HarmonyLevel } from '../types';

interface Props {
  title: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}

const HARMONY_COLOR: Record<HarmonyLevel, string> = {
  '대길': palette.teal,
  '반길': palette.gold,
  '대흉': palette.vermillion,
};

export function harmonyBadgeColor(level: HarmonyLevel): string {
  return HARMONY_COLOR[level];
}

export default function SectionCard({ title, badge, badgeColor, children }: Props) {
  return (
    <View>
      <View style={styles.titleRow}>
        <Text style={[textStyles.heading, { color: palette.ink }]}>{title}</Text>
        {badge && (
          <View style={[styles.badge, { borderColor: badgeColor ?? palette.border }]}>
            <Text style={[textStyles.label, { color: badgeColor ?? palette.inkMid }]}>
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
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing['4'],
    borderWidth: 1,
    borderColor: palette.border,
  },
  badge: {
    paddingHorizontal: spacing['2'],
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
