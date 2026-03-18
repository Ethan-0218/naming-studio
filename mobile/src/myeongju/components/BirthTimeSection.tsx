import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { primitives } from '@/design-system';
import { getSijan } from '../data';

interface Props {
  timeUnknown: boolean;
  isAm: boolean;
  hour: number;   // 1–12
  minute: number; // 0–50 (10분 단위)
  regionOffset: number | null;
  onToggleUnknown: () => void;
  onAmPmChange: (isAm: boolean) => void;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
}

export default function BirthTimeSection({
  timeUnknown, isAm, hour, minute, regionOffset,
  onToggleUnknown, onAmPmChange, onHourChange, onMinuteChange,
}: Props) {
  const hour24 = isAm ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
  const totalMinutes = hour24 * 60 + minute - (regionOffset ?? 0);
  const adjustedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const adjustedHour24 = Math.floor(adjustedMinutes / 60);
  const adjustedMin = adjustedMinutes % 60;
  const sijan = getSijan(adjustedHour24);
  const adjustedIsAm = adjustedHour24 < 12;
  const adjustedHourDisplay = adjustedHour24 % 12 === 0 ? 12 : adjustedHour24 % 12;
  const adjustedAmPm = adjustedIsAm ? '오전' : '오후';

  return (
    <View className="px-5 py-[22px] border-b border-border">
      {/* 섹션 라벨 */}
      <View className="flex-row items-end gap-1.5 mb-3.5">
        <Text className="text-overline text-textTertiary">생시</Text>
        <Text className="text-[9px] text-textDisabled" style={{ letterSpacing: 0.8 }}>
          태어난 시각
        </Text>
      </View>

      {/* 생시 모름 토글 */}
      <Pressable
        className={`flex-row items-center justify-between bg-surface border-[1.5px] rounded-lg px-[14px] py-[11px] mb-3.5 ${timeUnknown ? 'border-borderStrong' : 'border-border'}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        onPress={onToggleUnknown}
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="information-circle-outline" size={15} color={primitives.stone400} />
          <Text className="text-[13px] font-sansRegular text-textSecondary">
            생시를 모릅니다
          </Text>
        </View>

        {/* custom toggle switch */}
        <View
          className={`rounded-full justify-center px-[3px] ${timeUnknown ? 'bg-textSecondary' : 'bg-borderStrong'}`}
          style={{ width: 42, height: 24 }}
        >
          <View
            className={`rounded-full bg-white ${timeUnknown ? 'self-end' : 'self-start'}`}
            style={{
              width: 18, height: 18,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 2,
            }}
          />
        </View>
      </Pressable>

      {/* 시간 입력 (생시 모름이 아닐 때) */}
      {!timeUnknown && (
        <>
          {/* 오전/오후 + 시:분 */}
          <View className="flex-row gap-2 mb-3">
            {/* 오전/오후 세로 토글 */}
            <View className="border-[1.5px] border-border rounded-lg overflow-hidden shrink-0" style={{ width: 52 }}>
              <Pressable
                className={`py-2.5 items-center justify-center ${isAm ? 'bg-fillBold' : 'bg-transparent'}`}
                style={{ minHeight: 34 }}
                onPress={() => onAmPmChange(true)}
              >
                <Text
                  className={`font-sans-medium text-[12px] ${isAm ? 'text-textInverse' : 'text-textDisabled'}`}
                  style={{ letterSpacing: 0.4 }}
                >
                  오전
                </Text>
              </Pressable>

              <View className="h-px bg-border" />

              <Pressable
                className={`py-2.5 items-center justify-center ${!isAm ? 'bg-fillBold' : 'bg-transparent'}`}
                style={{ minHeight: 34 }}
                onPress={() => onAmPmChange(false)}
              >
                <Text
                  className={`font-sans-medium text-[12px] ${!isAm ? 'text-textInverse' : 'text-textDisabled'}`}
                  style={{ letterSpacing: 0.4 }}
                >
                  오후
                </Text>
              </Pressable>
            </View>

            {/* 시:분 표시 */}
            <View className="flex-1 flex-row items-center justify-center gap-1 px-4 h-[68px] bg-surfaceRaised border-[1.5px] border-borderStrong rounded-lg">
              <Pressable onPress={() => onHourChange(hour % 12 + 1)}>
                <Text
                  className="font-serif text-textPrimary text-center"
                  style={{ fontSize: 34, lineHeight: 34, letterSpacing: -1, minWidth: 48 }}
                >
                  {String(hour).padStart(2, '0')}
                </Text>
              </Pressable>

              <Text
                className="font-serif text-textTertiary"
                style={{ fontSize: 28, lineHeight: 28, paddingBottom: 4 }}
              >
                :
              </Text>

              <Pressable onPress={() => onMinuteChange((minute + 10) % 60)}>
                <Text
                  className="font-serif text-textPrimary text-center"
                  style={{ fontSize: 34, lineHeight: 34, letterSpacing: -1, minWidth: 48 }}
                >
                  {String(minute).padStart(2, '0')}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 시진 결과 카드 */}
          <View
            className="flex-row items-center gap-3.5 rounded-lg p-[14px] px-4 border-[1.5px] bg-fillAccentSub"
            style={{ borderColor: primitives.gold400 }}
          >
            {/* 대표 한자 */}
            <Text
              className="font-serif text-fillAccent shrink-0"
              style={{ fontSize: 36, lineHeight: 36 }}
            >
              {sijan.hanja}
            </Text>

            <View>
              {/* 시진 이름 + 한자 */}
              <View className="flex-row items-end gap-1.5 mb-[3px]">
                <Text
                  className="font-serif-medium text-fillAccent"
                  style={{ fontSize: 18, letterSpacing: 0.5 }}
                >
                  {sijan.name}
                </Text>
                <Text
                  className="font-serif"
                  style={{ fontSize: 14, letterSpacing: 1, color: primitives.gold400 }}
                >
                  {sijan.hanjaFull}
                </Text>
              </View>

              {/* 시간 범위 */}
              <Text
                className="font-sansRegular text-textTertiary"
                style={{ fontSize: 12, letterSpacing: 0.4 }}
              >
                {sijan.range}
              </Text>

              {/* 안내 */}
              <Text
                className="font-sansRegular mt-[2px]"
                style={{ fontSize: 11, color: primitives.gold400 }}
              >
                사주의 시주(時柱)로 사용됩니다
              </Text>

              {/* 지방시 보정 표시 */}
              {regionOffset != null && regionOffset !== 0 && (
                <Text
                  className="font-sansRegular text-textTertiary mt-[3px]"
                  style={{ fontSize: 10 }}
                >
                  {`지역 보정 후: ${adjustedAmPm} ${adjustedHourDisplay}:${String(adjustedMin).padStart(2, '0')}`}
                </Text>
              )}
            </View>
          </View>
        </>
      )}
    </View>
  );
}
