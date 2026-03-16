import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { palette, fontFamily, radius, spacing } from '@/design-system';
import { RootStackParamList } from '../navigation/types';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* 헤더 */}
        <View style={s.heroSection}>
          <Text style={s.appTitle}>이름이 ✨</Text>
          <Text style={s.appSubtitle}>아이에게 꼭 맞는 이름을 찾아보세요</Text>
        </View>

        {/* 카드 목록 */}
        <View style={s.cards}>

          {/* AI 작명 카드 */}
          <Pressable
            style={({ pressed }) => [s.card, s.cardAI, pressed && s.cardPressed]}
            onPress={() => navigation.navigate('AINaming')}
          >
            <View style={s.cardAccentAI} />
            <View style={s.cardContent}>
              <Text style={s.cardIcon}>✨</Text>
              <View style={s.cardText}>
                <Text style={s.cardTitle}>AI와 함께 이름짓기</Text>
                <Text style={s.cardSubtitle}>사주, 오행, 수리를 고려한 AI 추천</Text>
              </View>
              <Text style={s.cardArrow}>›</Text>
            </View>
          </Pressable>

          {/* 스스로 작명 카드 */}
          <Pressable
            style={({ pressed }) => [s.card, s.cardSelf, pressed && s.cardPressed]}
            onPress={() => navigation.navigate('SelfNaming')}
          >
            <View style={s.cardAccentSelf} />
            <View style={s.cardContent}>
              <Text style={s.cardIcon}>🔍</Text>
              <View style={s.cardText}>
                <Text style={s.cardTitle}>스스로 이름짓기</Text>
                <Text style={s.cardSubtitle}>한자 의미와 조화를 직접 분석하기</Text>
              </View>
              <Text style={s.cardArrow}>›</Text>
            </View>
          </Pressable>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.appBg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing['5'],
    paddingBottom: spacing['8'],
  },

  heroSection: {
    paddingTop: spacing['10'],
    paddingBottom: spacing['8'],
    alignItems: 'center',
  },
  appTitle: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 36,
    color: palette.ink,
    letterSpacing: 1,
    marginBottom: spacing['2'],
  },
  appSubtitle: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 15,
    color: palette.inkLight,
    lineHeight: 22,
    textAlign: 'center',
  },

  cards: {
    gap: spacing['4'],
  },

  card: {
    backgroundColor: palette.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardAI: {
    borderLeftWidth: 0,
  },
  cardSelf: {
    borderLeftWidth: 0,
  },

  cardAccentAI: {
    height: 4,
    backgroundColor: palette.vermillion,
  },
  cardAccentSelf: {
    height: 4,
    backgroundColor: palette.teal,
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing['6'],
    gap: spacing['4'],
  },
  cardIcon: {
    fontSize: 32,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 18,
    color: palette.ink,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 13,
    color: palette.inkLight,
    lineHeight: 18,
  },
  cardArrow: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 24,
    color: palette.inkFaint,
  },
});
