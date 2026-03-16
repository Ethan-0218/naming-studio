import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import AINamingScreen from '../screens/AINamingScreen';
import SelfNamingScreen from '../screens/SelfNamingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AINaming" component={AINamingScreen} />
      <Stack.Screen name="SelfNaming" component={SelfNamingScreen} />
    </Stack.Navigator>
  );
}
