import React from 'react';
import { ScrollView, View, Text } from 'react-native';
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

type NavProp = NativeStackNavigationProp<RootStackParamList, 'MyeongJuList'>;
type ScreenRoute = RouteProp<RootStackParamList, 'MyeongJuList'>;

// TODO: 실제 데이터로 교체
const MOCK_PROFILES: MyeongJuProfile[] = [
  {
    id: '1',
    ilgan: '壬', ohaeng: '수',
    iljoo: '임수일주', iljooHanja: '壬子',
    gender: 'male', calendarType: '양력',
    birthDate: '2024년 3월 12일',
    birthTime: '묘시(卯時) · 오전 5:30',
    analysisCount: 3, savedCount: 2,
  },
  {
    id: '2',
    ilgan: '甲', ohaeng: '목',
    iljoo: '갑목일주', iljooHanja: '甲午',
    gender: 'female', calendarType: '음력',
    birthDate: '2023년 11월 5일',
    birthTime: '자시(子時) · 오전 0:10',
    analysisCount: 1,
  },
  {
    id: '3',
    ilgan: '丙', ohaeng: '화',
    iljoo: '병화일주', iljooHanja: '丙午',
    gender: 'male', calendarType: '양력',
    birthDate: '2023년 8월 20일',
    birthTime: '오시(午時) · 오후 12:45',
    analysisCount: 2, savedCount: 5,
  },
  {
    id: '4',
    ilgan: '庚', ohaeng: '금',
    iljoo: '경금일주', iljooHanja: '庚申',
    gender: 'female', calendarType: '양력',
    birthDate: '2022년 6월 1일',
    birthTime: '미시(未時) · 오후 2:20',
  },
];

export default function MyeongJuListScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const { mode } = route.params;

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
        <AddMyeongJuButton />

        {/* 명주 수 */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 11, color: colors.textTertiary, letterSpacing: 0.6 }}>
            {'명주 '}
            <Text style={{ fontFamily: 'NotoSansKR_500Medium', color: colors.textSecondary }}>
              {MOCK_PROFILES.length}
            </Text>
            {'명'}
          </Text>
        </View>

        {/* 카드 목록 */}
        <View style={{ padding: 12, paddingHorizontal: 16, paddingBottom: 20, gap: 9 }}>
          {MOCK_PROFILES.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onPress={() => handleSelectProfile(profile)}
            />
          ))}
        </View>
      </ScrollView>

      <BottomNav activeTab="명주" />
    </SafeAreaView>
  );
}
