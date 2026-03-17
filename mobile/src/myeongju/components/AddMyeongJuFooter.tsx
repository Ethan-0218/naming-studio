import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '@/design-system';

interface Props {
  onSubmit: () => void;
}

export default function AddMyeongJuFooter({ onSubmit }: Props) {
  return (
    <View style={{
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 14,
      backgroundColor: colors.bgSubtle,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    }}>
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: colors.fillBold,
          borderRadius: 16,
          height: 52,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.85 : 1,
        })}
        onPress={onSubmit}
      >
        <Text style={{
          fontFamily: fontFamily.serifMedium,
          fontSize: 16,
          letterSpacing: 0.5,
          color: colors.textInverse,
        }}>
          명주 등록하기
        </Text>
        <Ionicons name="chevron-forward" size={18} color="rgba(251,247,238,0.5)" />
      </Pressable>
    </View>
  );
}
