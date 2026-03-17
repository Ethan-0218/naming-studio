import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/design-system';
import { RootStackParamList } from '../../navigation/types';
import { MOCK_PROFILES } from '../../myeongju/data';
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
  // 명주 목록이 비어 있으면 바로 추가 화면으로 이동
  const hasProfiles = MOCK_PROFILES.length > 0;

  function handleNaming(mode: 'ai' | 'self') {
    if (hasProfiles) {
      navigation.navigate('MyeongJuList', { mode });
    } else {
      navigation.navigate('AddMyeongJu', { mode });
    }
  }

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
          onAINaming={() => handleNaming('ai')}
          onSelfNaming={() => handleNaming('self')}
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
