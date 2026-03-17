import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors, fontFamily, textStyles, radius } from '@/design-system';
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

  return (
    <View style={{
      paddingHorizontal: 20,
      paddingVertical: 22,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <Text style={[textStyles.overline, { color: colors.textTertiary, marginBottom: 14 }]}>
        생년월일
      </Text>

      {/* 양력 / 음력 토글 */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radius.full,
        padding: 3,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 14,
      }}>
        {(['양력', '음력'] as const).map((type) => {
          const active = calendarType === type;
          return (
            <Pressable
              key={type}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 5,
                borderRadius: radius.full,
                backgroundColor: active ? colors.surfaceRaised : 'transparent',
                borderWidth: active ? 1 : 0,
                borderColor: colors.border,
                ...(active ? {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                } : {}),
              }}
              onPress={() => onCalendarTypeChange(type)}
            >
              <Text style={{
                fontFamily: active ? fontFamily.sansMedium : fontFamily.sansRegular,
                fontSize: 12,
                letterSpacing: 0.6,
                color: active ? colors.textPrimary : colors.textTertiary,
              }}>
                {type}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 날짜 필드 행 */}
      <Pressable
        style={{ flexDirection: 'row', gap: 6 }}
        onPress={() => setPickerVisible(true)}
      >
        {/* 년 */}
        <View style={[dateFieldStyle, { flex: 1.6 }]}>
          <Text style={dateValStyle}>{year}</Text>
          <Text style={dateUnitStyle}>년</Text>
        </View>
        {/* 월 */}
        <View style={[dateFieldStyle, { flex: 1 }]}>
          <Text style={dateValStyle}>{month}</Text>
          <Text style={dateUnitStyle}>월</Text>
        </View>
        {/* 일 */}
        <View style={[dateFieldStyle, { flex: 1 }]}>
          <Text style={dateValStyle}>{day}</Text>
          <Text style={dateUnitStyle}>일</Text>
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

const dateFieldStyle = {
  backgroundColor: colors.surfaceRaised,
  borderWidth: 1.5,
  borderColor: colors.borderStrong,
  borderRadius: radius.lg,
  height: 52,
  paddingHorizontal: 12,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
};

const dateValStyle = {
  fontFamily: fontFamily.serifRegular,
  fontSize: 20,
  lineHeight: 20,
  color: colors.textPrimary,
};

const dateUnitStyle = {
  fontFamily: fontFamily.sansRegular,
  fontSize: 11,
  color: colors.textTertiary,
  alignSelf: 'flex-end' as const,
  paddingBottom: 8,
};
