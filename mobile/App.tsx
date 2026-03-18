import './global.css';
import React from 'react';
import { useAppFonts } from '@/design-system';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { RootStack } from '@/navigation/RootStack';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import LoginScreen from '@/auth/components/LoginScreen';

function AppContent() {
  const { auth } = useAuth();

  if (auth.isLoading) return null;

  if (!auth.token) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();
  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
