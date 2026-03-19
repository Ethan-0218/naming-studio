import React from 'react';
import { View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';
import HanjaSearchField, {
  SelectedHanja,
} from '@/shared/components/HanjaSearchField';

interface Props {
  selected: SelectedHanja | null;
  onSelect: (s: SelectedHanja) => void;
  onClear: () => void;
  error?: string;
}

export default function SurnameSection({
  selected,
  onSelect,
  onClear,
  error,
}: Props) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      <Font
        tag="secondaryMedium"
        style={{ fontSize: 13, color: colors.textTertiary, marginBottom: 10 }}
      >
        성씨
      </Font>
      <HanjaSearchField
        selected={selected}
        onSelect={onSelect}
        onClear={onClear}
        error={error}
        endpoint="/api/surname-search"
        placeholder="성씨 검색 (예: 김, 이, 박)"
        chipSuffix="씨"
      />
    </View>
  );
}
