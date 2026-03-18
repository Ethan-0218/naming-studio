import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ohaengColors } from '@/design-system';

interface Props {
  gender: 'male' | 'female';
  onChange: (gender: 'male' | 'female') => void;
}

function GenderCard({
  type,
  glyph,
  name,
  ohaengLabel,
  selected,
  onPress,
}: {
  type: 'male' | 'female';
  glyph: string;
  name: string;
  ohaengLabel: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scheme = type === 'male' ? ohaengColors['수'] : ohaengColors['화'];

  return (
    <Pressable
      className="flex-1 flex-row items-center gap-4 rounded-[18px] border-[1.5px] p-4 pt-[18px]"
      style={({ pressed }) => ({
        borderColor: selected ? scheme.border : '#e7e5e4',
        backgroundColor: selected ? scheme.light : '#fafaf9',
        opacity: pressed ? 0.84 : 1,
      })}
      onPress={onPress}
    >
      {/* check circle — top-right absolute */}
      <View
        className="absolute top-[10px] right-3 w-[18px] h-[18px] rounded-full items-center justify-center"
        style={{
          backgroundColor: selected ? scheme.base : '#d6d3d1',
          opacity: selected ? 1 : 0,
        }}
      >
        <Ionicons name="checkmark" size={11} color="#fff" />
      </View>

      {/* glyph */}
      <Text
        className="font-serif text-center"
        style={{
          fontSize: 38,
          lineHeight: 38,
          color: selected ? scheme.base : '#d6d3d1',
          width: 46,
        }}
      >
        {glyph}
      </Text>

      {/* labels */}
      <View>
        <Text
          className="font-serif-medium mb-1"
          style={{
            fontSize: 16,
            letterSpacing: 0.5,
            color: selected ? scheme.base : '#78716c',
          }}
        >
          {name}
        </Text>
        <Text
          className="font-sans-regular"
          style={{
            fontSize: 11,
            letterSpacing: 0.8,
            color: selected ? scheme.border : '#d6d3d1',
          }}
        >
          {ohaengLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export default function GenderSection({ gender, onChange }: Props) {
  return (
    <View className="px-5 py-[22px] border-b border-border">
      <Text className="text-overline text-textTertiary mb-3.5">성별</Text>
      <View className="flex-row gap-[9px]">
        <GenderCard
          type="male"
          glyph="男"
          name="남자"
          ohaengLabel="水 · 陽"
          selected={gender === 'male'}
          onPress={() => onChange('male')}
        />
        <GenderCard
          type="female"
          glyph="女"
          name="여자"
          ohaengLabel="火 · 陰"
          selected={gender === 'female'}
          onPress={() => onChange('female')}
        />
      </View>
    </View>
  );
}
