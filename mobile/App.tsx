import './global.css';
import React from 'react';
import { useAppFonts } from '@/design-system';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { RootStack } from '@/navigation/RootStack';
import { queryClient } from '@/lib/queryClient';

export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();
  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
