import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors } from '@/design-system';

const CHIPS = [
  { label: '발음오행', dotColor: colors.positive },
  { label: '수리책', dotColor: colors.fillAccent },
  { label: '획수음양', dotColor: colors.info },
  { label: '자원오행', dotColor: colors.negative },
  { label: '받침오행', dotColor: colors.positive },
];

export default function TipChipsSection() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 }}>
      <Text style={{
        fontFamily: 'NotoSansKR_400Regular',
        fontSize: 11,
        letterSpacing: 2,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        marginBottom: 12,
        paddingHorizontal: 4,
      }}>
        분석 항목 살펴보기
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CHIPS.map((chip) => (
          <Pressable
            key={chip.label}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: pressed ? colors.surface : colors.surfaceRaised,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 99,
              paddingVertical: 6,
              paddingHorizontal: 12,
            })}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: chip.dotColor, flexShrink: 0 }} />
            <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 12, color: colors.textSecondary }}>
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
