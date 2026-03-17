import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, textStyles, radius } from '@/design-system';
import { Region } from '../data';

interface Props {
  selectedRegion: Region | null;
  onOpen: () => void;
}

export default function BirthRegionSection({ selectedRegion, onOpen }: Props) {
  const hasRegion = selectedRegion !== null;

  const noticeText = () => {
    if (!hasRegion) {
      return (
        <Text style={{ fontFamily: fontFamily.sansRegular, fontSize: 11.5, color: colors.textTertiary, lineHeight: 19 }}>
          출생 지역에 따라{' '}
          <Text style={{ fontFamily: fontFamily.sansMedium, color: colors.textSecondary }}>
            표준시와 실제 태양시의 차이
          </Text>
          {'가 발생합니다. 정확한 사주 계산을 위해 지방시 보정이 필요합니다.'}
        </Text>
      );
    }
    const r = selectedRegion!;
    return (
      <Text style={{ fontFamily: fontFamily.sansRegular, fontSize: 11.5, color: colors.textTertiary, lineHeight: 19 }}>
        출생 지역에 따라{' '}
        <Text style={{ fontFamily: fontFamily.sansMedium, color: colors.textSecondary }}>
          표준시와 실제 태양시의 차이
        </Text>
        {'가 발생합니다. 정확한 사주 계산을 위해 지방시 보정이 필요합니다.'}
        {r.offset !== null && (
          <Text style={{ fontFamily: fontFamily.sansMedium, color: colors.fillAccent }}>
            {`  ${r.name} 기준 약 ${r.offset}분 차이`}
          </Text>
        )}
      </Text>
    );
  };

  return (
    <View style={{
      paddingHorizontal: 20,
      paddingVertical: 22,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      {/* 섹션 라벨 */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
        <Text style={[textStyles.overline, { color: colors.textTertiary }]}>출생 지역</Text>
        <Text style={{
          fontFamily: fontFamily.sansRegular,
          fontSize: 9,
          letterSpacing: 0.8,
          color: colors.textDisabled,
        }}>
          지방시 보정
        </Text>
      </View>

      {/* 지역 선택 버튼 */}
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: colors.surfaceRaised,
          borderWidth: 1.5,
          borderColor: hasRegion ? colors.borderStrong : colors.border,
          borderRadius: radius.lg,
          height: 52,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          opacity: pressed ? 0.85 : 1,
        })}
        onPress={onOpen}
      >
        <Ionicons
          name="location-outline"
          size={16}
          color={hasRegion ? colors.textTertiary : colors.textDisabled}
        />
        {hasRegion ? (
          <Text style={{
            flex: 1,
            fontFamily: fontFamily.serifRegular,
            fontSize: 15,
            color: colors.textPrimary,
          }}>
            {selectedRegion!.name}
          </Text>
        ) : (
          <Text style={{
            flex: 1,
            fontFamily: fontFamily.sansRegular,
            fontSize: 14,
            color: colors.textDisabled,
          }}>
            지역 선택
          </Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </Pressable>

      {/* 지방시 보정 안내 */}
      <View style={{
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 7,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: 10,
        paddingHorizontal: 12,
      }}>
        <Ionicons
          name="information-circle-outline"
          size={13}
          color={colors.textTertiary}
          style={{ marginTop: 2 }}
        />
        {noticeText()}
      </View>
    </View>
  );
}
