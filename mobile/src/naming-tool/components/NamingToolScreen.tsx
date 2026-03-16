import React from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { palette, textStyles, spacing } from '@/design-system';
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
  return <View style={styles.divider} />;
}


export default function NamingToolScreen({ onBack }: Props) {
  const {
    nameInput, sajuInput, gender, setGender,
    analysis, updateSlot, updateSaju,
  } = useNamingToolState();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={[textStyles.body, { color: palette.inkMid }]}>← 채팅</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[textStyles.appTitle, { color: palette.ink }]}>스스로 이름짓기</Text>
          <Text style={[textStyles.sectionLabel, { color: palette.inkLight, marginTop: 1 }]}>
            이름 분석 및 작명
          </Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <NameInputSection
          analysis={analysis}
          nameInput={nameInput}
          onUpdate={updateSlot}
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

        <View style={{ height: spacing['10'] }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.appBg,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing['4'],
    paddingTop: Platform.OS === 'ios' ? 56 : spacing['4'],
    paddingBottom: spacing['3'],
    backgroundColor: palette.bg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  backBtn: {
    width: 60,
    paddingVertical: spacing['1'],
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing['4'],
    backgroundColor: palette.bg,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: spacing['4'],
  },
});
