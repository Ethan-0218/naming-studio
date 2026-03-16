import React from 'react';
import { Text, View } from 'react-native';
import { colors, fontFamily } from '@/design-system';
import { NameInput, SuriEntry, SurigyeokResult, SuriLevel, Gender } from '../types';
import { computeSurigyeok } from '../domain/surigyeok';
import SectionCard from './SectionCard';

interface Props {
  nameInput: NameInput;
  gender: Gender;
  result: SurigyeokResult | null;
}

const LEVEL_COLOR: Record<SuriLevel, string> = {
  '大吉': colors.positive,
  '吉': colors.positive,
  '中吉': colors.fillAccent,
  '中凶': colors.warning,
  '凶': colors.negative,
  '大凶': colors.negative,
};

function SuriCard({ label, entry }: { label: string; entry: SuriEntry }) {
  const color = LEVEL_COLOR[entry.level];
  return (
    <View className="w-[47%] bg-surface rounded-md p-3 border border-border">
      <Text
        className="text-overline text-textTertiary uppercase"
        style={{ fontFamily: fontFamily.sansMedium }}
      >
        {label}
      </Text>
      <Text
        className="text-numeralMd"
        style={{ fontFamily: fontFamily.serifMedium, color, marginTop: 4 }}
      >
        {entry.number}
      </Text>
      <Text
        className="text-uiSm text-textPrimary mt-1"
        style={{ fontFamily: fontFamily.sansMedium }}
      >
        {entry.name1}
      </Text>
      <View
        className="self-start px-2 py-0.5 rounded-full border mt-1"
        style={{ borderColor: color }}
      >
        <Text
          className="text-overline uppercase"
          style={{ fontFamily: fontFamily.sansMedium, color }}
        >
          {entry.level}
        </Text>
      </View>
      <Text
        className="text-bodySm text-textTertiary mt-1"
        style={{ fontFamily: fontFamily.sansRegular }}
        numberOfLines={2}
      >
        {entry.easyInterpretation}
      </Text>
    </View>
  );
}

export default function SurigyeokSection({ nameInput, gender, result }: Props) {
  const computed =
    result ??
    (nameInput.surname.strokeCount != null && nameInput.first1.strokeCount != null
      ? computeSurigyeok(
          nameInput.surname.strokeCount,
          nameInput.first1.strokeCount,
          nameInput.first2.strokeCount,
          gender,
        )
      : null);

  const badge = computed ? `총 ${computed.totalScore}점` : undefined;
  const badgeColor =
    computed
      ? computed.totalScore >= 24
        ? colors.positive
        : colors.warning
      : undefined;

  return (
    <SectionCard title="수리격" badge={badge} badgeColor={badgeColor}>
      {computed ? (
        <View className="flex-row flex-wrap gap-2">
          <SuriCard label="원격" entry={computed.wongyeok} />
          <SuriCard label="형격" entry={computed.hyeongyeok} />
          <SuriCard label="이격" entry={computed.igyeok} />
          <SuriCard label="정격" entry={computed.jeongyeok} />
        </View>
      ) : (
        <Text
          className="text-bodySm text-textDisabled text-center py-4"
          style={{ fontFamily: fontFamily.sansRegular }}
        >
          한자의 획수를 모두 입력하면 수리격이 계산됩니다
        </Text>
      )}
    </SectionCard>
  );
}
