import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { Font } from '@/components/Font';
import { colors } from '@/design-system';
import { BACKEND_URL } from '../../../constants/config';

export interface SelectedHanja {
  hangul: string;
  hanja: string;
  mean: string;
}

interface HanjaResult {
  hanja: string;
  eum: string;
  mean: string;
  stroke: number | null;
}

interface Props {
  selected: SelectedHanja | null;
  onSelect: (s: SelectedHanja) => void;
  onClear: () => void;
  error?: string;
  endpoint: string; // e.g. "/api/surname-search" | "/api/hanja-search"
  placeholder: string;
  chipSuffix?: string; // 성씨: "씨", 돌림자: "자"
}

export default function HanjaSearchField({
  selected,
  onSelect,
  onClear,
  error,
  endpoint,
  placeholder,
  chipSuffix = '',
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HanjaResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${BACKEND_URL}${endpoint}?q=${encodeURIComponent(q)}`,
        );
        const data: HanjaResult[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  }

  function pick(r: HanjaResult) {
    onSelect({ hangul: r.eum, hanja: r.hanja, mean: r.mean });
    setQuery('');
    setResults([]);
  }

  if (selected) {
    return (
      <View className="flex-row items-center justify-between border-[1.5px] border-fillAccentBorder rounded-[10px] px-3 py-2.5 bg-fillAccentSub">
        <View className="flex-row items-center gap-3">
          <Font
            tag="primaryMedium"
            style={{ fontSize: 28, color: colors.textPrimary }}
          >
            {selected.hanja}
          </Font>
          <View>
            <Font
              tag="secondaryMedium"
              style={{ fontSize: 16, color: colors.fillAccent }}
            >
              {selected.hangul}
              {chipSuffix}
            </Font>
            <Font
              tag="secondary"
              style={{ fontSize: 12, color: colors.textTertiary }}
              numberOfLines={1}
            >
              {selected.mean}
            </Font>
          </View>
        </View>
        <Pressable
          onPress={onClear}
          className="bg-surface rounded-md px-2.5 py-1.5"
        >
          <Font
            tag="secondaryMedium"
            style={{ fontSize: 13, color: colors.fillAccent }}
          >
            변경
          </Font>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row items-center">
        <TextInput
          className="flex-1 border-[1.5px] border-border rounded-[10px] px-3 py-2.5 bg-surface"
          style={{ fontSize: 15, color: colors.textPrimary }}
          value={query}
          onChangeText={search}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          maxLength={4}
        />
        {searching && (
          <ActivityIndicator
            style={{ marginLeft: 8 }}
            color={colors.fillAccent}
            size="small"
          />
        )}
      </View>
      {error && !query ? (
        <Font
          tag="secondary"
          style={{ fontSize: 11, color: colors.negative }}
          className="mt-0.5"
        >
          {error}
        </Font>
      ) : null}
      {results.length > 0 && (
        <View className="border-[1.5px] border-border rounded-[10px] mt-1 bg-surfaceRaised overflow-hidden">
          {results.map((r, i) => (
            <Pressable
              key={i}
              className="flex-row items-center px-3 py-2.5 gap-2.5"
              style={
                i < results.length - 1
                  ? { borderBottomWidth: 1, borderBottomColor: colors.surface }
                  : undefined
              }
              onPress={() => pick(r)}
            >
              <Font
                tag="primaryMedium"
                style={{
                  fontSize: 22,
                  color: colors.textPrimary,
                  width: 34,
                  textAlign: 'center',
                }}
              >
                {r.hanja}
              </Font>
              <Font
                tag="secondaryMedium"
                style={{ fontSize: 15, color: colors.fillAccent, width: 44 }}
              >
                {r.eum}
                {chipSuffix}
              </Font>
              <Font
                tag="secondary"
                style={{ fontSize: 12, color: colors.textTertiary, flex: 1 }}
                numberOfLines={1}
              >
                {r.mean}
              </Font>
              {r.stroke != null && (
                <Font
                  tag="secondary"
                  style={{ fontSize: 11, color: colors.textDisabled }}
                >
                  {r.stroke}획
                </Font>
              )}
            </Pressable>
          ))}
        </View>
      )}
      {query.trim() && !searching && results.length === 0 && (
        <Font
          tag="secondary"
          style={{ fontSize: 13, color: colors.textDisabled }}
          className="mt-1.5 pl-1"
        >
          검색 결과가 없어요
        </Font>
      )}
    </View>
  );
}
