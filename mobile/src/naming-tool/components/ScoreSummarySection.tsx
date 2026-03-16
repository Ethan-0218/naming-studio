import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, textStyles, spacing, radius } from '@/design-system';

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
  if (score >= 80) return palette.teal;
  if (score >= 60) return palette.gold;
  if (score >= 40) return palette.amber;
  return palette.vermillion;
}

export default function ScoreSummarySection({ score }: Props) {
  const pct = score != null ? score / 100 : 0;
  const fillColor = score != null ? scoreColor(score) : palette.inkMid;

  // 12시 방향에서 시계 방향으로 채우기
  // 오른쪽 클립: 0%→-180deg, 50%→0deg
  const rightRotate = -180 + Math.min(pct, 0.5) * 360;
  // 왼쪽 클립: 50%→0deg, 100%→180deg
  const leftRotate = Math.max(0, (pct - 0.5) * 360);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={[textStyles.sectionLabel, { color: palette.inkLight }]}>종합 점수</Text>
        <Text style={[textStyles.scoreDisplay, { color: score != null ? scoreColor(score) : palette.inkFaint, marginTop: spacing['1'] }]}>
          {score != null ? score : '–'}
        </Text>
        {score != null && (
          <Text style={[textStyles.body, { color: palette.inkLight, marginTop: spacing['1'] }]}>
            {ScoreLabel(score)}
          </Text>
        )}
      </View>

      {/* 도넛 게이지 */}
      <View style={styles.gauge}>
        {/* 트랙 (배경 원) */}
        <View style={styles.track} />

        {/* 오른쪽 클립 (0~50% 진행) */}
        <View style={styles.clipRight}>
          <View style={[styles.rotatingHalf, styles.rotatingHalfRight, { transform: [{ rotate: `${rightRotate}deg` }] }]}>
            <View style={[styles.semiRight, { backgroundColor: fillColor }]} />
          </View>
        </View>

        {/* 왼쪽 클립 (50~100% 진행) */}
        <View style={styles.clipLeft}>
          <View style={[styles.rotatingHalf, styles.rotatingHalfLeft, { transform: [{ rotate: `${leftRotate}deg` }] }]}>
            <View style={[styles.semiRight, { backgroundColor: fillColor }]} />
          </View>
        </View>

        {/* 내부 원 (도넛 구멍) */}
        <View style={styles.innerCircle}>
          <Text style={[textStyles.numerologyNum, { color: palette.inkFaint }]}>
            {score != null ? score : '–'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const GAUGE_SIZE = 72;
const INNER_SIZE = 52;

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.ink,
    borderRadius: radius.lg,
    padding: spacing['4'],
    marginBottom: spacing['3'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
  },
  gauge: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    borderRadius: GAUGE_SIZE / 2,
    backgroundColor: palette.inkMid,
  },
  // 오른쪽 반원 클립 (right: 0 기준)
  clipRight: {
    position: 'absolute',
    right: 0,
    width: GAUGE_SIZE / 2,
    height: GAUGE_SIZE,
    overflow: 'hidden',
  },
  // 왼쪽 반원 클립 (left: 0 기준)
  clipLeft: {
    position: 'absolute',
    left: 0,
    width: GAUGE_SIZE / 2,
    height: GAUGE_SIZE,
    overflow: 'hidden',
  },
  // 회전 기준 뷰: GAUGE_SIZE × GAUGE_SIZE, 중앙 = 트랙 중앙
  rotatingHalf: {
    position: 'absolute',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
  },
  rotatingHalfRight: {
    left: -(GAUGE_SIZE / 2), // 중앙을 클립 컨테이너 왼쪽 끝(=트랙 중심)에 맞춤
  },
  rotatingHalfLeft: {
    left: 0, // 중앙을 클립 컨테이너 오른쪽 끝(=트랙 중심)에 맞춤
  },
  // 오른쪽 반원 채우기
  semiRight: {
    position: 'absolute',
    right: 0,
    width: GAUGE_SIZE / 2,
    height: GAUGE_SIZE,
    borderTopRightRadius: GAUGE_SIZE / 2,
    borderBottomRightRadius: GAUGE_SIZE / 2,
  },
  innerCircle: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
