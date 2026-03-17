import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/design-system';

export type BottomNavTab = '홈' | '검색' | '명주' | '저장';

const TABS: { label: BottomNavTab; icon: string }[] = [
  { label: '홈',  icon: 'home' },
  { label: '검색', icon: 'search' },
  { label: '명주', icon: 'person' },
  { label: '저장', icon: 'bookmark' },
];

interface Props {
  activeTab?: BottomNavTab;
}

export default function BottomNav({ activeTab = '홈' }: Props) {
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
      {TABS.map((tab) => {
        const isActive = tab.label === activeTab;
        return (
          <View key={tab.label} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 }}>
            <Ionicons
              name={(isActive ? tab.icon : `${tab.icon}-outline`) as any}
              size={22}
              color={isActive ? colors.fillAccent : colors.textDisabled}
            />
            <Text style={{
              fontFamily: isActive ? 'NotoSansKR_500Medium' : 'NotoSansKR_400Regular',
              fontSize: 10,
              color: isActive ? colors.fillAccent : colors.textDisabled,
            }}>
              {tab.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
