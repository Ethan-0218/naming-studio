import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '@/design-system';
import { REGIONS, Region } from '../data';
import { useCreateMyeongJu } from '../hooks/useCreateMyeongJu';
import { findOrCreateSession } from '../api';
import NavBar from '@/components/NavBar';
import GenderSection from './GenderSection';
import BirthDateSection from './BirthDateSection';
import BirthTimeSection from './BirthTimeSection';
import BirthRegionSection from './BirthRegionSection';
import RegionBottomSheet from './RegionBottomSheet';
import AddMyeongJuFooter from './AddMyeongJuFooter';
import SurnameSection from './SurnameSection';
import { SelectedHanja } from '@/shared/components/HanjaSearchField';

export default function AddMyeongJuScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  // mode is present in HomeStack (naming flow); absent in MyeongJuStack (manage flow)
  const mode: 'ai' | 'self' | undefined = route.params?.mode;

  // 폼 상태
  const [surname, setSurname] = useState<SelectedHanja | null>(null);
  const [surnameError, setSurnameError] = useState('');
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
  const createMyeongJu = useCreateMyeongJu();

  function handleSubmit() {
    if (createMyeongJu.isPending) return;
    if (!surname) {
      setSurnameError('성씨를 선택해주세요');
      return;
    }
    setSurnameError('');
    createMyeongJu.mutate(
      {
        gender,
        calendarType,
        year,
        month,
        day,
        timeUnknown,
        isAm,
        hour,
        minute,
        regionName: selectedRegion.name,
        regionOffset: selectedRegion.offset,
        surname: surname.hangul,
        surnameHanja: surname.hanja,
      },
      {
        onSuccess: async (data) => {
          if (mode === 'ai') {
            const { session_id } = await findOrCreateSession(data.id);
            navigation.navigate('AINaming', {
              sessionId: session_id,
              profileId: data.id,
            });
          } else if (mode === 'self') {
            navigation.navigate('SelfNaming', { profileId: data.id });
          } else {
            navigation.goBack();
          }
        },
        onError: () => {
          Alert.alert('오류', '명주 등록에 실패했습니다. 다시 시도해 주세요.');
        },
      },
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bgSubtle }}
      edges={['top', 'bottom']}
    >
      <NavBar
        title="새 명주 추가"
        subtitle="命主 · 이름 주인 등록"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SurnameSection
          selected={surname}
          onSelect={setSurname}
          onClear={() => setSurname(null)}
          error={surnameError}
        />

        <GenderSection gender={gender} onChange={setGender} />

        <BirthDateSection
          calendarType={calendarType}
          year={year}
          month={month}
          day={day}
          onCalendarTypeChange={setCalendarType}
          onDateChange={(y, m, d) => {
            setYear(y);
            setMonth(m);
            setDay(d);
          }}
        />

        <BirthTimeSection
          timeUnknown={timeUnknown}
          isAm={isAm}
          hour={hour}
          minute={minute}
          regionOffset={selectedRegion.offset}
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
