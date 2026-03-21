import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, primitives } from '@/design-system';
import { Font } from '@/components/Font';
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
        <Font
          tag="secondary"
          className="text-textTertiary flex-1"
          style={{ fontSize: 12, lineHeight: 19 }}
        >
          {'출생 지역에 따라 '}
          <Font tag="secondaryMedium" className="text-textSecondary">
            표준시와 실제 태양시의 차이
          </Font>
          {'가 발생합니다. 정확한 사주 계산을 위해 지방시 보정이 필요합니다.'}
        </Font>
      );
    }
    const r = selectedRegion!;
    return (
      <Font
        tag="secondary"
        className="text-textTertiary flex-1"
        style={{ fontSize: 11.5, lineHeight: 19 }}
      >
        {'출생 지역에 따라 '}
        <Font tag="secondaryMedium" className="text-textSecondary">
          표준시와 실제 태양시의 차이
        </Font>
        {'가 발생합니다. 정확한 사주 계산을 위해 지방시 보정이 필요합니다.'}
        {r.offset !== null && (
          <Font tag="secondaryMedium" className="text-fillAccent">
            {`  ${r.name} 기준 약 ${r.offset}분 차이`}
          </Font>
        )}
      </Font>
    );
  };

  return (
    <View className="px-5 py-[22px] border-b border-border">
      {/* 섹션 라벨 */}
      <View className="flex-row items-end gap-1.5 mb-2.5">
        <Font
          tag="secondaryMedium"
          style={{ fontSize: 13, color: colors.textTertiary }}
        >
          출생 지역
        </Font>
        <Font
          tag="secondary"
          className="text-textDisabled"
          style={{ fontSize: 12, letterSpacing: 0.8 }}
        >
          지방시 보정
        </Font>
      </View>

      {/* 지역 선택 버튼 */}
      <Pressable
        className={`flex-row items-center gap-2.5 bg-surfaceRaised border-[1.5px] rounded-lg h-[52px] px-[14px] ${hasRegion ? 'border-borderStrong' : 'border-border'}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        onPress={onOpen}
      >
        <Ionicons
          name="location-outline"
          size={16}
          color={hasRegion ? primitives.ink500 : primitives.ink300}
        />
        {hasRegion ? (
          <Font
            tag="primary"
            className="flex-1 text-textPrimary"
            style={{ fontSize: 15 }}
          >
            {selectedRegion!.name}
          </Font>
        ) : (
          <Font
            tag="secondary"
            className="flex-1 text-textDisabled"
            style={{ fontSize: 14 }}
          >
            지역 선택
          </Font>
        )}
        <Ionicons name="chevron-forward" size={16} color={primitives.ink500} />
      </Pressable>

      {/* 지방시 보정 안내 */}
      <View className="flex-row items-start gap-[7px] mt-2.5 bg-surface border border-border rounded-md p-2.5 px-3">
        <Ionicons
          name="information-circle-outline"
          size={13}
          color={primitives.ink500}
          style={{ marginTop: 2 }}
        />
        {noticeText()}
      </View>
    </View>
  );
}
