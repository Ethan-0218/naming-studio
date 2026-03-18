import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import DatePickerSheet from './DatePickerSheet';

interface Props {
  calendarType: '양력' | '음력';
  year: number;
  month: number;
  day: number;
  onCalendarTypeChange: (type: '양력' | '음력') => void;
  onDateChange: (year: number, month: number, day: number) => void;
}

export default function BirthDateSection({
  calendarType, year, month, day,
  onCalendarTypeChange, onDateChange,
}: Props) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pillWidth, setPillWidth] = useState(0);

  // 슬라이딩 인디케이터 애니메이션
  const slideAnim = useRef(new Animated.Value(calendarType === '양력' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: calendarType === '양력' ? 0 : 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 300,
    }).start();
  }, [calendarType]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, pillWidth],
  });

  return (
    <View className="px-5 py-[22px] border-b border-border">
      <Text className="text-overline text-textTertiary mb-3.5">생년월일</Text>

      {/* 양력 / 음력 토글 */}
      <View
        className="flex-row self-start bg-surface border border-border rounded-full p-[3px] mb-3.5"
        onLayout={(e) => setPillWidth(e.nativeEvent.layout.width / 2 - 3)}
      >
        {/* 슬라이딩 선택 인디케이터 */}
        {pillWidth > 0 && (
          <Animated.View
            className="absolute inset-y-[3px] bg-surfaceRaised rounded-full border border-border"
            style={{
              width: pillWidth,
              left: 3,
              transform: [{ translateX }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
            pointerEvents="none"
          />
        )}

        {(['양력', '음력'] as const).map((type) => {
          const active = calendarType === type;
          return (
            <Pressable
              key={type}
              className="px-4 py-[5px] rounded-full"
              onPress={() => onCalendarTypeChange(type)}
            >
              <Text
                className={`text-[12px] ${active ? 'font-sans-medium text-textPrimary' : 'font-sans-regular text-textTertiary'}`}
                style={{ letterSpacing: 0.6 }}
              >
                {type}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 날짜 필드 행 */}
      <Pressable
        className="flex-row gap-1.5"
        onPress={() => setPickerVisible(true)}
      >
        {/* 년 */}
        <View className="flex-[1.6] flex-row items-center justify-between bg-surfaceRaised border-[1.5px] border-borderStrong rounded-lg h-[52px] px-3">
          <Text className="font-serif-regular text-textPrimary" style={{ fontSize: 20, lineHeight: 20 }}>{year}</Text>
          <Text className="font-sans-regular text-textTertiary self-end pb-2" style={{ fontSize: 11 }}>년</Text>
        </View>
        {/* 월 */}
        <View className="flex-1 flex-row items-center justify-between bg-surfaceRaised border-[1.5px] border-borderStrong rounded-lg h-[52px] px-3">
          <Text className="font-serif-regular text-textPrimary" style={{ fontSize: 20, lineHeight: 20 }}>{month}</Text>
          <Text className="font-sans-regular text-textTertiary self-end pb-2" style={{ fontSize: 11 }}>월</Text>
        </View>
        {/* 일 */}
        <View className="flex-1 flex-row items-center justify-between bg-surfaceRaised border-[1.5px] border-borderStrong rounded-lg h-[52px] px-3">
          <Text className="font-serif-regular text-textPrimary" style={{ fontSize: 20, lineHeight: 20 }}>{day}</Text>
          <Text className="font-sans-regular text-textTertiary self-end pb-2" style={{ fontSize: 11 }}>일</Text>
        </View>
      </Pressable>

      <DatePickerSheet
        visible={pickerVisible}
        year={year}
        month={month}
        day={day}
        onConfirm={(y, m, d) => onDateChange(y, m, d)}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
