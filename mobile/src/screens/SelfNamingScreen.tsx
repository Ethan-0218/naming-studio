import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NamingToolScreen } from '@/naming-tool';

export default function SelfNamingScreen() {
  const navigation = useNavigation();
  return <NamingToolScreen onBack={() => navigation.goBack()} />;
}
