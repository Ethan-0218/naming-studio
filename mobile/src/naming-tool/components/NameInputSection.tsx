import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette, textStyles, spacing, radius } from '@/design-system';
import { CharSlotData, Gender, NameInput } from '../types';
import HanjaSlotInput from './HanjaSlotInput';

interface Props {
  nameInput: NameInput;
  onUpdate: (slot: 'surname' | 'first1' | 'first2', data: Partial<CharSlotData>) => void;
  gender: Gender;
  onGenderChange: (g: Gender) => void;
}

const SLOT_LABELS = { surname: '성', first1: '첫째', first2: '둘째' } as const;
type SlotKey = 'surname' | 'first1' | 'first2';
const SLOTS: SlotKey[] = ['surname', 'first1', 'first2'];

export default function NameInputSection({ nameInput, onUpdate, gender, onGenderChange }: Props) {
  return (
    <View>
      {/* Title row — outside the card */}
      <View style={styles.outerTitleRow}>
        <Text style={[textStyles.sectionTitle, { color: palette.ink }]}>이름 입력</Text>
        <View style={styles.genderRow}>
          {(['male', 'female'] as Gender[]).map(g => (
            <Pressable
              key={g}
              style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
              onPress={() => onGenderChange(g)}
            >
              <Text style={[textStyles.labelBadge, { color: gender === g ? palette.bg : palette.inkMid }]}>
                {g === 'male' ? '남' : '여'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        {/* 한 글 row */}
        <View style={styles.rowGroup}>
          <Text style={[textStyles.sectionLabel, styles.rowLabel]}>한 글</Text>
          <View style={styles.slotRow}>
            {SLOTS.map((slot, i) => (
              <React.Fragment key={slot}>
                {i > 0 && <View style={styles.colDivider} />}
                <View style={styles.hangulSlot}>
                  <Text style={[textStyles.sectionLabel, styles.slotLabel]}>
                    {SLOT_LABELS[slot]}
                  </Text>
                  <TextInput
                    style={styles.hangulInput}
                    value={nameInput[slot].hangul}
                    onChangeText={text => {
                      const last = text.slice(-1);
                      onUpdate(slot, { hangul: last });
                    }}
                    placeholder="ㅡ"
                    placeholderTextColor={palette.inkFaint}
                    maxLength={2}
                    textAlign="center"
                  />
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* 한 자 row */}
        <View style={styles.rowGroup}>
          <Text style={[textStyles.sectionLabel, styles.rowLabel]}>한 자</Text>
          <View style={styles.slotRow}>
            {SLOTS.map((slot, i) => (
              <React.Fragment key={slot}>
                {i > 0 && <View style={styles.colDivider} />}
                <HanjaSlotInput
                  label={SLOT_LABELS[slot]}
                  hangul={nameInput[slot].hangul}
                  value={nameInput[slot]}
                  onUpdate={d => onUpdate(slot, d)}
                  role={slot === 'surname' ? 'surname' : 'name'}
                />
              </React.Fragment>
            ))}
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['2'],
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing['1'],
  },
  genderBtn: {
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.border,
  },
  genderBtnActive: {
    backgroundColor: palette.inkMid,
    borderColor: palette.inkMid,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing['4'],
  },
  rowGroup: {
    paddingVertical: spacing['2'],
  },
  rowLabel: {
    color: palette.inkLight,
    marginBottom: spacing['2'],
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
  },
  colDivider: {
    width: spacing['2'],
  },
  hangulSlot: {
    flex: 1,
    alignItems: 'center',
  },
  slotLabel: {
    color: palette.inkLight,
    marginBottom: spacing['1'],
  },
  hangulInput: {
    width: '100%',
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.bg,
    ...textStyles.hanjaDisplay,
    color: palette.ink,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: spacing['1'],
  },
});
