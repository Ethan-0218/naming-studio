import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Modal, Pressable, FlatList,
  TextInput, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { primitives } from '@/design-system';
import { Region, REGIONS } from '../data';

interface Props {
  visible: boolean;
  selectedRegion: Region | null;
  onSelect: (region: Region) => void;
  onClose: () => void;
}

export default function RegionBottomSheet({ visible, selectedRegion, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  // isOpen은 Modal visible을 제어 — 닫기 애니메이션이 완료된 후에 false가 됨
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const searchRef = useRef<TextInput>(null);

  // visible 변경 감지: 열기 / 닫기 애니메이션 제어
  useEffect(() => {
    if (visible && !isOpen) {
      setQuery('');
      slideAnim.setValue(600);
      setIsOpen(true);
    } else if (!visible && isOpen) {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 260,
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
      }).start(() => {
        setTimeout(() => searchRef.current?.focus(), 80);
      });
    }
  }, [isOpen]);

  const filtered = query.trim()
    ? REGIONS.filter((r) =>
        r.name.includes(query.trim()) || r.full.includes(query.trim())
      )
    : REGIONS;

  function handleSelect(region: Region) {
    onSelect(region);
    onClose();
  }

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 오버레이 */}
        <Pressable className="flex-1" onPress={onClose} />

        {/* 시트 */}
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <View className="bg-surfaceRaised rounded-t-[28px] max-h-[560px]">
            {/* 핸들 */}
            <View className="w-10 h-1 rounded-full bg-borderStrong self-center mt-[14px]" />

            {/* 헤더 */}
            <View className="px-5 pb-3">
              <Text
                className="font-serif-medium text-textPrimary text-center py-[14px]"
                style={{ fontSize: 16, letterSpacing: 0.5 }}
              >
                출생 지역 선택
              </Text>

              {/* 검색창 */}
              <View className="relative">
                <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
                  <Ionicons name="search" size={15} color={primitives.ink300} />
                </View>
                <TextInput
                  ref={searchRef}
                  className="bg-surface border-[1.5px] border-border rounded-lg py-2.5 pl-9 pr-3 font-sansRegular text-textPrimary"
                  style={{ fontSize: 14 }}
                  placeholder="지역명 검색   예) 서울, 부산, 제주"
                  placeholderTextColor={primitives.ink300}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                />
              </View>
            </View>

            {/* 구분선 */}
            <View className="h-px bg-border" />

            {/* 목록 */}
            {filtered.length === 0 ? (
              <View className="p-10 items-center">
                <Text className="font-sansRegular text-textDisabled" style={{ fontSize: 14 }}>
                  검색 결과가 없습니다
                </Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.name}
                className="max-h-[340px]"
                contentContainerStyle={{ paddingVertical: 6, paddingHorizontal: 12 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isSelected = item.name === selectedRegion?.name;
                  return (
                    <Pressable
                      className={`flex-row items-center justify-between py-[11px] px-2.5 rounded-lg mb-0.5 ${isSelected ? 'bg-fillAccentSub' : ''}`}
                      style={({ pressed }) => ({
                        backgroundColor: isSelected
                          ? undefined
                          : pressed ? '#f5f5f4' : 'transparent',
                      })}
                      onPress={() => handleSelect(item)}
                    >
                      {/* 왼쪽: 지역명 + 전체명 */}
                      <View className="flex-row items-end gap-2 flex-1">
                        <Text
                          className={isSelected ? 'font-serif-medium text-fillAccent' : 'font-serif text-textPrimary'}
                          style={{ fontSize: 16 }}
                        >
                          {item.name}
                        </Text>
                        <Text
                          className={`font-sansRegular shrink ${isSelected ? 'text-warningBorder' : 'text-textTertiary'}`}
                          style={{ fontSize: 11.5 }}
                        >
                          {item.full}
                        </Text>
                      </View>

                      {/* 오른쪽: 보정 분 + 체크 */}
                      <View className="flex-row items-center gap-2">
                        {item.offset !== null && (
                          <Text
                            className={`font-sansRegular ${isSelected ? 'text-warningBorder' : 'text-textDisabled'}`}
                            style={{ fontSize: 11, letterSpacing: 0.4 }}
                          >
                            약 {item.offset}분
                          </Text>
                        )}
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={primitives.gold600} />
                        )}
                      </View>
                    </Pressable>
                  );
                }}
              />
            )}

            <View style={{ height: Platform.OS === 'ios' ? 24 : 12 }} />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
