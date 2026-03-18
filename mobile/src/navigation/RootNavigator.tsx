import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import MyeongJuListScreen from '@/screens/MyeongJuListScreen';
import AddMyeongJuScreen from '@/screens/AddMyeongJuScreen';
import AINamingScreen from '@/screens/AINamingScreen';
import SelfNamingScreen from '@/screens/SelfNamingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="MyeongJuList" component={MyeongJuListScreen} />
      <Stack.Screen name="AddMyeongJu" component={AddMyeongJuScreen} />
      <Stack.Screen name="AINaming" component={AINamingScreen} />
      <Stack.Screen name="SelfNaming" component={SelfNamingScreen} />
    </Stack.Navigator>
  );
}
