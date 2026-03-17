import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/design-system';

const TABS = [
  { label: '홈', icon: 'home', active: true },
  { label: '검색', icon: 'search', active: false },
  { label: '저장', icon: 'bookmark', active: false },
  { label: '내 정보', icon: 'person', active: false },
] as const;

export default function BottomNav() {
  return (
    <View style={{
      height: 80,
      backgroundColor: colors.surfaceRaised,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingTop: 10,
    }}>
      {TABS.map((tab) => (
        <View key={tab.label} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 }}>
          <Ionicons
            name={tab.active ? tab.icon : `${tab.icon}-outline` as any}
            size={22}
            color={tab.active ? colors.fillAccent : colors.textDisabled}
          />
          <Text style={{
            fontFamily: tab.active ? 'NotoSansKR_500Medium' : 'NotoSansKR_400Regular',
            fontSize: 10,
            color: tab.active ? colors.fillAccent : colors.textDisabled,
          }}>
            {tab.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
