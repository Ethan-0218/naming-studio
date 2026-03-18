import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';
import { useAuth } from '@/auth/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();

  function handleLogout() {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View className="mx-4 mt-1">
      <Pressable
        onPress={handleLogout}
        className="flex-row items-center justify-center gap-2 py-[13px] rounded-lg border-[1.5px] bg-ohaeng-fire-light border-ohaeng-fire-border active:opacity-70"
      >
        <Ionicons name="log-out-outline" size={16} color={colors.negative} />
        <Font tag="secondaryMedium" style={{ fontSize: 14, color: colors.negative, letterSpacing: 0.4 }}>
          로그아웃
        </Font>
      </Pressable>
    </View>
  );
}
