import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { primitives } from '@/design-system';
import { Font } from '@/components/Font';

interface Props {
  title: string;
  subtitle: string;
  onBack?: () => void;
}

export default function NavBar({ title, subtitle, onBack }: Props) {
  return (
    <View className="h-[52px] flex-row items-center gap-2.5 px-5 bg-bgSubtle border-b border-border">
      {onBack ? (
        <Pressable onPress={onBack} className="p-1">
          <Ionicons name="chevron-back" size={20} color={primitives.ink700} />
        </Pressable>
      ) : (
        <View className="w-[28px]" />
      )}
      <View>
        <Font
          tag="primaryMedium"
          className="text-textPrimary"
          style={{ fontSize: 18, letterSpacing: 1.5 }}
        >
          {title}
        </Font>
        <Font
          tag="secondary"
          className="text-textTertiary mt-px"
          style={{ fontSize: 9.5, letterSpacing: 1.2 }}
        >
          {subtitle}
        </Font>
      </View>
    </View>
  );
}
