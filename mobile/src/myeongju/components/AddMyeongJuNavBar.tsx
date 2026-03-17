import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '@/design-system';

interface Props {
  onBack: () => void;
}

export default function AddMyeongJuNavBar({ onBack }: Props) {
  return (
    <View style={{
      height: 52,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.bgSubtle,
    }}>
      <Pressable
        style={({ pressed }) => ({
          width: 30, height: 30, borderRadius: 15,
          backgroundColor: colors.surface,
          borderWidth: 1, borderColor: colors.border,
          alignItems: 'center', justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
        onPress={onBack}
      >
        <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
      </Pressable>

      <View>
        <Text style={{
          fontFamily: fontFamily.serifMedium,
          fontSize: 18,
          letterSpacing: 1.5,
          color: colors.textPrimary,
        }}>
          새 명주 추가
        </Text>
        <Text style={{
          fontFamily: fontFamily.sansRegular,
          fontSize: 9.5,
          letterSpacing: 1.2,
          color: colors.textTertiary,
          marginTop: 1,
        }}>
          命主 · 이름 주인 등록
        </Text>
      </View>
    </View>
  );
}
