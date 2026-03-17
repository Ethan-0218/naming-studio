import React from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/design-system';
import { RootStackParamList } from '../../navigation/types';
import AppHeader from './AppHeader';
import HeroSection from './HeroSection';
import ActionCardsSection from './ActionCardsSection';
import RecentNamesSection from './RecentNamesSection';
import InfoBanner from './InfoBanner';
import TipChipsSection from './TipChipsSection';
import BottomNav from './BottomNav';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16, marginTop: 20 }} />;
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSubtle }}>
      <AppHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ backgroundColor: colors.bg }}
        showsVerticalScrollIndicator={false}
      >
        <HeroSection />
        <ActionCardsSection
          onAINaming={() => navigation.navigate('AINaming')}
          onSelfNaming={() => navigation.navigate('SelfNaming')}
        />
        <Divider />
        <RecentNamesSection />
        <Divider />
        <InfoBanner />
        <Divider />
        <TipChipsSection />
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}
