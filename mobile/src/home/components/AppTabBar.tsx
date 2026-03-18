import React from 'react';
import { Pressable, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { primitives } from '@/design-system';
import { Font } from '@/components/Font';

const TAB_CONFIG: Record<string, { icon: string; label: string }> = {
  홈: { icon: 'home', label: '홈' },
  저장: { icon: 'bookmark', label: '저장' },
  내정보: { icon: 'person-outline', label: '내 정보' },
};

export default function AppTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View
      style={{
        height: 80,
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingTop: 10,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
      }}
    >
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name] ?? {
          icon: 'ellipse',
          label: route.name,
        };
        const isActive = state.index === index;

        return (
          <Pressable
            key={route.key}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 4,
              paddingVertical: 4,
            }}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          >
            <Ionicons
              name={(isActive ? config.icon : `${config.icon}`) as any}
              size={22}
              color={isActive ? primitives.gold600 : primitives.ink300}
            />
            <Font
              tag={isActive ? 'secondaryMedium' : 'secondary'}
              style={{
                fontSize: 10,
                color: isActive ? primitives.gold600 : primitives.ink300,
              }}
            >
              {config.label}
            </Font>
          </Pressable>
        );
      })}
    </View>
  );
}
