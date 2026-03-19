import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Font } from '@/components/Font';
import { colors, ohaengColors } from '@/design-system';
import { NameData } from '../types';

interface Props {
  data: NameData;
  liked: boolean;
  disliked: boolean;
  onLike: () => void;
  onDislike: () => void;
}

export default function NameCard({
  data,
  liked,
  disliked,
  onLike,
  onDislike,
}: Props) {
  return (
    <View
      className="rounded-[14px] mb-2 w-full overflow-hidden border border-border"
      style={{ borderLeftWidth: 3, borderLeftColor: colors.fillAccent }}
    >
      {/* 헤더: 이름 + 점수 */}
      <View className="flex-row items-start justify-between gap-2.5 px-3.5 pt-3.5 pb-3">
        <View className="flex-1 min-w-0">
          {/* 전체 이름 */}
          <Font
            tag="primaryMedium"
            style={{
              fontSize: 26,
              color: colors.textPrimary,
              letterSpacing: 2,
              lineHeight: 32,
              marginBottom: 8,
            }}
          >
            {data.full_name}
          </Font>

          {/* 음절별 한자 + 오행 */}
          <View className="flex-row items-stretch">
            {data.syllables.map((syl, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <View
                    style={{
                      width: 1,
                      backgroundColor: colors.border,
                      alignSelf: 'stretch',
                    }}
                  />
                )}
                <View className="items-center gap-1 px-2.5">
                  <Font
                    tag="primary"
                    style={{
                      fontSize: 13,
                      color: colors.textTertiary,
                      letterSpacing: 1,
                    }}
                  >
                    {syl.한자 || syl.한글}
                  </Font>
                  {syl.오행 ? (
                    <Font
                      tag="secondaryMedium"
                      style={{
                        fontSize: 12,
                        color:
                          ohaengColors[syl.오행 as keyof typeof ohaengColors]
                            ?.base ?? colors.textDisabled,
                      }}
                    >
                      {syl.오행}
                    </Font>
                  ) : null}
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* 점수 원형 표시 */}
        {data.score_breakdown &&
          Object.keys(data.score_breakdown).length > 0 && (
            <View className="items-center gap-1 flex-shrink-0">
              <ScoreGauge score={overallScore(data.score_breakdown)} />
              <Font
                tag="secondary"
                style={{ fontSize: 11, color: colors.textDisabled }}
              >
                종합점수
              </Font>
            </View>
          )}
      </View>

      {/* 구분선 */}
      <View style={{ height: 1, backgroundColor: colors.border }} />

      {/* 이유 */}
      {data.reason ? (
        <View className="px-3.5 py-3">
          <Font
            tag="secondary"
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              lineHeight: 22,
            }}
          >
            {data.reason}
          </Font>
        </View>
      ) : null}

      {/* 한자 옵션 */}
      {data.syllables.some(
        (syl) => syl.hanja_options && syl.hanja_options.length > 0,
      ) ? (
        <View
          className="px-3.5 pb-3 gap-1.5"
          style={{ borderTopWidth: 1, borderTopColor: colors.border }}
        >
          {data.syllables.map((syl, i) =>
            syl.hanja_options && syl.hanja_options.length > 0 ? (
              <View key={i} className="gap-1">
                <Font
                  tag="secondaryMedium"
                  style={{
                    fontSize: 11,
                    color: colors.textTertiary,
                    marginTop: 10,
                  }}
                >
                  {syl.한글} 한자 선택:
                </Font>
                <View className="flex-row flex-wrap gap-1.5">
                  {syl.hanja_options.map((opt, j) => (
                    <View
                      key={j}
                      className="flex-row items-center gap-0.5 rounded-md px-1.5 py-0.5"
                      style={{ backgroundColor: colors.surface }}
                    >
                      <Font
                        tag="primaryMedium"
                        style={{ fontSize: 14, color: colors.textPrimary }}
                      >
                        {opt.한자}
                      </Font>
                      <Font
                        tag="secondary"
                        style={{ fontSize: 11, color: colors.textTertiary }}
                      >
                        {opt.meaning}
                      </Font>
                    </View>
                  ))}
                </View>
              </View>
            ) : null,
          )}
        </View>
      ) : null}

      {/* 상세 분석 링크 행 */}
      <View
        className="flex-row items-center justify-between px-3.5 py-2.5"
        style={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Font
          tag="secondary"
          style={{ fontSize: 12, color: colors.textTertiary }}
        >
          상세 분석 보기
        </Font>
        <Ionicons
          name="chevron-forward"
          size={13}
          color={colors.textDisabled}
        />
      </View>

      {/* 좋아요/별로 버튼 */}
      <View
        className="flex-row"
        style={{ borderTopWidth: 1, borderTopColor: colors.border }}
      >
        <Pressable
          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5"
          style={{
            backgroundColor: liked ? '#EAF4F2' : colors.surfaceRaised,
            borderRightWidth: 1,
            borderRightColor: colors.border,
          }}
          onPress={onLike}
        >
          <Ionicons
            name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
            size={14}
            color={liked ? '#2A6060' : colors.textSecondary}
          />
          <Font
            tag={liked ? 'secondaryMedium' : 'secondary'}
            style={{
              fontSize: 13,
              color: liked ? '#2A6060' : colors.textSecondary,
            }}
          >
            좋아요
          </Font>
        </Pressable>
        <Pressable
          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5"
          style={{
            backgroundColor: disliked ? '#FBF0EE' : colors.surfaceRaised,
          }}
          onPress={onDislike}
        >
          <Ionicons
            name={disliked ? 'thumbs-down' : 'thumbs-down-outline'}
            size={14}
            color={disliked ? '#B83A2A' : colors.textSecondary}
          />
          <Font
            tag={disliked ? 'secondaryMedium' : 'secondary'}
            style={{
              fontSize: 13,
              color: disliked ? '#B83A2A' : colors.textSecondary,
            }}
          >
            별로에요
          </Font>
        </Pressable>
      </View>
    </View>
  );
}

function overallScore(
  breakdown: NonNullable<NameData['score_breakdown']>,
): number {
  const vals = Object.values(breakdown).filter(
    (v): v is number => typeof v === 'number',
  );
  if (vals.length === 0) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100);
}

function ScoreGauge({ score }: { score: number }) {
  const r = 19;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <View style={{ width: 48, height: 48 }}>
      {/* SVG-like circle using Views */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          borderWidth: 3,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Font
          tag="secondaryMedium"
          style={{ fontSize: 13, color: colors.textPrimary }}
        >
          {score}
        </Font>
      </View>
    </View>
  );
}
