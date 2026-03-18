import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';
import { RootStackParamList } from '../../navigation/types';
import BottomNav from '../../home/components/BottomNav';
import NavBar from '@/components/NavBar';
import AddMyeongJuButton from './AddMyeongJuButton';
import ProfileCard from './ProfileCard';
import { MyeongJuProfile } from '../types';
import { useMyeongJuList } from '../hooks/useMyeongJuList';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'MyeongJuList'>;
type ScreenRoute = RouteProp<RootStackParamList, 'MyeongJuList'>;

export default function MyeongJuListScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const { mode } = route.params;

  const { data: profiles = [], isLoading: loading } = useMyeongJuList();

  function handleSelectProfile(_profile: MyeongJuProfile) {
    if (mode === 'ai') {
      navigation.navigate('AINaming');
    } else {
      navigation.navigate('SelfNaming');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSubtle }}>
      <NavBar title="명주 목록" subtitle="命主 · 이름 주인" onBack={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        showsVerticalScrollIndicator={false}
      >
        <AddMyeongJuButton onPress={() => navigation.navigate('AddMyeongJu', { mode })} />

        {/* 명주 수 */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Font tag="secondary" style={{ fontSize: 11, color: colors.textTertiary, letterSpacing: 0.6 }}>
            {'명주 '}
            <Font tag="secondaryMedium" style={{ color: colors.textSecondary }}>
              {profiles.length}
            </Font>
            {'명'}
          </Font>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.textTertiary} />
          </View>
        ) : (
          <View style={{ padding: 12, paddingHorizontal: 16, paddingBottom: 20, gap: 9 }}>
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onPress={() => handleSelectProfile(profile)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNav activeTab="명주" />
    </SafeAreaView>
  );
}
