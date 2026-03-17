import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/design-system';

interface Props {
  onBack: () => void;
}

export default function MyeongJuNavBar({ onBack }: Props) {
  return (
    <View style={{
      height: 52,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgSubtle,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable
          style={({ pressed }) => ({
            width: 30, height: 30, borderRadius: 15,
            backgroundColor: pressed ? colors.surface : colors.surfaceRaised,
            borderWidth: 1, borderColor: colors.border,
            alignItems: 'center', justifyContent: 'center',
          })}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
        </Pressable>
        <View>
          <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 18, letterSpacing: 1.5, color: colors.textPrimary }}>
            명주 목록
          </Text>
          <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 9.5, letterSpacing: 1.2, color: colors.textTertiary, marginTop: 1 }}>
            命主 · 이름 주인
          </Text>
        </View>
      </View>
    </View>
  );
}
