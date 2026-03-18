import NavBar from '@/components/NavBar';
import { colors } from '@/design-system';
import { useAuth } from '@/auth/AuthContext';
import { useMyeongJuList } from '@/myeongju/hooks/useMyeongJuList';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Font } from '@/components/Font';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNamingToolState } from '../hooks/useNamingToolState';
import BaleumEumyangSection from './BaleumEumyangSection';
import BaleumOhaengSection from './BaleumOhaengSection';
import HoeksuEumyangSection from './HoeksuEumyangSection';
import JawonOhaengSection from './JawonOhaengSection';
import MyeongJuStrip from './MyeongJuStrip';
import NameInputSection from './NameInputSection';
import SurigyeokSection from './SurigyeokSection';
import YongsinSection from './YongsinSection';

interface Props {
  onBack: () => void;
  profileId: string;
  onChangeMyeongJu: () => void;
}

function Divider() {
  return <View className="h-[1px] bg-border my-5" />;
}

function GroupTitle({ children }: { children: string }) {
  return (
    <Font tag="primaryMedium" className="text-heading text-textPrimary mb-3">
      {children}
    </Font>
  );
}

export default function NamingToolScreen({
  onBack,
  profileId,
  onChangeMyeongJu,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const { auth } = useAuth();
  const { data: profiles = [] } = useMyeongJuList();
  const selectedProfile = profiles.find((p) => p.id === profileId) ?? null;
  const gender = selectedProfile?.gender ?? 'male';
  const {
    nameInput,
    sajuInput,
    analysis,
    updateHangul,
    updateHanja,
    updateSaju,
  } = useNamingToolState(gender);

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
        />

        <Divider />

        <GroupTitle>한글 이름 평가</GroupTitle>
        <View style={{ gap: 12 }}>
          <BaleumOhaengSection
            nameInput={nameInput}
            result={analysis.baleumOhaeng}
          />
          <BaleumEumyangSection
            nameInput={nameInput}
            result={analysis.baleumEumyang}
          />
        </View>

        <Divider />

        <GroupTitle>한자 이름 평가</GroupTitle>
        <View style={{ gap: 12 }}>
          <YongsinSection
            sajuInput={sajuInput}
            nameInput={nameInput}
            onUpdate={updateSaju}
            isPurchased={auth.profile?.isPremium ?? false}
          />
          <SurigyeokSection
            nameInput={nameInput}
            gender={gender}
            result={analysis.surigyeok}
          />
          <JawonOhaengSection
            nameInput={nameInput}
            result={analysis.jawonOhaeng}
          />
          <HoeksuEumyangSection
            nameInput={nameInput}
            result={analysis.hoeksuEumyang}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
