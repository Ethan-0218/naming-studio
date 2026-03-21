import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ohaengColors, primitives } from '@/design-system';
import { Font } from '@/components/Font';
import { MyeongJuProfile, OHAENG_LABEL } from '../types';

interface Props {
  profile: MyeongJuProfile;
  onPress: () => void;
  onDelete: () => void;
}

export default function ProfileCard({ profile, onPress, onDelete }: Props) {
  const ohaeng = ohaengColors[profile.ohaeng];
  const genderLabel = profile.gender === 'male' ? '남' : '여';
  const hasAnalysis = profile.analysisCount !== undefined;

  return (
    <Pressable
      className="flex-row items-stretch border border-border rounded-[16px] overflow-hidden"
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#f5f5f4' : '#fafaf9',
      })}
      onPress={onPress}
    >
      {/* 오행 스트립 */}
      <View
        className="items-center justify-center py-[18px] shrink-0"
        style={{
          width: 58,
          backgroundColor: ohaeng.light,
          borderRightWidth: 1,
          borderRightColor: ohaeng.border,
        }}
      >
        <Font
          tag="primaryMedium"
          className="shrink-0"
          style={{
            fontSize: 22,
            color: ohaeng.base,
            marginBottom: 5,
            lineHeight: 24,
          }}
        >
          {profile.ilgan}
        </Font>
        <Font
          tag="secondary"
          style={{
            fontSize: 12,
            letterSpacing: 0.6,
            color: ohaeng.base,
            opacity: 0.8,
          }}
        >
          {OHAENG_LABEL[profile.ohaeng]}
        </Font>
      </View>

      {/* 본문 */}
      <View className="flex-1 min-w-0 p-[15px] gap-1.5">
        {/* 일주 + 성별 뱃지 */}
        <View className="flex-row items-end gap-2">
          <Font
            tag="primaryMedium"
            className="text-textPrimary"
            style={{ fontSize: 17, letterSpacing: 0.5, lineHeight: 22 }}
          >
            {profile.iljoo}
            <Font
              tag="primaryLight"
              style={{
                fontSize: 13,
                letterSpacing: 1,
                color: primitives.ink500,
              }}
            >
              {' '}
              {profile.iljooHanja}
            </Font>
          </Font>
          <View className="rounded-full py-0.5 px-[7px] border border-border bg-surface">
            <Font
              tag="secondaryMedium"
              className="text-textSecondary"
              style={{ fontSize: 12 }}
            >
              {genderLabel}
            </Font>
          </View>
        </View>

        {/* 생년월일 */}
        <View>
          <View className="flex-row items-center gap-1">
            <View className="bg-surface border border-border rounded-[4px] py-px px-[5px]">
              <Font
                tag="secondary"
                className="text-textDisabled"
                style={{ fontSize: 12, letterSpacing: 0 }}
              >
                {profile.calendarType}
              </Font>
            </View>
            <Font
              tag="secondary"
              className="text-textTertiary"
              style={{ fontSize: 12, lineHeight: 18 }}
            >
              {profile.birthDate}
            </Font>
          </View>
          <Font
            tag="secondary"
            className="text-textDisabled mt-0.5"
            style={{ fontSize: 12, lineHeight: 17 }}
          >
            {profile.birthTime}
          </Font>
        </View>

        {/* 메타 칩 + 삭제 버튼 */}
        <View className="flex-row items-center">
          <View className="flex-1 flex-row items-center gap-1.5 flex-wrap">
            {!hasAnalysis ? (
              <Font
                tag="secondary"
                className="text-textDisabled"
                style={{ fontSize: 12 }}
              >
                미분석
              </Font>
            ) : (
              <>
                <Font
                  tag="secondary"
                  className="text-textTertiary"
                  style={{ fontSize: 12 }}
                >
                  분석 {profile.analysisCount}회
                </Font>
                {profile.savedCount !== undefined && (
                  <>
                    <View className="w-1 h-1 rounded-full bg-borderStrong" />
                    <Font
                      tag="secondary"
                      className="text-textTertiary"
                      style={{ fontSize: 12 }}
                    >
                      저장 {profile.savedCount}개
                    </Font>
                  </>
                )}
              </>
            )}
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            hitSlop={8}
            className="p-1"
          >
            <Ionicons
              name="trash-outline"
              size={15}
              color={primitives.ink300}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
