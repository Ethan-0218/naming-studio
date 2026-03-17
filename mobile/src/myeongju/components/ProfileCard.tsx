import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, ohaengColors, primitives, textStyles } from '@/design-system';
import { MyeongJuProfile, OHAENG_LABEL } from '../types';

const GENDER_COLORS = {
  male:   { bg: primitives.water200, text: primitives.water600, border: primitives.water400 },
  female: { bg: primitives.fire200,  text: primitives.fire600,  border: primitives.fire400  },
} as const;

interface Props {
  profile: MyeongJuProfile;
  onPress: () => void;
}

export default function ProfileCard({ profile, onPress }: Props) {
  const ohaeng = ohaengColors[profile.ohaeng];
  const genderColor = GENDER_COLORS[profile.gender];
  const genderLabel = profile.gender === 'male' ? '남' : '여';
  const hasAnalysis = profile.analysisCount !== undefined;

  return (
    <Pressable
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.surface : colors.surfaceRaised,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'stretch',
        overflow: 'hidden',
      })}
      onPress={onPress}
    >
      {/* 오행 스트립 */}
      <View style={{
        width: 58,
        backgroundColor: ohaeng.light,
        borderRightWidth: 1,
        borderRightColor: ohaeng.border,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        flexShrink: 0,
      }}>
        <Text style={[textStyles.hanjaLg, { fontSize: 22, color: ohaeng.base, marginBottom: 5, lineHeight: 24 }]}>
          {profile.ilgan}
        </Text>
        <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 9.5, letterSpacing: 0.6, color: ohaeng.base, opacity: 0.8 }}>
          {OHAENG_LABEL[profile.ohaeng]}
        </Text>
      </View>

      {/* 본문 */}
      <View style={{ flex: 1, minWidth: 0, padding: 15, gap: 6 }}>

        {/* 일주 + 성별 뱃지 */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 17, letterSpacing: 0.5, color: colors.textPrimary, lineHeight: 22 }}>
            {profile.iljoo}
            <Text style={{ fontFamily: 'NotoSerifKR_300Light', fontSize: 13, letterSpacing: 1, color: colors.textTertiary }}>
              {' '}{profile.iljooHanja}
            </Text>
          </Text>
          <View style={{
            backgroundColor: genderColor.bg,
            borderWidth: 1,
            borderColor: genderColor.border,
            borderRadius: 99,
            paddingVertical: 2,
            paddingHorizontal: 7,
          }}>
            <Text style={{ fontFamily: 'NotoSansKR_500Medium', fontSize: 10, color: genderColor.text }}>
              {genderLabel}
            </Text>
          </View>
        </View>

        {/* 생년월일 */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 4,
              paddingVertical: 1,
              paddingHorizontal: 5,
            }}>
              <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 9.5, color: colors.textDisabled, letterSpacing: 0 }}>
                {profile.calendarType}
              </Text>
            </View>
            <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 12, color: colors.textTertiary, lineHeight: 18 }}>
              {profile.birthDate}
            </Text>
          </View>
          <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 11.5, color: colors.textDisabled, marginTop: 2, lineHeight: 17 }}>
            {profile.birthTime}
          </Text>
        </View>

        {/* 메타 칩 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {!hasAnalysis ? (
            <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 10.5, color: colors.textDisabled }}>
              미분석
            </Text>
          ) : (
            <>
              <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 10.5, color: colors.textTertiary }}>
                분석 {profile.analysisCount}회
              </Text>
              {profile.savedCount !== undefined && (
                <>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong }} />
                  <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 10.5, color: colors.textTertiary }}>
                    저장 {profile.savedCount}개
                  </Text>
                </>
              )}
            </>
          )}
        </View>
      </View>

      {/* chevron */}
      <View style={{ justifyContent: 'center', paddingHorizontal: 14 }}>
        <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
      </View>
    </Pressable>
  );
}
