import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@/design-system';
import { RootStackParamList } from '../../navigation/types';
import { REGIONS, Region } from '../data';
import AddMyeongJuNavBar from './AddMyeongJuNavBar';
import GenderSection from './GenderSection';
import BirthDateSection from './BirthDateSection';
import BirthTimeSection from './BirthTimeSection';
import BirthRegionSection from './BirthRegionSection';
import RegionBottomSheet from './RegionBottomSheet';
import AddMyeongJuFooter from './AddMyeongJuFooter';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'AddMyeongJu'>;
type ScreenRoute = RouteProp<RootStackParamList, 'AddMyeongJu'>;

export default function AddMyeongJuScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const { mode } = route.params;

  // 폼 상태
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [calendarType, setCalendarType] = useState<'양력' | '음력'>('양력');
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState(3);
  const [day, setDay] = useState(12);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [isAm, setIsAm] = useState(true);
  const [hour, setHour] = useState(5);
  const [minute, setMinute] = useState(30);
  const [selectedRegion, setSelectedRegion] = useState<Region>(REGIONS[0]); // 서울 기본값

  // 지역 바텀시트
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);

  function handleSubmit() {
    // TODO: 실제 저장 로직 추가
    if (mode === 'ai') {
      navigation.navigate('AINaming');
    } else {
      navigation.navigate('SelfNaming');
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bgSubtle }}
      edges={['top', 'bottom']}
    >
      <AddMyeongJuNavBar onBack={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <GenderSection gender={gender} onChange={setGender} />

        <BirthDateSection
          calendarType={calendarType}
          year={year}
          month={month}
          day={day}
          onCalendarTypeChange={setCalendarType}
          onDateChange={(y, m, d) => { setYear(y); setMonth(m); setDay(d); }}
        />

        <BirthTimeSection
          timeUnknown={timeUnknown}
          isAm={isAm}
          hour={hour}
          minute={minute}
          onToggleUnknown={() => setTimeUnknown((prev) => !prev)}
          onAmPmChange={setIsAm}
          onHourChange={setHour}
          onMinuteChange={setMinute}
        />

        <BirthRegionSection
          selectedRegion={selectedRegion}
          onOpen={() => setRegionSheetOpen(true)}
        />

        <View style={{ height: 16, backgroundColor: colors.bg }} />
      </ScrollView>

      <RegionBottomSheet
        visible={regionSheetOpen}
        selectedRegion={selectedRegion}
        onSelect={setSelectedRegion}
        onClose={() => setRegionSheetOpen(false)}
      />

      <AddMyeongJuFooter onSubmit={handleSubmit} />
    </SafeAreaView>
  );
}
