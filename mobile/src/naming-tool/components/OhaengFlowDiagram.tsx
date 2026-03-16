import React from 'react';
import { Text, View } from 'react-native';
import { colors, fontFamily, ohaengColors } from '@/design-system';
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
  '상생': ohaengColors['목'].border,
  '상극': ohaengColors['화'].border,
  '동일': colors.borderStrong,
};

function OhaengNode({ element }: { element: Ohaeng | null }) {
  const oc = element ? ohaengColors[element] : null;
  return (
    <View
      className="w-[52px] h-[52px] rounded-full border-[1.5px] items-center justify-center"
      style={
        oc
          ? { backgroundColor: oc.light, borderColor: oc.border }
          : {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderStyle: 'dashed',
            }
      }
    >
      <Text
        className="text-uiSm"
        style={{ fontFamily: fontFamily.sansMedium, color: oc?.base ?? colors.textDisabled }}
      >
        {element ?? '?'}
      </Text>
    </View>
  );
}

function Arrow({ relation }: { relation: OhaengRelation | null }) {
  const color = relation ? RELATION_COLOR[relation] : colors.border;
  const label = relation ? RELATION_LABEL[relation] : '';
  return (
    <View className="items-center justify-center mx-1 min-w-[48px]">
      <Text
        className="text-overline"
        style={{ fontFamily: fontFamily.sansMedium, color, fontSize: 8, marginBottom: 2 }}
      >
        {label}
      </Text>
      <View className="h-[1.5px] w-8 bg-current" style={{ width: 32, height: 1.5, backgroundColor: color }} />
      <Text style={{ fontSize: 8, marginTop: -2, color }}>{'▶'}</Text>
    </View>
  );
}

export default function OhaengFlowDiagram({ elements, relations }: Props) {
  return (
    <View className="flex-row items-center justify-center py-3">
      {elements.map((el, i) => (
        <React.Fragment key={i}>
          <OhaengNode element={el} />
          {i < elements.length - 1 && <Arrow relation={relations[i] ?? null} />}
        </React.Fragment>
      ))}
    </View>
  );
}
