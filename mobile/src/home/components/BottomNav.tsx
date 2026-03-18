import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { primitives } from '@/design-system';

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
    <View className="h-20 flex-row items-start pt-2.5 bg-surfaceRaised border-t border-border">
      {TABS.map((tab) => {
        const isActive = tab.label === activeTab;
        return (
          <View key={tab.label} className="flex-1 items-center gap-1 py-1">
            <Ionicons
              name={(isActive ? tab.icon : `${tab.icon}-outline`) as any}
              size={22}
              color={isActive ? primitives.gold600 : primitives.ink300}
            />
            <Text
              className={isActive ? 'font-sans-medium text-fillAccent' : 'font-sans-regular text-textDisabled'}
              style={{ fontSize: 10 }}
            >
              {tab.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
