import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ohaengColors, colors } from '@/design-system';
import { Font } from '@/components/Font';
import { MyeongJuProfile } from '@/myeongju/types';

// "묘시(卯時) · 오전 5:30" → "묘시"
function extractTimePeriod(birthTime: string): string {
  return birthTime.split('(')[0].split('·')[0].trim();
}

interface Props {
  profile: MyeongJuProfile;
  onPress?: () => void;
  readOnly?: boolean;
}

export default function MyeongJuStrip({
  profile,
  onPress,
  readOnly = false,
}: Props) {
  const ohaeng = ohaengColors[profile.ohaeng];
  const genderLabel = profile.gender === 'male' ? '남' : '여';
  const timePeriod = extractTimePeriod(profile.birthTime);

  const Container = readOnly ? View : TouchableOpacity;
  const containerProps = readOnly ? {} : { onPress, activeOpacity: 0.7 };

  return (
    <Container
      className="flex-row items-center border-b border-border bg-bgSubtle"
      {...(containerProps as any)}
    >
      {/* 오행 뱃지 */}
      <View className="pl-4">
        <View
          className="items-center justify-center self-stretch px-3 py-1 
          rounded-md"
          style={{
            backgroundColor: ohaeng.light,
          }}
        >
          <Font
            tag="primaryMedium"
            style={{ fontSize: 20, color: ohaeng.base, lineHeight: 24 }}
          >
            {profile.ilgan}
          </Font>
          <Font
            tag="secondary"
            style={{
              fontSize: 12,
              letterSpacing: 0.4,
              color: ohaeng.base,
              opacity: 0.8,
            }}
          >
            {profile.ohaeng}
          </Font>
        </View>
      </View>

      {/* 명주 정보 */}
      <View className="flex-1 min-w-0 px-3 py-3 gap-1">
        {/* 일주명 + 한자 */}
        <View className="flex-row items-center gap-1.5">
          <Font
            tag="primaryMedium"
            style={{
              fontSize: 15,
              letterSpacing: 0.3,
              color: colors.textPrimary,
            }}
          >
            {profile.iljoo}
          </Font>
          <Font
            tag="secondary"
            style={{
              fontSize: 12,
              letterSpacing: 0.8,
              color: colors.textTertiary,
            }}
          >
            {profile.iljooHanja}
          </Font>
        </View>

        {/* 성별 · 생년월일 · 생시 */}
        <View className="flex-row items-center gap-1.5">
          <View className="rounded-full py-px px-[6px] border border-border bg-surface">
            <Font
              tag="secondaryMedium"
              style={{ fontSize: 12, color: colors.textSecondary }}
            >
              {genderLabel}
            </Font>
          </View>
          <Font
            tag="secondary"
            style={{ fontSize: 12, color: colors.textTertiary }}
          >
            {'· '}
            {profile.birthDate}
            {'  ·  '}
            {timePeriod}
          </Font>
        </View>
      </View>

      {/* chevron */}
      {!readOnly && (
        <View className="px-4">
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
          />
        </View>
      )}
    </Container>
  );
}
