import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/design-system';
import { RootStackParamList, TabParamList } from '@/navigation/types';
import { useMyeongJuList } from '../../myeongju/hooks/useMyeongJuList';
import NavBar from '@/components/NavBar';
import HeroSection from './HeroSection';
import ActionCardsSection from './ActionCardsSection';
import RecentNamesSection from './RecentNamesSection';
import InfoBanner from './InfoBanner';
import TipChipsSection from './TipChipsSection';

type HomeNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, '홈'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: 16,
        marginTop: 20,
      }}
    />
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { data: profiles = [] } = useMyeongJuList();
  const hasProfiles = profiles.length > 0;

  function handleNaming(mode: 'ai' | 'self') {
    if (hasProfiles) {
      navigation.navigate('MyeongJuList', { mode });
    } else {
      navigation.navigate('AddMyeongJu', { mode });
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bgSubtle }}
      edges={['top']}
    >
      <NavBar title="이름공방" subtitle="名工房 · 이름 분석 및 작명" />
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
    </SafeAreaView>
  );
}
