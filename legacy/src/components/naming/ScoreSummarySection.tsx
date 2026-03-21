import React from 'react';
import { View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';

interface Props {
  score: number | null;
  ohaengScore: number | null;
  suriScore: number | null;
  eumyangScore: number | null;
}

function buildScoreLabel(
  total: number,
  ohaeng: number | null,
  suri: number | null,
): string {
  const ok = (v: number | null) => v != null && v >= 62;
  const bad = (v: number | null) => v != null && v < 40;

  if (ok(ohaeng) && ok(suri)) return '오행과 수리의 기운이 균형 잡힌 이름';
  if (ok(ohaeng) && bad(suri))
    return '오행의 기운은 좋으나 수리격 보완이 필요한 이름';
  if (ok(suri) && bad(ohaeng))
    return '수리격이 안정적이나 오행 조화가 필요한 이름';
  if (bad(ohaeng) && bad(suri)) return '오행·수리 전반의 보완이 필요한 이름';
  if (bad(ohaeng)) return '오행 조화의 보완이 필요한 이름';
  if (bad(suri)) return '수리격 보완이 필요한 이름';
  if (total >= 75) return '작명 요소가 고르게 갖춰진 이름';
  if (total >= 45) return '일부 작명 요소의 보완이 권장되는 이름';
  return '작명 요소 전반의 재검토가 필요한 이름';
}

function scoreColor(score: number): string {
  if (score >= 80) return colors.positive;
  if (score >= 60) return colors.fillAccent;
  if (score >= 40) return colors.warning;
  return colors.negative;
}

const GAUGE_SIZE = 54;
const INNER_SIZE = 44;

export default function ScoreSummarySection({
  score,
  ohaengScore,
  suriScore,
  eumyangScore,
}: Props) {
  const pct = score != null ? score / 100 : 0;
  const fillColor = score != null ? scoreColor(score) : colors.textSecondary;

  const rightRotate = -180 + Math.min(pct, 0.5) * 360;
  const leftRotate = Math.max(0, (pct - 0.5) * 360);

  return (
    <View className="bg-fillBold rounded-lg p-4 flex-row items-center justify-between">
      <View className="flex-1 justify-center">
        <Font
          tag="secondaryMedium"
          className="text-label text-textTertiary uppercase"
        >
          종합 점수
        </Font>
        <Font
          tag="primaryBold"
          className="text-numeralLg"
          style={{
            color: score != null ? scoreColor(score) : colors.textDisabled,
          }}
        >
          {score != null ? score : '–'}
        </Font>
        {score != null && (
          <Font tag="secondary" className="text-bodySm text-textTertiary">
            {buildScoreLabel(score, ohaengScore, suriScore)}
          </Font>
        )}
      </View>

      <View
        style={{
          width: GAUGE_SIZE,
          height: GAUGE_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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
          <Font
            tag="primaryMedium"
            className="text-numeralMd text-textDisabled"
          >
            {score != null ? score : '–'}
          </Font>
        </View>
      </View>
    </View>
  );
}
