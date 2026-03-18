import React from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, primitives } from '@/design-system';
import { Font } from '@/components/Font';
import AppHeader from '@/home/components/AppHeader';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
}

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 12,
      }}
    >
      <Ionicons name={icon as any} size={20} color={primitives.ink500} />
      <Font tag="secondaryMedium" style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}>
        {label}
      </Font>
      <Ionicons name="chevron-forward" size={16} color={primitives.ink300} />
    </Pressable>
  );
}

export default function MyProfileScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader />
      <View style={{ marginTop: 8 }}>
        <MenuItem
          icon="person-outline"
          label="명주 목록"
          onPress={() => navigation.navigate('MyeongJuManage')}
        />
        <MenuItem
          icon="receipt-outline"
          label="결제 내역"
          onPress={() => {}}
        />
        <MenuItem
          icon="settings-outline"
          label="설정"
          onPress={() => {}}
        />
      </View>
    </SafeAreaView>
  );
}
