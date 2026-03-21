import { Font } from '@/components/Font';
import { colors, fontFamily } from '@/design-system';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SuriEntry, SuriLevel } from '@/naming-tool/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  label: string;
  entry: SuriEntry | null;
}

const SHEET_HEIGHT = 400;

const LEVEL_COLOR: Record<SuriLevel, string> = {
  大吉: colors.positive,
  吉: colors.positive,
  中吉: colors.fillAccent,
  中凶: colors.warning,
  凶: colors.negative,
  大凶: colors.negative,
};

const GYEOK_DESC: Record<string, string> = {
  '원격 (元格)':
    '이름 글자들의 획수 합. 이름 자체에 담긴 고유한 기운으로, 청소년기와 초년의 운세를 나타냅니다.',
  '형격 (亨格)':
    '성 + 이름 첫째 자의 획수 합. 성과 이름이 어우러지는 조화의 기운으로, 사회 진출기와 중년운을 나타냅니다.',
  '이격 (利格)':
    '성 + 이름 끝 자의 획수 합. 사회적 활동과 대인관계에 작용하는 기운으로, 장년의 운세를 나타냅니다.',
  '정격 (貞格)':
    '성 + 이름 모든 글자의 획수 합. 이름 전체의 총운으로, 평생의 흐름과 말년운을 나타냅니다.',
};

export default function SuriDetailSheet({
  visible,
  onClose,
  label,
  entry,
}: Props) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [modalVisible, setModalVisible] = useState(false);

  const lastEntryRef = useRef<SuriEntry | null>(null);
  const lastLabelRef = useRef('');
  if (entry) {
    lastEntryRef.current = entry;
    lastLabelRef.current = label;
  }
  const displayEntry = lastEntryRef.current;
  const displayLabel = lastLabelRef.current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setModalVisible(false));
    }
  }, [visible]);

  if (!displayEntry) return null;

  const color = LEVEL_COLOR[displayEntry.level];
  const gyeokDesc = GYEOK_DESC[displayLabel] ?? '';

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(58, 47, 30, 0.4)' }}
        onPress={onClose}
      />
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: SHEET_HEIGHT,
          backgroundColor: colors.bg,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 36 : 20,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.borderStrong,
            alignSelf: 'center',
            marginBottom: 16,
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            marginBottom: 16,
          }}
        >
          <Font
            tag="primaryMedium"
            className="text-heading text-textPrimary"
            style={{ fontFamily: fontFamily.serifMedium }}
          >
            {displayLabel}
          </Font>
          <Pressable
            onPress={onClose}
            style={{ paddingVertical: 4, paddingHorizontal: 8 }}
          >
            <Font tag="secondary" className="text-bodySm text-textSecondary">
              닫기
            </Font>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {gyeokDesc !== '' && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Font
                tag="secondary"
                className="text-textTertiary"
                style={{ fontSize: 13, lineHeight: 20 }}
              >
                {gyeokDesc}
              </Font>
            </View>
          )}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <View className="flex-row items-center gap-2 flex-1">
              <Font
                tag="primaryMedium"
                className="text-numeralLg"
                style={{ color, lineHeight: 48 }}
              >
                {displayEntry.number}
              </Font>
              <View style={{ paddingBottom: 4, gap: 3, flex: 1 }}>
                <Font
                  tag="primaryMedium"
                  className="text-textPrimary"
                  style={{ fontSize: 16 }}
                >
                  {displayEntry.name1} ・ {displayEntry.name2}
                </Font>
                <Font
                  tag="secondary"
                  className="text-textTertiary"
                  style={{ fontSize: 13 }}
                >
                  {displayEntry.interpretation}
                </Font>
              </View>
            </View>
            <View
              className="px-[10px] py-[4px] rounded-full border-[1.5px] border-border"
              style={{ borderColor: color }}
            >
              <Font
                tag="secondaryMedium"
                className="text-label uppercase"
                style={{ color }}
              >
                {displayEntry.level}
              </Font>
            </View>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginBottom: 14,
            }}
          />

          {displayEntry.easyInterpretation && (
            <>
              <Font
                tag="secondaryMedium"
                className="text-textTertiary text-[12px] mb-[6px]"
              >
                해석
              </Font>
              <Font
                tag="secondaryMedium"
                className="text-textPrimary"
                style={{ fontSize: 14, lineHeight: 22, marginBottom: 16 }}
              >
                {displayEntry.easyInterpretation}
              </Font>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
