import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from './types';
import AppTabBar from '@/home/components/AppTabBar';
import HomeScreen from '@/screens/HomeScreen';
import SavedNamesScreen from '@/screens/SavedNamesScreen';
import MyProfileScreen from '@/screens/MyProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="홈" component={HomeScreen} />
      <Tab.Screen name="저장" component={SavedNamesScreen} />
      <Tab.Screen name="내정보" component={MyProfileScreen} />
    </Tab.Navigator>
  );
}
