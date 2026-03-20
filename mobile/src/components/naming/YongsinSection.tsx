import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, ohaengColors, primitives } from '@/design-system';
import { Font } from '@/components/Font';
import { NameInput, Ohaeng } from '@/naming-tool/types';
import { charYongsinRole } from '@/naming-tool/domain/sajuComplementLevel';
import SectionCard from './SectionCard';

const OHAENG_HANJA: Record<Ohaeng, string> = {
  목: '木',
  화: '火',
  토: '土',
  금: '金',
  수: '水',
};

const REASONS = [
  '용신 오행이 부족한 에너지를 보완해 사주의 균형을 맞춥니다.',
  '이름 한자의 자원오행이 용신·희신에 가까울수록 사주보완 점수가 높아집니다.',
  '용신 보완이 잘 된 이름은 평생 좋은 운을 뒷받침하는 힘이 됩니다.',
];

interface RoleStyle {
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  boxBg: string;
  boxBorder: string;
}

const ROLE_STYLE: Record<'용신' | '희신' | '기신', RoleStyle> = {
  용신: {
    badgeColor: colors.positive,
    badgeBg: colors.positiveSub,
    badgeBorder: colors.positiveBorder,
    boxBg: colors.positiveSub,
    boxBorder: colors.positiveBorder,
  },
  희신: {
    badgeColor: primitives.wood600,
    badgeBg: primitives.wood200,
    badgeBorder: primitives.wood400,
    boxBg: primitives.wood200,
    boxBorder: primitives.wood400,
  },
  기신: {
    badgeColor: colors.negative,
    badgeBg: colors.negativeSub,
    badgeBorder: colors.negativeBorder,
    boxBg: colors.negativeSub,
    boxBorder: colors.negativeBorder,
  },
};

const ROLE_DESC: Record<'용신' | '희신' | '기신', { desc: string }> = {
  용신: {
    desc: '사주의 균형을 잡아주는 핵심 오행. 이름에 담기면 삶 전반에 안정과 추진력을 더합니다.',
  },
  희신: {
    desc: '용신을 도와주는 보조 오행. 이름에 있으면 간접적으로 사주를 돕는 긍정적 작용을 합니다.',
  },
  기신: {
    desc: '사주의 불균형을 심화시키는 오행. 이름에 담기면 과다한 기운을 더해 불안정을 줄 수 있습니다.',
  },
};

const CHAR_ROLE_INFO: Record<
  '용' | '희' | '기' | '중',
  { label: string; title: string; desc: string }
> = {
  용: {
    label: '용신',
    title: '사주 균형을 직접 보완',
    desc: '용신 오행으로 사주의 균형을 직접 보완합니다.',
  },
  희: {
    label: '희신',
    title: '사주 균형을 간접 보완',
    desc: '용신을 생하여 사주를 간접적으로 돕습니다.',
  },
  기: {
    label: '기신',
    title: '사주 불균형 심화',
    desc: '기신에 해당합니다. 다른 한자로 교체를 권장합니다.',
  },
  중: {
    label: '중립',
    title: '사주에 무관',
    desc: '이 글자는 사주에 큰 영향을 주지 않습니다.',
  },
};

interface Props {
  yongsin: Ohaeng | null;
  heesin: Ohaeng | null;
  gisin: Ohaeng | null;
  nameInput: NameInput;
  isPurchased?: boolean;
  onPressBuy?: () => void;
}

export default function YongsinSection({
  yongsin,
  heesin,
  gisin,
  nameInput,
  isPurchased = false,
  onPressBuy,
}: Props) {
  if (!isPurchased) {
    return (
      <SectionCard
        title="용신 보완"
        badge="🔒 프리미엄 전용"
        badgeColor={primitives.gold600}
      >
        <View className="relative mb-4">
          <View className="flex-row gap-2 mb-3">
            {(['용신', '희신', '기신'] as const).map((role) => (
              <View
                key={role}
                className="flex-1 rounded-sm py-2 items-center"
                style={{ backgroundColor: colors.border, height: 34 }}
              />
            ))}
          </View>
          <View className="gap-2">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                className="rounded-md"
                style={{ height: 56, backgroundColor: colors.border }}
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

  if (!yongsin || !heesin || !gisin) {
    return (
      <SectionCard title="용신 보완">
        <Font
          tag="secondary"
          className="text-textTertiary text-center py-3"
          style={{ fontSize: 13 }}
        >
          사주 분석 결과가 없습니다.{'\n'}명주 등록 시 자동으로 계산됩니다.
        </Font>
      </SectionCard>
    );
  }

  const slots = [nameInput.first1, nameInput.first2];

  const roleEntries: Array<{ role: '용신' | '희신' | '기신'; ohaeng: Ohaeng }> =
    [
      { role: '용신', ohaeng: yongsin },
      { role: '희신', ohaeng: heesin },
      { role: '기신', ohaeng: gisin },
    ];

  return (
    <SectionCard title="용신 보완">
      {/* 상단 3컬럼 배지 행 */}
      <View className="flex-row gap-2 mb-4">
        {roleEntries.map(({ role, ohaeng }) => {
          const style = ROLE_STYLE[role];
          const oc = ohaengColors[ohaeng];
          return (
            <View key={role} className="flex-1 items-center gap-1">
              <Font
                tag="secondary"
                style={{ fontSize: 11, color: style.badgeColor }}
              >
                {role}
              </Font>
              <View
                className="flex-row items-center gap-[4px] px-2 py-[4px] rounded-sm border"
                style={{
                  backgroundColor: oc.light,
                  borderColor: oc.border,
                }}
              >
                <View
                  className="rounded-full"
                  style={{
                    width: 7,
                    height: 7,
                    backgroundColor: oc.base,
                  }}
                />
                <Font
                  tag="secondaryMedium"
                  style={{ fontSize: 12, color: oc.base }}
                >
                  {ohaeng}({OHAENG_HANJA[ohaeng]})
                </Font>
              </View>
            </View>
          );
        })}
      </View>

      {/* 용신/희신/기신 설명 박스 */}
      <View className="gap-2 mb-4">
        {roleEntries.map(({ role, ohaeng }) => {
          const style = ROLE_STYLE[role];
          const desc = ROLE_DESC[role];
          return (
            <View
              key={role}
              className="rounded-lg p-3 border flex-row gap-2"
              style={{
                backgroundColor: style.boxBg,
                borderColor: style.boxBorder,
              }}
            >
              <View
                className="px-[6px] py-[2px] rounded-sm self-start"
                style={{ backgroundColor: style.badgeColor }}
              >
                <Font
                  tag="secondaryMedium"
                  style={{ fontSize: 10, color: '#fff' }}
                >
                  {role}
                </Font>
              </View>
              <View className="flex-1">
                <Font
                  tag="secondaryMedium"
                  style={{
                    fontSize: 12,
                    color: style.badgeColor,
                    marginBottom: 2,
                  }}
                >
                  {ohaeng}({OHAENG_HANJA[ohaeng]})
                </Font>
                <Font
                  tag="secondary"
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    lineHeight: 18,
                  }}
                >
                  {desc.desc}
                </Font>
              </View>
            </View>
          );
        })}
      </View>

      {/* 이름 글자별 판정 */}
      <View className="pt-3 border-t" style={{ borderTopColor: colors.border }}>
        <Font
          tag="secondaryMedium"
          className="text-textSecondary mb-3"
          style={{ fontSize: 12 }}
        >
          이름 글자별 판정
        </Font>

        <View className="gap-2">
          {slots.map((slot, i) => {
            const charOhaeng = slot.charOhaeng;
            const role = charOhaeng
              ? charYongsinRole(yongsin, charOhaeng)
              : null;
            const hasHanja = Boolean(slot.hanja);

            if (!hasHanja) {
              return (
                <View
                  key={i}
                  className="flex-row items-center gap-2 rounded-lg p-3 border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    className="items-center justify-center rounded-lg"
                    style={{
                      width: 44,
                      height: 52,
                      backgroundColor: colors.bgSubtle,
                    }}
                  >
                    <Font
                      tag="secondaryMedium"
                      style={{ fontSize: 18, color: colors.textDisabled }}
                    >
                      {slot.hangul || '?'}
                    </Font>
                    <Font
                      tag="secondary"
                      style={{ fontSize: 9, color: colors.textDisabled }}
                    >
                      미선택
                    </Font>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={colors.textDisabled}
                  />
                  <View className="flex-1">
                    <View
                      className="self-start px-2 py-[2px] rounded-full border mb-1"
                      style={{
                        borderColor: colors.border,
                      }}
                    >
                      <Font
                        tag="secondaryMedium"
                        style={{ fontSize: 10, color: colors.textTertiary }}
                      >
                        미선택
                      </Font>
                    </View>
                    <Font
                      tag="secondaryMedium"
                      style={{
                        fontSize: 12,
                        color: colors.textTertiary,
                        marginBottom: 1,
                      }}
                    >
                      한자 선택 후 분석
                    </Font>
                    <Font
                      tag="secondary"
                      style={{
                        fontSize: 11,
                        color: colors.textDisabled,
                        lineHeight: 16,
                      }}
                    >
                      한자 선택 시 용신 보완 여부를 확인할 수 있습니다.
                    </Font>
                  </View>
                </View>
              );
            }

            const roleInfo = role ? CHAR_ROLE_INFO[role] : null;
            const roleKey = role as '용' | '희' | '기' | '중' | null;
            const roleStyleMap: Record<
              '용' | '희' | '기' | '중',
              {
                badgeColor: string;
                badgeBg: string;
                badgeBorder: string;
                boxBg: string;
                boxBorder: string;
              }
            > = {
              용: ROLE_STYLE['용신'],
              희: ROLE_STYLE['희신'],
              기: ROLE_STYLE['기신'],
              중: {
                badgeColor: colors.textTertiary,
                badgeBg: colors.surface,
                badgeBorder: colors.border,
                boxBg: colors.surface,
                boxBorder: colors.border,
              },
            };
            const cardStyle = roleKey
              ? roleStyleMap[roleKey]
              : {
                  badgeColor: colors.textTertiary,
                  badgeBg: colors.surface,
                  badgeBorder: colors.border,
                  boxBg: colors.surface,
                  boxBorder: colors.border,
                };

            const oc = charOhaeng ? ohaengColors[charOhaeng] : null;

            return (
              <View
                key={i}
                className="flex-row items-center gap-2 rounded-lg p-3 border"
                style={{
                  backgroundColor: cardStyle.boxBg,
                  borderColor: cardStyle.boxBorder,
                }}
              >
                <View
                  className="items-center justify-center rounded-lg border"
                  style={{
                    width: 44,
                    height: 52,
                    backgroundColor: oc ? oc.light : colors.bgSubtle,
                    borderColor: oc ? oc.border : colors.border,
                  }}
                >
                  <Font
                    tag="primaryMedium"
                    style={{
                      fontSize: 20,
                      color: oc ? oc.base : colors.textPrimary,
                    }}
                  >
                    {slot.hanja}
                  </Font>
                  {charOhaeng && oc && (
                    <Font
                      tag="secondary"
                      style={{ fontSize: 9, color: oc.base }}
                    >
                      {charOhaeng}({OHAENG_HANJA[charOhaeng]})
                    </Font>
                  )}
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={colors.textTertiary}
                />
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    {roleInfo && (
                      <View
                        className="self-start px-2 py-[2px] rounded-sm"
                        style={{ backgroundColor: cardStyle.badgeColor }}
                      >
                        <Font
                          tag="secondaryMedium"
                          style={{ fontSize: 10, color: '#fff' }}
                        >
                          {roleInfo.label}
                        </Font>
                      </View>
                    )}
                    <Font
                      tag="secondaryMedium"
                      style={{
                        fontSize: 12,
                        color: cardStyle.badgeColor,
                        marginBottom: 1,
                      }}
                    >
                      {roleInfo?.title ?? '분석 불가'}
                    </Font>
                  </View>
                  <Font
                    tag="secondary"
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                      lineHeight: 16,
                    }}
                  >
                    {roleInfo?.desc ?? '오행 정보가 없어 분석할 수 없습니다.'}
                  </Font>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 하단 요약 텍스트 */}
      <View
        className="mt-4 p-3 rounded-lg border"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <Font
          tag="secondary"
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 18,
          }}
        >
          이름에 용신 오행을 담으면 사주의 균형이 강화됩니다. 용신·희신 계열
          한자를 우선 선택하고, 기신 계열 한자는 가급적 피하는 것을 권장합니다.
        </Font>
      </View>
    </SectionCard>
  );
}
