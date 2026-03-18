import React from 'react';
import { View } from 'react-native';
import { colors, ohaengColors, radius } from '@/design-system';
import { Font } from '@/components/Font';
import { Ohaeng, OhaengRelation } from '../types';
import { generates, destroys, ohaengLabel } from '../domain/ohaeng';

export interface OhaengNodeData {
  character: string | null;
  ohaeng: Ohaeng | null;
  positionLabel: string;
}

const NODE_SIZE = 73;

const CENTERS = [
  { x: 130, y: 37 },
  { x: 55, y: 153 },
  { x: 205, y: 153 },
] as const;

const PAIR_INDICES: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 2],
];

const PAIR_LABEL_OFFSETS = [
  { dx: -12, dy: -8 },
  { dx: 0, dy: -10 },
  { dx: 12, dy: -8 },
];

const RELATION_COLOR: Record<OhaengRelation, string> = {
  상생: colors.positive,
  상극: colors.negative,
  동일: colors.borderStrong,
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
  if (generates(ohaengA, ohaengB))
    return { fromIdx: aIdx, toIdx: bIdx, relation: '상생' };
  if (generates(ohaengB, ohaengA))
    return { fromIdx: bIdx, toIdx: aIdx, relation: '상생' };
  if (destroys(ohaengA, ohaengB))
    return { fromIdx: aIdx, toIdx: bIdx, relation: '상극' };
  if (destroys(ohaengB, ohaengA))
    return { fromIdx: bIdx, toIdx: aIdx, relation: '상극' };
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
  const effectiveDist = dist - NODE_SIZE;
  const color = RELATION_COLOR[relation];
  const isDashed = relation === '동일';

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
          <Font
            tag="secondaryMedium"
            className="text-caption"
            style={{ color, letterSpacing: 0 }}
          >
            {labelText}
          </Font>
        </View>
      )}
    </>
  );
}

function OhaengNode({ data }: { data: OhaengNodeData }) {
  const { character, ohaeng, positionLabel } = data;
  const oc = ohaeng ? ohaengColors[ohaeng] : null;
  return (
    <View
      className="items-center justify-center rounded-full border-[1.5px]"
      style={[
        {
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: radius.full,
        },
        oc
          ? { backgroundColor: oc.light, borderColor: oc.border }
          : {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderStyle: 'dashed',
            },
      ]}
    >
      <Font
        tag="primaryMedium"
        className="text-hanjaSm"
        style={{
          color: colors.textPrimary,
          lineHeight: 19,
          fontSize: 18,
        }}
      >
        {character ?? '?'}
      </Font>
      <Font
        tag="secondaryMedium"
        className="text-caption mt-[2px]"
        style={{
          fontSize: 10,
          color: oc?.base ?? colors.textDisabled,
          lineHeight: 13,
          letterSpacing: 0,
        }}
      >
        {ohaeng ? `${ohaeng}(${ohaengLabel(ohaeng)})` : '미선택'}
      </Font>
      <Font
        tag="secondaryMedium"
        className="text-overline mt-[2px]"
        style={{
          color: oc?.base ?? colors.textDisabled,
          fontSize: 9,
          lineHeight: 10,
          letterSpacing: 0,
        }}
      >
        {positionLabel}
      </Font>
    </View>
  );
}

function Legend() {
  return (
    <View className="flex-row mb-2 items-center gap-3">
      <View className="flex-row items-center gap-0.5">
        <View
          className="h-[1.5px] w-3.5 bg-positive"
          style={{ width: 14, height: 1.5 }}
        />
        <View
          className="border-l-[5px] border-t-4 border-b-4 border-t-transparent border-b-transparent"
          style={{ borderLeftColor: colors.positive, width: 0, height: 0 }}
        />
        <Font
          tag="secondaryMedium"
          className="text-caption"
          style={{
            color: colors.textSecondary,
            letterSpacing: 0,
            marginLeft: 3,
          }}
        >
          생(生) 좋음
        </Font>
      </View>
      <View className="flex-row items-center gap-0.5">
        <View
          className="h-[1.5px] w-3.5 bg-negative"
          style={{ width: 14, height: 1.5 }}
        />
        <View
          style={{
            width: 0,
            height: 0,
            borderTopWidth: 4,
            borderTopColor: 'transparent',
            borderBottomWidth: 4,
            borderBottomColor: 'transparent',
            borderLeftWidth: 5,
            borderLeftColor: colors.negative,
          }}
        />
        <Font
          tag="secondaryMedium"
          className="text-caption"
          style={{
            color: colors.textSecondary,
            letterSpacing: 0,
            marginLeft: 3,
          }}
        >
          극(剋) 나쁨
        </Font>
      </View>
      <View className="flex-row items-center">
        <View
          className="w-3.5 h-0 border-t-[1.5px] border-dashed border-borderStrong mr-1"
          style={{ width: 14, borderTopColor: colors.borderStrong }}
        />
        <Font
          tag="secondaryMedium"
          className="text-caption"
          style={{
            color: colors.textSecondary,
            letterSpacing: 0,
            marginLeft: 3,
          }}
        >
          중립
        </Font>
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
    <View className="items-center py-2">
      <Legend />
      <View className="w-[260px] h-[189px] relative">
        {directedPairs.map((pair, i) => (
          <ArrowEdge key={i} pair={pair} pairIndex={i} nodes={nodes} />
        ))}
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
