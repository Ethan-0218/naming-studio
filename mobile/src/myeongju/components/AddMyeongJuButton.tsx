import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/design-system';

interface Props {
  onPress?: () => void;
}

export default function AddMyeongJuButton({ onPress }: Props) {
  return (
    <View style={{ padding: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: colors.fillBold,
          borderRadius: 14,
          padding: 14,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          opacity: pressed ? 0.82 : 1,
        })}
        onPress={onPress}
      >
        <View style={{
          width: 26, height: 26, borderRadius: 13,
          backgroundColor: 'rgba(255,255,255,0.10)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="add" size={16} color="rgba(255,255,255,0.85)" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 15, letterSpacing: 0.5, color: colors.textInverse }}>
            새 명주 추가
          </Text>
          <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 11, color: 'rgba(251,247,238,0.4)', marginTop: 2, letterSpacing: 0.4 }}>
            사주·성별 정보로 등록
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.30)" />
      </Pressable>
    </View>
  );
}
