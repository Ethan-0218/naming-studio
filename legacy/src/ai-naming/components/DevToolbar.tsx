import React from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';

interface Props {
  showDebug: boolean;
  onToggleDebug: () => void;
  onReset: () => void;
}

export default function DevToolbar({
  showDebug,
  onToggleDebug,
  onReset,
}: Props) {
  return (
    <View className="flex-row gap-2 px-3 py-1 bg-surface border-b border-border">
      <Pressable onPress={onToggleDebug}>
        <Font
          tag="secondary"
          style={{ fontSize: 11, color: colors.textDisabled }}
        >
          {showDebug ? 'DEBUG ON' : 'DEBUG OFF'}
        </Font>
      </Pressable>
      <Pressable onPress={onReset}>
        <Font
          tag="secondary"
          style={{ fontSize: 11, color: colors.textDisabled }}
        >
          RESET
        </Font>
      </Pressable>
    </View>
  );
}
