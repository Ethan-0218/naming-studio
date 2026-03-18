import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyeongJuStackParamList } from './types';
import MyeongJuListScreen from '../screens/MyeongJuListScreen';
import AddMyeongJuScreen from '../screens/AddMyeongJuScreen';

const Stack = createNativeStackNavigator<MyeongJuStackParamList>();

export function MyeongJuStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MyeongJuManage" component={MyeongJuListScreen} />
      <Stack.Screen name="AddMyeongJu" component={AddMyeongJuScreen} />
    </Stack.Navigator>
  );
}
