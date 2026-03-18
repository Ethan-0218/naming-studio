import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SavedStackParamList } from './types';
import SavedNamesScreen from '../screens/SavedNamesScreen';

const Stack = createNativeStackNavigator<SavedStackParamList>();

export function SavedStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="SavedNames" component={SavedNamesScreen} />
    </Stack.Navigator>
  );
}
