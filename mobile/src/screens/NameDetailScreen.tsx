import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import NavBar from '@/components/NavBar';
import { Font } from '@/components/Font';
import { colors } from '@/design-system';
import { RootStackParamList } from '@/navigation/types';
import { useMyeongJuList } from '@/myeongju/hooks/useMyeongJuList';
import MyeongJuStrip from '@/naming-tool/components/MyeongJuStrip';
import NameDisplaySection from '@/components/naming/NameDisplaySection';
import BaleumOhaengSection from '@/components/naming/BaleumOhaengSection';
import BaleumEumyangSection from '@/components/naming/BaleumEumyangSection';
import YongsinSection from '@/components/naming/YongsinSection';
import SurigyeokSection from '@/components/naming/SurigyeokSection';
import JawonOhaengSection from '@/components/naming/JawonOhaengSection';
import HoeksuEumyangSection from '@/components/naming/HoeksuEumyangSection';
import { nameDataToNameInput } from '@/ai-naming/utils';
import { computeNamingAnalysis } from '@/naming-tool/domain/analysis';
import { SajuInput } from '@/naming-tool/types';

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

export default function NameDetailScreen() {
  const navigation = useNavigation<any>();
  const { nameData, profileId } =
    useRoute<RouteProp<RootStackParamList, 'NameDetail'>>().params;
  const { bottom } = useSafeAreaInsets();

  const { data: profiles = [] } = useMyeongJuList();
  const profile = profiles.find((p) => p.id === profileId) ?? null;
  const gender = profile?.gender ?? 'male';

  const nameInput = useMemo(() => nameDataToNameInput(nameData), [nameData]);

  const [sajuInput, setSajuInput] = useState<SajuInput>({ yongsin: null });

  const analysis = useMemo(
    () => computeNamingAnalysis(nameInput, sajuInput, gender),
    [nameInput, sajuInput, gender],
  );

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
          title={nameData.한글}
          subtitle="이름 상세 분석"
          onBack={() => navigation.goBack()}
        />
      </SafeAreaView>

      {profile && <MyeongJuStrip profile={profile} readOnly />}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottom + 16,
          backgroundColor: colors.bg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <NameDisplaySection nameInput={nameInput} analysis={analysis} />

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
            onUpdate={(data) => setSajuInput((prev) => ({ ...prev, ...data }))}
            isPurchased={true}
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
