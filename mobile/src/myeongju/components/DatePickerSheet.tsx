import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, Modal, ScrollView, Pressable,
  Animated, Platform,
} from 'react-native';
import { primitives } from '@/design-system';

interface Props {
  visible: boolean;
  year: number;
  month: number;
  day: number;
  onConfirm: (year: number, month: number, day: number) => void;
  onClose: () => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const YEARS = Array.from({ length: 21 }, (_, i) => 2015 + i); // 2015–2035
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

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
      scrollRef.current?.scrollTo({ y: initialIndex * ITEM_HEIGHT, animated: false });
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
        onScroll={(e) => { offsetRef.current = e.nativeEvent.contentOffset.y; }}
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
              <Text
                className="font-serif text-textPrimary"
                style={{ fontSize: 20, letterSpacing: -0.5 }}
              >
                {label}
              </Text>
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
        <Text className="font-sansRegular text-textTertiary" style={{ fontSize: 11 }}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

export default function DatePickerSheet({ visible, year, month, day, onConfirm, onClose }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  // 각 열의 현재 스크롤 오프셋을 추적
  const yearOffsetRef = useRef(YEARS.indexOf(year) * ITEM_HEIGHT);
  const monthOffsetRef = useRef((month - 1) * ITEM_HEIGHT);
  const dayOffsetRef = useRef((day - 1) * ITEM_HEIGHT);

  // 초기 인덱스 (열 마운트 시 초기 스크롤 위치용)
  const [initialIndexes, setInitialIndexes] = useState({
    year: YEARS.indexOf(year),
    month: month - 1,
    day: day - 1,
  });

  // visible → isOpen 전환 (닫기 애니메이션 포함)
  useEffect(() => {
    if (visible && !isOpen) {
      // 오픈 시 오프셋 ref와 초기 인덱스를 현재 props 값으로 리셋
      const yi = Math.max(0, YEARS.indexOf(year));
      const mi = month - 1;
      const di = day - 1;
      yearOffsetRef.current = yi * ITEM_HEIGHT;
      monthOffsetRef.current = mi * ITEM_HEIGHT;
      dayOffsetRef.current = di * ITEM_HEIGHT;
      setInitialIndexes({ year: yi, month: mi, day: di });
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

  // Modal이 열린 후 슬라이드 인
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
    const yIdx = Math.max(0, Math.min(Math.round(yearOffsetRef.current / ITEM_HEIGHT), YEARS.length - 1));
    const mIdx = Math.max(0, Math.min(Math.round(monthOffsetRef.current / ITEM_HEIGHT), MONTHS.length - 1));
    const dIdx = Math.max(0, Math.min(Math.round(dayOffsetRef.current / ITEM_HEIGHT), DAYS.length - 1));
    onConfirm(YEARS[yIdx], MONTHS[mIdx], DAYS[dIdx]);
    onClose();
  }

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-surfaceRaised rounded-t-[28px]">
              {/* 핸들 */}
              <View className="w-10 h-1 rounded-full bg-borderStrong self-center mt-[14px] mb-1" />

              {/* 제목 */}
              <Text
                className="font-serif-medium text-textPrimary text-center py-[14px]"
                style={{ fontSize: 16, letterSpacing: 0.5 }}
              >
                생년월일 선택
              </Text>

              <View className="h-px bg-border" />

              {/* 3열 드럼 피커 */}
              <View className="flex-row px-4 pt-2">
                <PickerColumn
                  items={YEARS}
                  initialIndex={initialIndexes.year}
                  offsetRef={yearOffsetRef}
                  unit="년"
                />
                <PickerColumn
                  items={MONTHS}
                  initialIndex={initialIndexes.month}
                  offsetRef={monthOffsetRef}
                  formatLabel={(v) => String(v).padStart(2, '0')}
                  unit="월"
                />
                <PickerColumn
                  items={DAYS}
                  initialIndex={initialIndexes.day}
                  offsetRef={dayOffsetRef}
                  formatLabel={(v) => String(v).padStart(2, '0')}
                  unit="일"
                />
              </View>

              {/* 확인 버튼 */}
              <View className="p-4" style={{ paddingBottom: Platform.OS === 'ios' ? 32 : 20 }}>
                <Pressable
                  className="bg-fillBold rounded-[14px] h-[52px] items-center justify-center"
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                  onPress={handleConfirm}
                >
                  <Text
                    className="font-serif-medium text-textInverse"
                    style={{ fontSize: 16, letterSpacing: 0.5 }}
                  >
                    확인
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
