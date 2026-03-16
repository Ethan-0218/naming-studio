import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import clsx from 'clsx';
import { colors, ohaengColors, textClassNames } from '@/design-system';
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

  function handleSelectResult(result: (typeof results)[0]) {
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
    <View className={clsx('flex-1 items-center', disabled && 'opacity-35')}>
      <Text className={`${textClassNames.overline} text-textTertiary mb-1`}>{label}</Text>

      <Pressable
        className="w-[72px] h-20 rounded-md border-[1.5px] items-center justify-center border-border bg-surfaceRaised"
        style={
          ohaengColor
            ? { borderColor: ohaengColor.border, backgroundColor: ohaengColor.light }
            : undefined
        }
        onPress={() => !disabled && setEditing((e) => !e)}
        disabled={disabled}
      >
        <Text
          className={textClassNames.hanjaLg}
          style={{ color: ohaengColor?.base ?? colors.textSecondary }}
        >
          {hasHanja ? value.hanja : '?'}
        </Text>
        {value.hangul ? (
          <Text className={`${textClassNames.overline} text-textTertiary mt-0.5`}>
            {value.hangul}
          </Text>
        ) : null}
      </Pressable>

      {hasHanja && (
        <View className="flex-row gap-1 mt-1">
          {value.strokeCount != null && (
            <View className="px-1 py-0.5 rounded-sm border border-border bg-surface">
              <Text className={`${textClassNames.overline} text-textSecondary`}>
                {value.strokeCount}획
              </Text>
            </View>
          )}
          {value.charOhaeng && ohaengColor && (
            <View
              className="px-1 py-0.5 rounded-sm border"
              style={{
                backgroundColor: ohaengColor.light,
                borderColor: ohaengColor.border,
              }}
            >
              <Text className={textClassNames.overline} style={{ color: ohaengColor.base }}>
                {value.charOhaeng}
              </Text>
            </View>
          )}
        </View>
      )}

      {value.mean ? (
        <Text
          className={`${textClassNames.bodySm} text-textTertiary mt-0.5 max-w-20 text-center`}
          numberOfLines={1}
        >
          {value.mean}
        </Text>
      ) : null}

      {editing && !disabled && (
        <View
          className="absolute bg-surfaceRaised rounded-lg border border-border p-3 z-[100]"
          style={{
            top: 100,
            left: -40,
            right: -40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <TextInput
            className="border border-border rounded-sm px-2 py-1 bg-bg text-textPrimary"
            style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 11, lineHeight: 19 }}
            value={query}
            onChangeText={search}
            placeholder={role === 'surname' ? '성씨 검색 (예: 김)' : '음 검색 (예: 민)'}
            placeholderTextColor={colors.textDisabled}
            autoFocus
          />
          {loading && (
            <ActivityIndicator size="small" color={colors.textTertiary} className="mt-2" />
          )}
          {results.length > 0 && (
            <ScrollView
              className="max-h-[180px] mt-2"
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {results.map((r, i) => (
                <Pressable
                  key={i}
                  className="flex-row items-center py-2 border-b border-border"
                  onPress={() => handleSelectResult(r)}
                >
                  <Text
                    className={textClassNames.hanjaLg}
                    style={{ fontSize: 20, color: colors.textPrimary, marginRight: 8 }}
                  >
                    {r.hanja}
                  </Text>
                  <View className="flex-1">
                    <Text className={`${textClassNames.uiSm} text-textPrimary`}>
                      {r.eum} · {r.mean}
                    </Text>
                    <Text className={`${textClassNames.bodySm} text-textTertiary`}>
                      {r.strokeCount != null ? `${r.strokeCount}획` : '획수 미상'}
                      {r.charOhaeng ? ` · ${r.charOhaeng}` : ''}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <View className="flex-row items-center mt-3 pt-3 border-t border-border">
            <Text className={`${textClassNames.bodySm} text-textSecondary mr-2`}>
              획수 직접입력
            </Text>
            <TextInput
              className="flex-1 border border-border rounded-sm px-2 py-1 bg-bg text-textPrimary"
              style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 11, lineHeight: 19 }}
              value={strokeInput}
              onChangeText={setStrokeInput}
              placeholder="예: 8"
              placeholderTextColor={colors.textDisabled}
              keyboardType="number-pad"
              onSubmitEditing={handleManualStroke}
            />
            <Pressable
              className="bg-textSecondary rounded-sm px-2 py-1 ml-2"
              onPress={handleManualStroke}
            >
              <Text className={`${textClassNames.label} text-textInverse`}>적용</Text>
            </Pressable>
          </View>
          <Pressable
            className="self-center mt-2 py-1"
            onPress={() => {
              setEditing(false);
              clearResults();
            }}
          >
            <Text className={`${textClassNames.bodySm} text-textTertiary`}>닫기</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
