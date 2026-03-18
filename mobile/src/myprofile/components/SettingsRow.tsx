import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';

export type BadgeVariant = 'default' | 'count' | 'locked' | 'new';

interface Props {
  iconName: string;
  iconBg: string;
  iconColor: string;
  label: string;
  description?: string;
  badgeText?: string;
  badgeVariant?: BadgeVariant;
  onPress?: () => void;
  isLast?: boolean;
}

const BADGE_CLASS: Record<BadgeVariant, string> = {
  default: 'bg-surface border-border',
  count:   'bg-warningSub border-warningBorder',
  locked:  'bg-surface border-border',
  new:     'bg-ohaeng-fire-light border-ohaeng-fire-border',
};

const BADGE_TEXT_COLOR: Record<BadgeVariant, string> = {
  default: colors.textSecondary,
  count:   colors.warning,
  locked:  colors.textDisabled,
  new:     colors.negative,
};

function Badge({ text, variant = 'default' }: { text: string; variant?: BadgeVariant }) {
  return (
    <View className={`px-[9px] py-[3px] rounded-full border ${BADGE_CLASS[variant]}`}>
      <Font tag="secondaryMedium" style={{ fontSize: 11, color: BADGE_TEXT_COLOR[variant], letterSpacing: 0.4 }}>
        {text}
      </Font>
    </View>
  );
}

export default function SettingsRow({
  iconName, iconBg, iconColor, label, description,
  badgeText, badgeVariant = 'default', onPress, isLast = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-[13px] min-h-14 active:bg-surface ${isLast ? '' : 'border-b border-border'}`}
    >
      {/* Icon — dynamic color from props, must use inline style */}
      <View className="w-[34px] h-[34px] rounded-md items-center justify-center" style={{ backgroundColor: iconBg }}>
        <Ionicons name={iconName as any} size={18} color={iconColor} />
      </View>

      {/* Body */}
      <View className="flex-1">
        <Font tag="secondary" style={{ fontSize: 15, color: colors.textPrimary, letterSpacing: 0.2 }}>
          {label}
        </Font>
        {description && (
          <Font tag="secondary" style={{ fontSize: 11, color: colors.textTertiary, letterSpacing: 0.4 }} className="mt-[2px]">
            {description}
          </Font>
        )}
      </View>

      {/* Right: badge + chevron */}
      <View className="flex-row items-center gap-2">
        {badgeText && <Badge text={badgeText} variant={badgeVariant} />}
        <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
      </View>
    </Pressable>
  );
}
