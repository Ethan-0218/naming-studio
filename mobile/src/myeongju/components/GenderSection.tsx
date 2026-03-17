import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, ohaengColors, fontFamily, textStyles } from '@/design-system';

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
  const bgColor      = selected ? scheme.light  : colors.surfaceRaised;
  const borderColor  = selected ? scheme.border : colors.border;
  const glyphColor   = selected ? scheme.base   : colors.textDisabled;
  const nameColor    = selected ? scheme.base   : colors.textSecondary;
  const subColor     = selected ? scheme.border : colors.textDisabled;
  const checkBg      = selected ? scheme.base   : colors.border;

  return (
    <Pressable
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor,
        backgroundColor: bgColor,
        padding: 16,
        paddingTop: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        opacity: pressed ? 0.84 : 1,
      })}
      onPress={onPress}
    >
      {/* check circle — top-right absolute */}
      <View style={{
        position: 'absolute',
        top: 10, right: 12,
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: checkBg,
        alignItems: 'center', justifyContent: 'center',
        opacity: selected ? 1 : 0,
      }}>
        <Ionicons name="checkmark" size={11} color="#fff" />
      </View>

      {/* glyph */}
      <Text style={{
        fontFamily: fontFamily.serifLight,
        fontSize: 38,
        lineHeight: 38,
        color: glyphColor,
        width: 46,
        textAlign: 'center',
      }}>
        {glyph}
      </Text>

      {/* labels */}
      <View>
        <Text style={{
          fontFamily: fontFamily.serifMedium,
          fontSize: 16,
          letterSpacing: 0.5,
          color: nameColor,
          marginBottom: 4,
        }}>
          {name}
        </Text>
        <Text style={{
          fontFamily: fontFamily.sansRegular,
          fontSize: 11,
          letterSpacing: 0.8,
          color: subColor,
        }}>
          {ohaengLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export default function GenderSection({ gender, onChange }: Props) {
  return (
    <View style={{
      paddingHorizontal: 20,
      paddingVertical: 22,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <Text style={[textStyles.overline, { color: colors.textTertiary, marginBottom: 14 }]}>
        성별
      </Text>
      <View style={{ flexDirection: 'row', gap: 9 }}>
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
