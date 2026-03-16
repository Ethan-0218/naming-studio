import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, ohaengColors, textStyles, spacing, radius } from '@/design-system';
import { Ohaeng, OhaengRelation } from '../types';

interface Props {
  elements: (Ohaeng | null)[];
  relations: (OhaengRelation | null)[];
}

const RELATION_LABEL: Record<OhaengRelation, string> = {
  '상생': '상생',
  '상극': '상극',
  '동일': '동일',
};

const RELATION_COLOR: Record<OhaengRelation, string> = {
  '상생': palette.woodBorder,
  '상극': palette.fireBorder,
  '동일': palette.borderMd,
};

function OhaengNode({ element }: { element: Ohaeng | null }) {
  const colors = element ? ohaengColors[element] : null;
  return (
    <View style={[
      styles.node,
      colors ? { backgroundColor: colors.light, borderColor: colors.border } : styles.nodeEmpty,
    ]}>
      <Text style={[textStyles.cardTitle, { color: colors?.base ?? palette.inkFaint }]}>
        {element ?? '?'}
      </Text>
    </View>
  );
}

function Arrow({ relation }: { relation: OhaengRelation | null }) {
  const color = relation ? RELATION_COLOR[relation] : palette.border;
  const label = relation ? RELATION_LABEL[relation] : '';
  return (
    <View style={styles.arrowWrapper}>
      <Text style={[styles.arrowLabel, { color }]}>{label}</Text>
      <View style={[styles.arrowLine, { backgroundColor: color }]} />
      <Text style={[styles.arrowHead, { color }]}>{'▶'}</Text>
    </View>
  );
}

export default function OhaengFlowDiagram({ elements, relations }: Props) {
  return (
    <View style={styles.container}>
      {elements.map((el, i) => (
        <React.Fragment key={i}>
          <OhaengNode element={el} />
          {i < elements.length - 1 && (
            <Arrow relation={relations[i] ?? null} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3'],
  },
  node: {
    width: 52,
    height: 52,
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
  arrowWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing['1'],
    minWidth: 48,
  },
  arrowLabel: {
    ...textStyles.sectionLabel,
    fontSize: 8,
    marginBottom: 2,
  },
  arrowLine: {
    height: 1.5,
    width: 32,
  },
  arrowHead: {
    fontSize: 8,
    marginTop: -2,
  },
});
