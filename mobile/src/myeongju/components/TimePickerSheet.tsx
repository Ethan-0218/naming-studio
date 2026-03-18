import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Modal,
  ScrollView,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { Font } from '@/components/Font';

interface Props {
  visible: boolean;
  isAm: boolean;
  hour: number; // 1–12
  minute: number; // 0–59
  onConfirm: (isAm: boolean, hour: number, minute: number) => void;
  onClose: () => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0–59

function PickerColumn({
  items,
  initialIndex,
  offsetRef,
  formatLabel,
  unit,
}: {
  items: number[];
  initialIndex: number;
  offsetRef: React.MutableRefObject<number>;
  formatLabel?: (v: number) => string;
  unit: string;
}) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: initialIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
  }, []);

  return (
    <View className="flex-1 relative">
      {/* 선택 하이라이트 라인 */}
      <View
        pointerEvents="none"
        className="absolute left-1 right-1 border-t border-b border-borderStrong z-10"
        style={{ top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT }}
      />

      <ScrollView
        ref={scrollRef}
        style={{ height: PICKER_HEIGHT }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={(e) => {
          offsetRef.current = e.nativeEvent.contentOffset.y;
        }}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
      >
        {items.map((v) => {
          const label = formatLabel ? formatLabel(v) : String(v);
          return (
            <View
              key={v}
              className="items-center justify-center"
              style={{ height: ITEM_HEIGHT }}
            >
              <Font
                tag="primary"
                className="text-textPrimary"
                style={{ fontSize: 20, letterSpacing: -0.5 }}
              >
                {label}
              </Font>
            </View>
          );
        })}
      </ScrollView>

      {/* 단위 라벨 */}
      <View
        pointerEvents="none"
        className="absolute right-1.5 justify-end z-20"
        style={{
          bottom: ITEM_HEIGHT * 2 - 2,
          height: ITEM_HEIGHT,
          paddingBottom: 9,
        }}
      >
        <Font
          tag="secondary"
          className="text-textTertiary"
          style={{ fontSize: 12 }}
        >
          {unit}
        </Font>
      </View>
    </View>
  );
}

export default function TimePickerSheet({
  visible,
  isAm,
  hour,
  minute,
  onConfirm,
  onClose,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmPm, setSelectedAmPm] = useState<'오전' | '오후'>(
    isAm ? '오전' : '오후',
  );
  const slideAnim = useRef(new Animated.Value(400)).current;

  // 오전/오후 슬라이딩 애니메이션
  const [amPmPillWidth, setAmPmPillWidth] = useState(0);
  const amPmAnim = useRef(new Animated.Value(isAm ? 0 : 1)).current;

  function selectAmPm(label: '오전' | '오후') {
    setSelectedAmPm(label);
    Animated.spring(amPmAnim, {
      toValue: label === '오전' ? 0 : 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 300,
    }).start();
  }

  const hourOffsetRef = useRef((hour - 1) * ITEM_HEIGHT);
  const minuteOffsetRef = useRef(minute * ITEM_HEIGHT);

  const [initialIndexes, setInitialIndexes] = useState({
    hour: hour - 1,
    minute,
  });

  useEffect(() => {
    if (visible && !isOpen) {
      const hi = hour - 1;
      const mi = minute;
      hourOffsetRef.current = hi * ITEM_HEIGHT;
      minuteOffsetRef.current = mi * ITEM_HEIGHT;
      setInitialIndexes({ hour: hi, minute: mi });
      const amPm = isAm ? '오전' : '오후';
      setSelectedAmPm(amPm);
      amPmAnim.setValue(isAm ? 0 : 1);
      slideAnim.setValue(400);
      setIsOpen(true);
    } else if (!visible && isOpen) {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 240,
        useNativeDriver: true,
      }).start(() => setIsOpen(false));
    }
  }, [visible]);

  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    }
  }, [isOpen]);

  function handleConfirm() {
    const hIdx = Math.max(
      0,
      Math.min(
        Math.round(hourOffsetRef.current / ITEM_HEIGHT),
        HOURS.length - 1,
      ),
    );
    const mIdx = Math.max(
      0,
      Math.min(
        Math.round(minuteOffsetRef.current / ITEM_HEIGHT),
        MINUTES.length - 1,
      ),
    );
    onConfirm(selectedAmPm === '오전', HOURS[hIdx], MINUTES[mIdx]);
    onClose();
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 딤 오버레이 */}
      <Pressable
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
        onPress={onClose}
      />

      {/* 시트 컨테이너 */}
      <View
        style={{ flex: 1, justifyContent: 'flex-end' }}
        pointerEvents="box-none"
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <View className="bg-surfaceRaised rounded-t-[28px]">
            {/* 핸들 */}
            <View className="w-10 h-1 rounded-full bg-borderStrong self-center mt-[14px] mb-1" />

            {/* 제목 */}
            <Font
              tag="primaryMedium"
              className="text-textPrimary text-center py-[14px]"
              style={{ fontSize: 16, letterSpacing: 0.5 }}
            >
              생시 선택
            </Font>

            <View className="h-px bg-border" />

            {/* 오전 / 오후 세그먼트 */}
            <View
              className="flex-row mx-4 mt-4 mb-2 bg-surface border border-border rounded-full p-[3px]"
              onLayout={(e) =>
                setAmPmPillWidth(e.nativeEvent.layout.width / 2 - 3)
              }
            >
              {/* 슬라이딩 선택 인디케이터 */}
              {amPmPillWidth > 0 && (
                <Animated.View
                  className="absolute inset-y-[3px] bg-fillBold rounded-full"
                  style={{
                    width: amPmPillWidth,
                    left: 3,
                    transform: [
                      {
                        translateX: amPmAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, amPmPillWidth],
                        }),
                      },
                    ],
                  }}
                  pointerEvents="none"
                />
              )}

              {(['오전', '오후'] as const).map((label) => {
                const active = selectedAmPm === label;
                return (
                  <Pressable
                    key={label}
                    className="flex-1 py-[7px] rounded-full items-center"
                    onPress={() => selectAmPm(label)}
                  >
                    <Font
                      tag={active ? 'secondaryMedium' : 'secondary'}
                      className={
                        active ? 'text-textInverse' : 'text-textTertiary'
                      }
                      style={{ fontSize: 13, letterSpacing: 0.4 }}
                    >
                      {label}
                    </Font>
                  </Pressable>
                );
              })}
            </View>

            {/* 2열 드럼 피커 */}
            <View className="flex-row px-4 pt-2">
              <PickerColumn
                items={HOURS}
                initialIndex={initialIndexes.hour}
                offsetRef={hourOffsetRef}
                formatLabel={(v) => String(v).padStart(2, '0')}
                unit="시"
              />
              <PickerColumn
                items={MINUTES}
                initialIndex={initialIndexes.minute}
                offsetRef={minuteOffsetRef}
                formatLabel={(v) => String(v).padStart(2, '0')}
                unit="분"
              />
            </View>

            {/* 확인 버튼 */}
            <View
              className="p-4"
              style={{ paddingBottom: Platform.OS === 'ios' ? 32 : 20 }}
            >
              <Pressable
                className="bg-fillBold rounded-[14px] h-[52px] items-center justify-center"
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                onPress={handleConfirm}
              >
                <Font
                  tag="primaryMedium"
                  className="text-textInverse"
                  style={{ fontSize: 16, letterSpacing: 0.5 }}
                >
                  확인
                </Font>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
