import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeStack } from './HomeStack';
import { SavedStack } from './SavedStack';
import { ProfileStack } from './ProfileStack';
import AppTabBar from '../home/components/AppTabBar';

export type RootTabParamList = {
  홈: undefined;
  저장: undefined;
  내정보: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="홈" component={HomeStack} />
      <Tab.Screen name="저장" component={SavedStack} />
      <Tab.Screen name="내정보" component={ProfileStack} />
    </Tab.Navigator>
  );
}
