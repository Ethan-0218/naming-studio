import React, { useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { palette, ohaengColors, textStyles, spacing, radius } from '@/design-system';
import { CharSlotData } from '../types';
import { useHanjaSearch } from '../hooks/useHanjaSearch';

interface Props {
  label: string;
  value: CharSlotData;
  onUpdate: (data: Partial<CharSlotData>) => void;
  role: 'surname' | 'name';
  disabled?: boolean;
}

export default function CharSlotInput({ label, value, onUpdate, role, disabled }: Props) {
  const [editing, setEditing] = useState(false);
  const [strokeInput, setStrokeInput] = useState('');
  const { query, results, loading, search, clearResults } = useHanjaSearch(role);

  function handleSelectResult(result: typeof results[0]) {
    onUpdate({
      hangul: result.eum,
      hanja: result.hanja,
      mean: result.mean,
      strokeCount: result.strokeCount,
      charOhaeng: result.charOhaeng,
      baleumOhaeng: result.baleumOhaeng,
      soundEumyang: result.soundEumyang,
      strokeEumyang: result.strokeEumyang,
    });
    clearResults();
    setEditing(false);
  }

  function handleManualStroke() {
    const n = parseInt(strokeInput, 10);
    if (!isNaN(n) && n > 0) {
      onUpdate({ strokeCount: n });
    }
    setStrokeInput('');
    setEditing(false);
  }

  const hasHanja = !!value.hanja;
  const ohaengColor = value.charOhaeng ? ohaengColors[value.charOhaeng] : null;

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      {/* Slot header */}
      <Text style={[textStyles.sectionLabel, styles.slotLabel]}>{label}</Text>

      {/* Main hanja display */}
      <Pressable
        style={[styles.hanjaBox, ohaengColor && { borderColor: ohaengColor.border, backgroundColor: ohaengColor.light }]}
        onPress={() => !disabled && setEditing(e => !e)}
        disabled={disabled}
      >
        <Text style={[textStyles.hanjaDisplay, { color: ohaengColor?.base ?? palette.inkMid }]}>
          {hasHanja ? value.hanja : '?'}
        </Text>
        {value.hangul ? (
          <Text style={[textStyles.sectionLabel, { color: palette.inkLight, marginTop: 2 }]}>
            {value.hangul}
          </Text>
        ) : null}
      </Pressable>

      {/* Stroke count & 오행 pills */}
      {hasHanja && (
        <View style={styles.pills}>
          {value.strokeCount != null && (
            <View style={styles.pill}>
              <Text style={[textStyles.sectionLabel, { color: palette.inkMid }]}>
                {value.strokeCount}획
              </Text>
            </View>
          )}
          {value.charOhaeng && (
            <View style={[styles.pill, { backgroundColor: ohaengColor!.light, borderColor: ohaengColor!.border }]}>
              <Text style={[textStyles.sectionLabel, { color: ohaengColor!.base }]}>
                {value.charOhaeng}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Meaning */}
      {value.mean ? (
        <Text style={[textStyles.body, styles.mean]} numberOfLines={1}>{value.mean}</Text>
      ) : null}

      {/* Edit panel */}
      {editing && !disabled && (
        <View style={styles.editPanel}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={search}
            placeholder={role === 'surname' ? '성씨 검색 (예: 김)' : '음 검색 (예: 민)'}
            placeholderTextColor={palette.inkFaint}
            autoFocus
          />
          {loading && <ActivityIndicator size="small" color={palette.inkLight} style={{ marginTop: 4 }} />}
          {results.length > 0 && (
            <ScrollView style={styles.resultList} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {results.map((r, i) => (
                <Pressable key={i} style={styles.resultRow} onPress={() => handleSelectResult(r)}>
                  <Text style={[textStyles.hanjaDisplay, { fontSize: 20, color: palette.ink, marginRight: spacing['2'] }]}>
                    {r.hanja}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[textStyles.cardTitle, { color: palette.ink }]}>
                      {r.eum} · {r.mean}
                    </Text>
                    <Text style={[textStyles.body, { color: palette.inkLight }]}>
                      {r.strokeCount != null ? `${r.strokeCount}획` : '획수 미상'}
                      {r.charOhaeng ? ` · ${r.charOhaeng}` : ''}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
          {/* Manual stroke count input */}
          <View style={styles.manualRow}>
            <Text style={[textStyles.body, { color: palette.inkMid, marginRight: spacing['2'] }]}>획수 직접입력</Text>
            <TextInput
              style={[styles.searchInput, { flex: 1 }]}
              value={strokeInput}
              onChangeText={setStrokeInput}
              placeholder="예: 8"
              placeholderTextColor={palette.inkFaint}
              keyboardType="number-pad"
              onSubmitEditing={handleManualStroke}
            />
            <Pressable style={styles.applyBtn} onPress={handleManualStroke}>
              <Text style={[textStyles.labelBadge, { color: palette.bg }]}>적용</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => { setEditing(false); clearResults(); }} style={styles.closeBtn}>
            <Text style={[textStyles.body, { color: palette.inkLight }]}>닫기</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
  slotLabel: {
    color: palette.inkLight,
    marginBottom: spacing['1'],
  },
  hanjaBox: {
    width: 72,
    height: 80,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pills: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing['1'],
  },
  pill: {
    paddingHorizontal: spacing['1'],
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  mean: {
    color: palette.inkLight,
    marginTop: 2,
    maxWidth: 80,
    textAlign: 'center',
  },
  editPanel: {
    position: 'absolute',
    top: 100,
    left: -40,
    right: -40,
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing['3'],
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['1'],
    ...textStyles.body,
    color: palette.ink,
    backgroundColor: palette.bg,
  },
  resultList: {
    maxHeight: 180,
    marginTop: spacing['2'],
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing['2'],
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing['3'],
    paddingTop: spacing['3'],
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  applyBtn: {
    backgroundColor: palette.inkMid,
    borderRadius: radius.sm,
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['1'],
    marginLeft: spacing['2'],
  },
  closeBtn: {
    alignSelf: 'center',
    marginTop: spacing['2'],
    paddingVertical: spacing['1'],
  },
});
