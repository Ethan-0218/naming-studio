import NavBar from '@/components/NavBar';
import { colors } from '@/design-system';
import { useMyeongJuList } from '@/myeongju/hooks/useMyeongJuList';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSelfNamingPremium } from '@/payment/hooks/useSelfNamingPremium';
import SelfNamingPaywallOverlay from '@/payment/components/SelfNamingPaywallOverlay';
import { Font } from '@/components/Font';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNamingToolState } from '../hooks/useNamingToolState';
import BaleumEumyangSection from '@/components/naming/BaleumEumyangSection';
import BaleumOhaengSection from '@/components/naming/BaleumOhaengSection';
import HoeksuEumyangSection from '@/components/naming/HoeksuEumyangSection';
import JawonOhaengSection from '@/components/naming/JawonOhaengSection';
import MyeongJuStrip from './MyeongJuStrip';
import NameInputSection from './NameInputSection';
import SurigyeokSection from '@/components/naming/SurigyeokSection';
import YongsinSection from '@/components/naming/YongsinSection';

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
  const { data: profiles = [] } = useMyeongJuList();
  const selectedProfile = profiles.find((p) => p.id === profileId) ?? null;
  const gender = selectedProfile?.gender ?? 'male';
  const { nameInput, analysis, updateHangul, updateHanja } =
    useNamingToolState(gender);

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const isPremium = useSelfNamingPremium();

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
          lockedSurname={
            selectedProfile
              ? {
                  hangul: selectedProfile.surname,
                  hanja: selectedProfile.surnameHanja,
                }
              : undefined
          }
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
            yongsin={selectedProfile?.yongsin ?? null}
            heesin={selectedProfile?.heesin ?? null}
            gisin={selectedProfile?.gisin ?? null}
            nameInput={nameInput}
            isPurchased={isPremium}
            onPressBuy={isPremium ? undefined : () => setShowPremiumModal(true)}
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

      <SelfNamingPaywallOverlay
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSuccess={() => setShowPremiumModal(false)}
      />
    </KeyboardAvoidingView>
  );
}
