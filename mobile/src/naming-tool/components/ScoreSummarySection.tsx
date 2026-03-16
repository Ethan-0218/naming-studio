import React from 'react';
import { Text, View } from 'react-native';
import { colors, fontFamily } from '@/design-system';

interface Props {
  score: number | null;
}

function ScoreLabel(score: number): string {
  if (score >= 80) return '매우 좋은 이름';
  if (score >= 60) return '좋은 이름';
  if (score >= 40) return '보통 이름';
  return '보완이 필요한 이름';
}

function scoreColor(score: number): string {
  if (score >= 80) return colors.positive;
  if (score >= 60) return colors.fillAccent;
  if (score >= 40) return colors.warning;
  return colors.negative;
}

const GAUGE_SIZE = 54;
const INNER_SIZE = 44;

export default function ScoreSummarySection({ score }: Props) {
  const pct = score != null ? score / 100 : 0;
  const fillColor = score != null ? scoreColor(score) : colors.textSecondary;

  const rightRotate = -180 + Math.min(pct, 0.5) * 360;
  const leftRotate = Math.max(0, (pct - 0.5) * 360);

  return (
    <View className="bg-fillBold rounded-lg p-4 flex-row items-center justify-between">
      <View className="flex-1 justify-center">
        <Text
          className="text-overline text-textTertiary uppercase"
          style={{ fontFamily: fontFamily.sansMedium }}
        >
          종합 점수
        </Text>
        <Text
          className="text-numeralLg"
          style={{
            fontFamily: fontFamily.serifSemiBold,
            color: score != null ? scoreColor(score) : colors.textDisabled,
          }}
        >
          {score != null ? score : '–'}
        </Text>
        {score != null && (
          <Text
            className="text-bodySm text-textTertiary"
            style={{ fontFamily: fontFamily.sansRegular }}
          >
            {ScoreLabel(score)}
          </Text>
        )}
      </View>

      <View style={{ width: GAUGE_SIZE, height: GAUGE_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            position: 'absolute',
            width: GAUGE_SIZE,
            height: GAUGE_SIZE,
            borderRadius: GAUGE_SIZE / 2,
            backgroundColor: colors.textSecondary,
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 0,
            width: GAUGE_SIZE / 2,
            height: GAUGE_SIZE,
            overflow: 'hidden',
          }}
        >
          <View
            style={[
              {
                position: 'absolute',
                width: GAUGE_SIZE,
                height: GAUGE_SIZE,
                left: -(GAUGE_SIZE / 2),
              },
              { transform: [{ rotate: `${rightRotate}deg` }] },
            ]}
          >
            <View
              style={{
                position: 'absolute',
                right: 0,
                width: GAUGE_SIZE / 2,
                height: GAUGE_SIZE,
                backgroundColor: fillColor,
                borderTopRightRadius: GAUGE_SIZE / 2,
                borderBottomRightRadius: GAUGE_SIZE / 2,
              }}
            />
          </View>
        </View>
        <View
          style={{
            position: 'absolute',
            left: 0,
            width: GAUGE_SIZE / 2,
            height: GAUGE_SIZE,
            overflow: 'hidden',
          }}
        >
          <View
            style={[
              {
                position: 'absolute',
                width: GAUGE_SIZE,
                height: GAUGE_SIZE,
                left: 0,
              },
              { transform: [{ rotate: `${leftRotate}deg` }] },
            ]}
          >
            <View
              style={{
                position: 'absolute',
                right: 0,
                width: GAUGE_SIZE / 2,
                height: GAUGE_SIZE,
                backgroundColor: fillColor,
                borderTopRightRadius: GAUGE_SIZE / 2,
                borderBottomRightRadius: GAUGE_SIZE / 2,
              }}
            />
          </View>
        </View>
        <View
          style={{
            width: INNER_SIZE,
            height: INNER_SIZE,
            borderRadius: INNER_SIZE / 2,
            backgroundColor: colors.fillBold,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Text
            className="text-numeralMd text-textDisabled"
            style={{ fontFamily: fontFamily.serifMedium }}
          >
            {score != null ? score : '–'}
          </Text>
        </View>
      </View>
    </View>
  );
}
