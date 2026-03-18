import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import MyProfileScreen from '../screens/MyProfileScreen';
import MyeongJuListScreen from '../screens/MyeongJuListScreen';
import AddMyeongJuScreen from '../screens/AddMyeongJuScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MyProfile" component={MyProfileScreen} />
      <Stack.Screen name="MyeongJuManage" component={MyeongJuListScreen} />
      <Stack.Screen name="AddMyeongJu" component={AddMyeongJuScreen} />
    </Stack.Navigator>
  );
}
