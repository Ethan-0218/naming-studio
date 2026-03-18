import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { colors } from '@/design-system';
import NavBar from '@/components/NavBar';
import { useNamingToolState } from '../hooks/useNamingToolState';
import { useMyeongJuList } from '@/myeongju/hooks/useMyeongJuList';
import NameInputSection from './NameInputSection';
import BaleumOhaengSection from './BaleumOhaengSection';
import BaleumEumyangSection from './BaleumEumyangSection';
import YongsinSection from './YongsinSection';
import SurigyeokSection from './SurigyeokSection';
import JawonOhaengSection from './JawonOhaengSection';
import HoeksuEumyangSection from './HoeksuEumyangSection';
import ScoreSummarySection from './ScoreSummarySection';
import MyeongJuStrip from './MyeongJuStrip';

interface Props {
  onBack: () => void;
  profileId: string;
  onChangeMyeongJu: () => void;
}

function Divider() {
  return <View className="h-[1px] bg-border my-4" />;
}

export default function NamingToolScreen({
  onBack,
  profileId,
  onChangeMyeongJu,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const { data: profiles = [] } = useMyeongJuList();
  const selectedProfile = profiles.find((p) => p.id === profileId) ?? null;
  const {
    nameInput,
    sajuInput,
    gender,
    setGender,
    analysis,
    updateHangul,
    updateHanja,
    updateSaju,
  } = useNamingToolState();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        backgroundColor: colors.bgSubtle,
      }}
    >
      <SafeAreaView
        edges={['top']}
        style={{ backgroundColor: colors.bgSubtle }}
      >
        <NavBar
          title="스스로 이름짓기"
          subtitle="이름 분석 및 작명"
          onBack={onBack}
        />
      </SafeAreaView>

      {selectedProfile && (
        <MyeongJuStrip profile={selectedProfile} onPress={onChangeMyeongJu} />
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottom + 16,
          backgroundColor: colors.bg,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <NameInputSection
          analysis={analysis}
          nameInput={nameInput}
          onUpdateHangul={updateHangul}
          onUpdateHanja={updateHanja}
          gender={gender}
          onGenderChange={setGender}
        />

        <Divider />

        <BaleumOhaengSection
          nameInput={nameInput}
          result={analysis.baleumOhaeng}
        />

        <Divider />

        <BaleumEumyangSection
          nameInput={nameInput}
          result={analysis.baleumEumyang}
        />

        <Divider />

        <YongsinSection
          sajuInput={sajuInput}
          nameInput={nameInput}
          onUpdate={updateSaju}
        />

        <Divider />

        <SurigyeokSection
          nameInput={nameInput}
          gender={gender}
          result={analysis.surigyeok}
        />

        <Divider />

        <JawonOhaengSection
          nameInput={nameInput}
          result={analysis.jawonOhaeng}
        />

        <Divider />

        <HoeksuEumyangSection
          nameInput={nameInput}
          result={analysis.hoeksuEumyang}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
