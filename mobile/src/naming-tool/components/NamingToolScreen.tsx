import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { colors, fontFamily } from '@/design-system';
import { useNamingToolState } from '../hooks/useNamingToolState';
import NameInputSection from './NameInputSection';
import BaleumOhaengSection from './BaleumOhaengSection';
import BaleumEumyangSection from './BaleumEumyangSection';
import YongsinSection from './YongsinSection';
import SurigyeokSection from './SurigyeokSection';
import JawonOhaengSection from './JawonOhaengSection';
import HoeksuEumyangSection from './HoeksuEumyangSection';
import ScoreSummarySection from './ScoreSummarySection';

interface Props {
  onBack: () => void;
}

function Divider() {
  return <View className="h-[1px] bg-border my-4" />;
}

export default function NamingToolScreen({ onBack }: Props) {
  const {
    nameInput,
    sajuInput,
    gender,
    setGender,
    analysis,
    updateSlot,
    updateSaju,
  } = useNamingToolState();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="bg-bgSubtle flex-1 flex-col"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}
    >
      <View
        className="w-full bg-surfaceRaised flex-row items-center justify-between
        px-4 pb-3 bg-bg border-b border-border border-solid"
        style={{ paddingTop: Platform.OS === 'ios' ? 56 : 16 }}
      >
        <Pressable onPress={onBack} className="w-[60px] py-2">
          <Text
            className="text-bodySm text-textSecondary"
            style={{ fontFamily: fontFamily.sansRegular }}
          >
            ← 채팅
          </Text>
        </Pressable>
        <View className="flex-1 items-center justify-center px-2 flex-col gap-1">
          <Text
            className="text-title1 text-textPrimary"
            style={{ fontFamily: fontFamily.serifMedium }}
          >
            스스로 이름짓기
          </Text>
          <Text
            className="text-overline text-textTertiary mt-0.5"
            style={{ fontFamily: fontFamily.sansMedium }}
          >
            이름 분석 및 작명
          </Text>
        </View>
        <View className="w-[60px]" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, backgroundColor: colors.bg }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <NameInputSection
          analysis={analysis}
          nameInput={nameInput}
          onUpdate={updateSlot}
          gender={gender}
          onGenderChange={setGender}
        />

        <Divider />

        <BaleumOhaengSection nameInput={nameInput} result={analysis.baleumOhaeng} />

        <Divider />

        <BaleumEumyangSection nameInput={nameInput} result={analysis.baleumEumyang} />

        <Divider />

        <YongsinSection sajuInput={sajuInput} nameInput={nameInput} onUpdate={updateSaju} />

        <Divider />

        <SurigyeokSection
          nameInput={nameInput}
          gender={gender}
          result={analysis.surigyeok}
        />

        <Divider />

        <JawonOhaengSection nameInput={nameInput} result={analysis.jawonOhaeng} />

        <Divider />

        <HoeksuEumyangSection
          nameInput={nameInput}
          result={analysis.hoeksuEumyang}
        />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
