import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@/design-system';
import { RootStackParamList } from '../../navigation/types';
import BottomNav from '../../home/components/BottomNav';
import MyeongJuNavBar from './MyeongJuNavBar';
import AddMyeongJuButton from './AddMyeongJuButton';
import ProfileCard from './ProfileCard';
import { MyeongJuProfile } from '../types';
import { listMyeongJu } from '../api';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'MyeongJuList'>;
type ScreenRoute = RouteProp<RootStackParamList, 'MyeongJuList'>;

export default function MyeongJuListScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const { mode } = route.params;

  const [profiles, setProfiles] = useState<MyeongJuProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyeongJu()
      .then(setProfiles)
      .finally(() => setLoading(false));
  }, []);

  function handleSelectProfile(_profile: MyeongJuProfile) {
    if (mode === 'ai') {
      navigation.navigate('AINaming');
    } else {
      navigation.navigate('SelfNaming');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSubtle }}>
      <MyeongJuNavBar onBack={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        showsVerticalScrollIndicator={false}
      >
        <AddMyeongJuButton onPress={() => navigation.navigate('AddMyeongJu', { mode })} />

        {/* 명주 수 */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 11, color: colors.textTertiary, letterSpacing: 0.6 }}>
            {'명주 '}
            <Text style={{ fontFamily: 'NotoSansKR_500Medium', color: colors.textSecondary }}>
              {profiles.length}
            </Text>
            {'명'}
          </Text>
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
