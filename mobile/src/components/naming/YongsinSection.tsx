import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, ohaengColors, primitives } from '@/design-system';
import { Font } from '@/components/Font';
import {
  NameInput,
  Ohaeng,
  SajuComplementLevel,
  SajuInput,
} from '@/naming-tool/types';
import { charYongsinRole } from '@/naming-tool/domain/sajuComplementLevel';
import SectionCard, { ratingColor, ratingLabel } from './SectionCard';

const OHAENG_LIST: Ohaeng[] = ['목', '화', '토', '금', '수'];

interface Props {
  sajuInput: SajuInput;
  nameInput: NameInput;
  onUpdate: (data: Partial<SajuInput>) => void;
  /** computeNamingAnalysis — 자원오행 기준 사주보완 등급 (용신 선택 시) */
  sajuComplementLevel?: SajuComplementLevel | null;
  sajuComplementScore?: number | null;
  isPurchased?: boolean;
  onPressBuy?: () => void;
}

const ROLE_BADGE: Record<
  NonNullable<ReturnType<typeof charYongsinRole>>,
  { label: string; color: string }
> = {
  용: { label: '용신', color: colors.positive },
  희: { label: '희신', color: colors.fillAccent },
  기: { label: '기신', color: colors.negative },
  중: { label: '중립', color: colors.textTertiary },
};

const REASONS = [
  '용신 오행이 부족한 에너지를 보완해 사주의 균형을 맞춥니다.',
  '이름 한자의 자원오행이 용신·희신에 가까울수록 사주보완 점수가 높아집니다.',
  '용신 보완이 잘 된 이름은 평생 좋은 운을 뒷받침하는 힘이 됩니다.',
];

export default function YongsinSection({
  sajuInput,
  nameInput,
  onUpdate,
  sajuComplementLevel = null,
  sajuComplementScore = null,
  isPurchased = false,
  onPressBuy,
}: Props) {
  const { yongsin } = sajuInput;
  const slots = [nameInput.surname, nameInput.first1, nameInput.first2];

  if (!isPurchased) {
    return (
      <SectionCard
        title="용신 보완"
        badge="🔒 프리미엄 전용"
        badgeColor={primitives.gold600}
      >
        <View className="relative mb-4">
          <View className="flex-row gap-2 mb-3">
            {OHAENG_LIST.map((o) => (
              <View
                key={o}
                className="flex-1 rounded-md py-2 items-center"
                style={{ backgroundColor: colors.border, height: 34 }}
              />
            ))}
          </View>
          <View className="gap-2">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                className="rounded-md"
                style={{ height: 28, backgroundColor: colors.border }}
              />
            ))}
          </View>
          <View
            className="absolute inset-0 items-center justify-center"
            pointerEvents="none"
          >
            <View
              className="rounded-full items-center justify-center"
              style={{
                width: 44,
                height: 44,
                backgroundColor: primitives.ink900,
              }}
            >
              <Ionicons name="lock-closed" size={20} color="#fff" />
            </View>
          </View>
        </View>

        <Font
          tag="primaryMedium"
          className="text-textPrimary text-center mb-1"
          style={{ fontSize: 15 }}
        >
          결제 후 확인할 수 있습니다
        </Font>
        <Font
          tag="secondary"
          className="text-textTertiary text-center mb-4"
          style={{ fontSize: 12 }}
        >
          용신 보완 분석은 프리미엄 기능입니다.
        </Font>

        <View
          className="rounded-lg p-3 border mb-3"
          style={{
            backgroundColor: primitives.gold200,
            borderColor: primitives.gold400,
          }}
        >
          <Font
            tag="secondaryMedium"
            className="text-textPrimary mb-2"
            style={{ fontSize: 12 }}
          >
            작명에서 용신이 중요한 이유
          </Font>
          {REASONS.map((reason, i) => (
            <View key={i} className="flex-row gap-2 mb-1">
              <Font
                tag="secondary"
                style={{ fontSize: 12, color: primitives.gold600 }}
              >
                •
              </Font>
              <Font
                tag="secondary"
                className="flex-1"
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  lineHeight: 18,
                }}
              >
                {reason}
              </Font>
            </View>
          ))}
        </View>

        {onPressBuy && (
          <Pressable
            onPress={onPressBuy}
            className="rounded-[10px] py-[12px] items-center mb-2 active:opacity-80"
            style={{ backgroundColor: primitives.ink900 }}
          >
            <Font tag="secondaryMedium" style={{ fontSize: 14, color: '#fff' }}>
              프리미엄 구매 — 2,900원
            </Font>
          </Pressable>
        )}

        <Font
          tag="secondary"
          className="text-textDisabled text-center"
          style={{ fontSize: 12 }}
        >
          1회 결제 · 광고 없음 · 평생 이용
        </Font>
      </SectionCard>
    );
  }

  const levelBadge =
    yongsin && sajuComplementLevel
      ? ratingLabel(sajuComplementLevel)
      : undefined;
  const levelBadgeColor =
    yongsin && sajuComplementLevel
      ? ratingColor(sajuComplementLevel)
      : undefined;

  return (
    <SectionCard
      title="사주 보완"
      badge={levelBadge}
      badgeColor={levelBadgeColor}
    >
      <Font tag="secondary" className="text-bodySm text-textSecondary mb-3">
        아이의 용신 오행을 선택하면 이름 글자들과의 궁합을 분석합니다.
      </Font>

      <View className="flex-row gap-2 mb-3">
        {OHAENG_LIST.map((o) => {
          const oc = ohaengColors[o];
          const selected = yongsin === o;
          return (
            <Pressable
              key={o}
              className="flex-1 border-[1.5px] rounded-md py-2 items-center"
              style={{
                borderColor: oc.border,
                backgroundColor: selected ? oc.light : undefined,
              }}
              onPress={() => onUpdate({ yongsin: selected ? null : o })}
            >
              <Font
                tag="secondaryMedium"
                className="text-uiSm"
                style={{ color: selected ? oc.base : colors.textSecondary }}
              >
                {o}
              </Font>
            </Pressable>
          );
        })}
      </View>

      {yongsin && (
        <View className="gap-2 pt-2 border-t border-border">
          {sajuComplementScore != null && (
            <Font
              tag="secondaryMedium"
              className="text-bodySm text-textPrimary mb-1"
            >
              사주보완 점수 {sajuComplementScore}점 (자원오행 3글자 기준)
            </Font>
          )}
          <Font tag="secondary" className="text-bodySm text-textTertiary mb-2">
            글자별 판정은 한자 자원오행만 사용합니다 (백엔드와 동일).
          </Font>
          {slots.map((slot, i) => {
            const charOhaeng = slot.charOhaeng;
            const role = charYongsinRole(yongsin, charOhaeng);
            const badge = role ? ROLE_BADGE[role] : null;
            return (
              <View key={i} className="flex-row items-center">
                <Font
                  tag="secondaryMedium"
                  className="text-uiSm text-textPrimary w-10"
                >
                  {slot.hanja || slot.hangul || '?'}
                </Font>
                {charOhaeng ? (
                  <View
                    className="px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: ohaengColors[charOhaeng].light,
                      borderColor: ohaengColors[charOhaeng].border,
                    }}
                  >
                    <Font
                      tag="secondaryMedium"
                      className="text-overline uppercase"
                      style={{ color: ohaengColors[charOhaeng].base }}
                    >
                      {charOhaeng}
                    </Font>
                  </View>
                ) : (
                  <Font
                    tag="secondary"
                    className="text-bodySm text-textDisabled w-16"
                  >
                    미입력
                  </Font>
                )}
                <Font
                  tag="secondary"
                  className="text-bodySm text-textTertiary mx-2"
                >
                  →
                </Font>
                <View
                  className="px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: ohaengColors[yongsin].light,
                    borderColor: ohaengColors[yongsin].border,
                  }}
                >
                  <Font
                    tag="secondaryMedium"
                    className="text-overline uppercase"
                    style={{ color: ohaengColors[yongsin].base }}
                  >
                    {yongsin} (용신)
                  </Font>
                </View>
                {badge && (
                  <View
                    className="ml-2 px-2 py-0.5 rounded-full border"
                    style={{ borderColor: badge.color }}
                  >
                    <Font
                      tag="secondaryMedium"
                      className="text-overline uppercase"
                      style={{ color: badge.color }}
                    >
                      {badge.label}
                    </Font>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {!yongsin && (
        <Font
          tag="secondary"
          className="text-bodySm text-textDisabled text-center py-2"
        >
          용신 오행을 선택해주세요
        </Font>
      )}
    </SectionCard>
  );
}
