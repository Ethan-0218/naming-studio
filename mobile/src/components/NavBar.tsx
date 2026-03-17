import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '@/design-system';

interface Props {
  title: string;
  subtitle: string;
  onBack: () => void;
}

export default function NavBar({ title, subtitle, onBack }: Props) {
  return (
    <View style={{
      height: 52,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.bgSubtle,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <Pressable onPress={onBack} style={{ padding: 4 }}>
        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
      </Pressable>
      <View>
        <Text style={{
          fontFamily: fontFamily.serifMedium,
          fontSize: 18,
          letterSpacing: 1.5,
          color: colors.textPrimary,
        }}>
          {title}
        </Text>
        <Text style={{
          fontFamily: fontFamily.sansRegular,
          fontSize: 9.5,
          letterSpacing: 1.2,
          color: colors.textTertiary,
          marginTop: 1,
        }}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
