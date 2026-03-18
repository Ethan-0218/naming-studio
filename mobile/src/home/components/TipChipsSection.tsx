import React from 'react';
import { View, Pressable } from 'react-native';
import { primitives } from '@/design-system';
import { Font } from '@/components/Font';

const CHIPS = [
  { label: '발음오행', dotColor: primitives.teal600 },
  { label: '수리책', dotColor: primitives.gold600 },
  { label: '획수음양', dotColor: primitives.purple600 },
  { label: '자원오행', dotColor: primitives.vermillion600 },
  { label: '받침오행', dotColor: primitives.teal600 },
];

export default function TipChipsSection() {
  return (
    <View className="px-4 pt-5 pb-5">
      <Font
        tag="secondary"
        className="text-textTertiary mb-3 px-1"
        style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}
      >
        분석 항목 살펴보기
      </Font>
      <View className="flex-row flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <Pressable
            key={chip.label}
            className="flex-row items-center gap-1 border border-border rounded-full py-1.5 px-3"
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? primitives.hanji200
                : primitives.hanji50,
            })}
          >
            <View
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: chip.dotColor }}
            />
            <Font
              tag="secondary"
              className="text-textSecondary"
              style={{ fontSize: 12 }}
            >
              {chip.label}
            </Font>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
