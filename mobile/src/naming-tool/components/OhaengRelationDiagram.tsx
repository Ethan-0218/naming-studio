import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, ohaengColors, textStyles, radius } from '@/design-system';
import { Ohaeng, OhaengRelation } from '../types';
import { generates, destroys, ohaengLabel } from '../domain/ohaeng';

export interface OhaengNodeData {
  character: string | null;   // 한글 또는 한자 모두 가능 ('김', '民', '準')
  ohaeng: Ohaeng | null;
  positionLabel: string;      // '성', '첫째', '둘째'
}

// 노드 크기: 기존(52) × 1.4
const NODE_SIZE = 73;

// 삼각형 레이아웃 — 노드 center 좌표
// 원 사이 gap을 기존 대비 0.6배로 줄인 위치
const CENTERS = [
  { x: 130, y: 37 },   // [0] 성 (상단)
  { x: 55, y: 153 },   // [1] 첫째 (좌하)
  { x: 205, y: 153 },  // [2] 둘째 (우하)
] as const;

// 기하학적 쌍 인덱스 (방향과 무관)
const PAIR_INDICES: [number, number][] = [[0, 1], [1, 2], [0, 2]];

// 쌍별 레이블 오프셋 — 삼각형 외측 방향
const PAIR_LABEL_OFFSETS = [
  { dx: -12, dy: -8 },  // pair (0,1): 좌측 외측
  { dx: 0,   dy: 50 },  // pair (1,2): 하단 외측 (노드 아래)
  { dx: 12,  dy: -8 },  // pair (0,2): 우측 외측
];

const RELATION_COLOR: Record<OhaengRelation, string> = {
  '상생': palette.teal,
  '상극': palette.vermillion,
  '동일': palette.borderMd,
};

interface DirectedPair {
  fromIdx: number;
  toIdx: number;
  relation: OhaengRelation;
}

function getDirectedPair(
  aIdx: number,
  bIdx: number,
  ohaengA: Ohaeng | null,
  ohaengB: Ohaeng | null,
): DirectedPair {
  if (!ohaengA || !ohaengB || ohaengA === ohaengB) {
    return { fromIdx: aIdx, toIdx: bIdx, relation: '동일' };
  }
  if (generates(ohaengA, ohaengB)) return { fromIdx: aIdx, toIdx: bIdx, relation: '상생' };
  if (generates(ohaengB, ohaengA)) return { fromIdx: bIdx, toIdx: aIdx, relation: '상생' };
  if (destroys(ohaengA, ohaengB)) return { fromIdx: aIdx, toIdx: bIdx, relation: '상극' };
  if (destroys(ohaengB, ohaengA)) return { fromIdx: bIdx, toIdx: aIdx, relation: '상극' };
  return { fromIdx: aIdx, toIdx: bIdx, relation: '동일' };
}

interface ArrowProps {
  pair: DirectedPair;
  pairIndex: number;
  nodes: readonly OhaengNodeData[];
}

function ArrowEdge({ pair, pairIndex, nodes }: ArrowProps) {
  const { fromIdx, toIdx, relation } = pair;
  const from = CENTERS[fromIdx];
  const to = CENTERS[toIdx];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const effectiveDist = dist - NODE_SIZE; // 양쪽 노드 가장자리까지
  const color = RELATION_COLOR[relation];
  const isDashed = relation === '동일';

  // 화살표 레이블: 水生木 / 金剋木 형식
  const fromOhaeng = nodes[fromIdx].ohaeng;
  const toOhaeng = nodes[toIdx].ohaeng;
  let labelText = '';
  if (fromOhaeng && toOhaeng && relation !== '동일') {
    const verb = relation === '상생' ? '生' : '剋';
    labelText = `${ohaengLabel(fromOhaeng)}${verb}${ohaengLabel(toOhaeng)}`;
  }

  const { dx: ldx, dy: ldy } = PAIR_LABEL_OFFSETS[pairIndex];
  const labelX = midX + ldx;
  const labelY = midY + ldy;

  return (
    <>
      {/* 화살표 라인 + 화살촉 */}
      <View
        style={{
          position: 'absolute',
          width: effectiveDist,
          height: 18,
          left: midX - effectiveDist / 2,
          top: midY - 9,
          transform: [{ rotate: `${angle}deg` }],
        }}
      >
        {isDashed ? (
          // 동일: 점선, 화살촉 없음
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 8,
              height: 0,
              borderTopWidth: 1.5,
              borderTopColor: color,
              borderStyle: 'dashed',
            }}
          />
        ) : (
          <>
            {/* 라인 — 화살촉 너비(10)만큼 앞에서 끝남 */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 10,
                top: 8,
                height: 2,
                backgroundColor: color,
              }}
            />
            {/* CSS border 삼각형 화살촉 — 라인 끝에 바로 붙음 */}
            <View
              style={{
                position: 'absolute',
                right: 0,
                top: 2,
                width: 0,
                height: 0,
                borderTopWidth: 7,
                borderTopColor: 'transparent',
                borderBottomWidth: 7,
                borderBottomColor: 'transparent',
                borderLeftWidth: 10,
                borderLeftColor: color,
              }}
            />
          </>
        )}
      </View>

      {/* 관계 레이블 (비회전 텍스트) */}
      {labelText !== '' && (
        <View
          style={{
            position: 'absolute',
            left: labelX - 24,
            top: labelY - 7,
            width: 48,
            alignItems: 'center',
          }}
        >
          <Text style={[textStyles.caption, { color, letterSpacing: 0 }]}>{labelText}</Text>
        </View>
      )}
    </>
  );
}

function OhaengNode({ data }: { data: OhaengNodeData }) {
  const { character, ohaeng, positionLabel } = data;
  const colors = ohaeng ? ohaengColors[ohaeng] : null;
  return (
    <View
      style={[
        styles.node,
        colors
          ? { backgroundColor: colors.light, borderColor: colors.border }
          : styles.nodeEmpty,
      ]}
    >
      <Text style={[textStyles.hanjaSm, { color: palette.ink, lineHeight: 19, fontSize: 18 }]}>
        {character ?? '?'}
      </Text>
      {ohaeng ? (
        <Text style={[textStyles.caption, { color: colors?.base, lineHeight: 13, letterSpacing: 0 }]}>
          {ohaeng}({ohaengLabel(ohaeng)})
        </Text>
      ) : null}
      <Text style={[textStyles.overline, { color: colors?.base ?? palette.inkFaint, fontSize: 8, lineHeight: 10, letterSpacing: 0 }]}>
        {positionLabel}
      </Text>
    </View>
  );
}

function Legend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendLine, { backgroundColor: palette.teal }]} />
        <View style={[styles.legendArrowHead, { borderLeftColor: palette.teal }]} />
        <Text style={styles.legendLabel}>생(生) 좋음</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendLine, { backgroundColor: palette.vermillion }]} />
        <View style={[styles.legendArrowHead, { borderLeftColor: palette.vermillion }]} />
        <Text style={styles.legendLabel}>극(剋) 나쁨</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDash, { borderTopColor: palette.borderMd }]} />
        <Text style={styles.legendLabel}>중립</Text>
      </View>
    </View>
  );
}

interface Props {
  nodes: [OhaengNodeData, OhaengNodeData, OhaengNodeData];
}

export default function OhaengRelationDiagram({ nodes }: Props) {
  const directedPairs = PAIR_INDICES.map(([a, b]) =>
    getDirectedPair(a, b, nodes[a].ohaeng, nodes[b].ohaeng),
  );

  return (
    <View style={styles.wrapper}>
      <Legend />
      <View style={styles.container}>
        {/* 화살표 (노드 아래에 렌더링) */}
        {directedPairs.map((pair, i) => (
          <ArrowEdge key={i} pair={pair} pairIndex={i} nodes={nodes} />
        ))}
        {/* 노드 (화살표 위에 렌더링) */}
        {CENTERS.map((center, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: center.x - NODE_SIZE / 2,
              top: center.y - NODE_SIZE / 2,
            }}
          >
            <OhaengNode data={nodes[i]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  legend: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
    columnGap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 1,
  },
  legendLine: {
    width: 14,
    height: 1.5,
  },
  legendArrowHead: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderTopColor: 'transparent',
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
    borderLeftWidth: 5,
  },
  legendDash: {
    width: 14,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    marginRight: 4,
  },
  legendLabel: {
    ...textStyles.caption,
    color: palette.inkMid,
    letterSpacing: 0,
    marginLeft: 3,
  },
  container: {
    width: 260,
    height: 225,
    position: 'relative',
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeEmpty: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderStyle: 'dashed',
  },
});
