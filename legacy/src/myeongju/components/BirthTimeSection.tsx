import React, { useRef, useEffect, useState } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, primitives } from '@/design-system';
import { Font } from '@/components/Font';
import { getSijan } from '../data';
import TimePickerSheet from './TimePickerSheet';

interface Props {
  timeUnknown: boolean;
  isAm: boolean;
  hour: number; // 1–12
  minute: number; // 0–59
  regionOffset: number | null;
  onToggleUnknown: () => void;
  onAmPmChange: (isAm: boolean) => void;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
}

const THUMB_TRAVEL = 18;

export default function BirthTimeSection({
  timeUnknown,
  isAm,
  hour,
  minute,
  regionOffset,
  onToggleUnknown,
  onAmPmChange,
  onHourChange,
  onMinuteChange,
}: Props) {
  const hour24 = isAm ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;
  const totalMinutes = hour24 * 60 + minute - (regionOffset ?? 0);
  const adjustedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const adjustedHour24 = Math.floor(adjustedMinutes / 60);
  const adjustedMin = adjustedMinutes % 60;
  const sijan = getSijan(adjustedHour24);
  const adjustedIsAm = adjustedHour24 < 12;
  const adjustedHourDisplay =
    adjustedHour24 % 12 === 0 ? 12 : adjustedHour24 % 12;
  const adjustedAmPm = adjustedIsAm ? '오전' : '오후';

  const [pickerVisible, setPickerVisible] = useState(false);

  // 스위치 애니메이션
  const switchAnim = useRef(new Animated.Value(timeUnknown ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(switchAnim, {
      toValue: timeUnknown ? 1 : 0,
      useNativeDriver: false,
      damping: 18,
      stiffness: 280,
    }).start();
  }, [timeUnknown]);

  const thumbTranslateX = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, THUMB_TRAVEL],
  });
  const trackBg = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [primitives.hanji500, primitives.ink700],
  });

  function handleTimeConfirm(
    newIsAm: boolean,
    newHour: number,
    newMinute: number,
  ) {
    onAmPmChange(newIsAm);
    onHourChange(newHour);
    onMinuteChange(newMinute);
  }

  return (
    <View className="px-5 py-[22px] border-b border-border">
      {/* 섹션 라벨 */}
      <View className="flex-row items-end gap-1.5 mb-2.5">
        <Font
          tag="secondaryMedium"
          style={{ fontSize: 13, color: colors.textTertiary }}
        >
          생시
        </Font>
        <Font
          tag="secondary"
          className="text-textDisabled"
          style={{ fontSize: 12, letterSpacing: 0.8 }}
        >
          태어난 시각
        </Font>
      </View>

      {/* 생시 모름 토글 */}
      <Pressable
        className={`flex-row items-center justify-between bg-surface border-[1.5px] rounded-lg px-[14px] py-[11px] mb-3.5 ${timeUnknown ? 'border-borderStrong' : 'border-border'}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        onPress={onToggleUnknown}
      >
        <View className="flex-row items-center gap-2">
          <Ionicons
            name="information-circle-outline"
            size={15}
            color={primitives.ink500}
          />
          <Font
            tag="secondary"
            className="text-textSecondary"
            style={{ fontSize: 13 }}
          >
            생시를 모릅니다
          </Font>
        </View>

        {/* 애니메이션 토글 스위치 */}
        <Animated.View
          className="rounded-full justify-center px-[3px]"
          style={{ width: 42, height: 24, backgroundColor: trackBg }}
        >
          <Animated.View
            className="rounded-full bg-white"
            style={{
              width: 18,
              height: 18,
              transform: [{ translateX: thumbTranslateX }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 2,
            }}
          />
        </Animated.View>
      </Pressable>

      {/* 시간 입력 (생시 모름이 아닐 때) */}
      {!timeUnknown && (
        <>
          {/* 오전/오후 + 시:분 */}
          <View className="flex-row gap-2 mb-3">
            {/* 오전/오후 세로 토글 */}
            <View
              className="border-[1.5px] border-border rounded-lg overflow-hidden shrink-0"
              style={{ width: 52 }}
            >
              <Pressable
                className={`py-2.5 items-center justify-center ${isAm ? 'bg-fillBold' : 'bg-transparent'}`}
                style={{ minHeight: 34 }}
                onPress={() => onAmPmChange(true)}
              >
                <Font
                  tag="secondaryMedium"
                  className={isAm ? 'text-textInverse' : 'text-textDisabled'}
                  style={{ fontSize: 12, letterSpacing: 0.4 }}
                >
                  오전
                </Font>
              </Pressable>

              <View className="h-px bg-border" />

              <Pressable
                className={`py-2.5 items-center justify-center ${!isAm ? 'bg-fillBold' : 'bg-transparent'}`}
                style={{ minHeight: 34 }}
                onPress={() => onAmPmChange(false)}
              >
                <Font
                  tag="secondaryMedium"
                  className={!isAm ? 'text-textInverse' : 'text-textDisabled'}
                  style={{ fontSize: 12, letterSpacing: 0.4 }}
                >
                  오후
                </Font>
              </Pressable>
            </View>

            {/* 시:분 표시 — 탭하면 피커 오픈 */}
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-1 px-4 h-[68px] bg-surfaceRaised border-[1.5px] border-borderStrong rounded-lg"
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              onPress={() => setPickerVisible(true)}
            >
              <Font
                tag="primary"
                className="text-textPrimary text-center"
                style={{
                  fontSize: 34,
                  lineHeight: 44,
                  letterSpacing: -1,
                  minWidth: 48,
                }}
              >
                {String(hour).padStart(2, '0')}
              </Font>
              <Font
                tag="primary"
                className="text-textTertiary"
                style={{ fontSize: 28, lineHeight: 44, paddingBottom: 2 }}
              >
                :
              </Font>
              <Font
                tag="primary"
                className="text-textPrimary text-center"
                style={{
                  fontSize: 34,
                  lineHeight: 44,
                  letterSpacing: -1,
                  minWidth: 48,
                }}
              >
                {String(minute).padStart(2, '0')}
              </Font>
            </Pressable>
          </View>

          {/* 시진 결과 카드 */}
          <View
            className="flex-row items-center gap-3.5 rounded-lg p-[14px] px-4 border-[1.5px] bg-fillAccentSub"
            style={{ borderColor: primitives.gold400 }}
          >
            {/* 대표 한자 */}
            <Font
              tag="primaryMedium"
              className="text-fillAccent shrink-0"
              style={{ fontSize: 36, lineHeight: 44 }}
            >
              {sijan.hanja}
            </Font>

            <View>
              {/* 시진 이름 + 한자 */}
              <View className="flex-row items-end gap-1.5 mb-[3px]">
                <Font
                  tag="primaryMedium"
                  className="text-fillAccent"
                  style={{ fontSize: 18, letterSpacing: 0.5 }}
                >
                  {sijan.name}
                </Font>
                <Font
                  tag="primaryLight"
                  style={{
                    fontSize: 14,
                    letterSpacing: 1,
                    color: primitives.gold400,
                  }}
                >
                  {sijan.hanjaFull}
                </Font>
              </View>

              {/* 시간 범위 */}
              <Font
                tag="secondary"
                className="text-textTertiary"
                style={{ fontSize: 12, letterSpacing: 0.4 }}
              >
                {sijan.range}
              </Font>

              {/* 안내 */}
              <Font
                tag="secondary"
                className="mt-[2px]"
                style={{ fontSize: 12, color: primitives.gold400 }}
              >
                사주의 시주(時柱)로 사용됩니다
              </Font>

              {/* 지방시 보정 표시 */}
              {regionOffset != null && regionOffset !== 0 && (
                <Font
                  tag="secondary"
                  className="text-textTertiary mt-[3px]"
                  style={{ fontSize: 12 }}
                >
                  {`지역 보정 후: ${adjustedAmPm} ${adjustedHourDisplay}:${String(adjustedMin).padStart(2, '0')}`}
                </Font>
              )}
            </View>
          </View>

          <TimePickerSheet
            visible={pickerVisible}
            isAm={isAm}
            hour={hour}
            minute={minute}
            onConfirm={handleTimeConfirm}
            onClose={() => setPickerVisible(false)}
          />
        </>
      )}
    </View>
  );
}
