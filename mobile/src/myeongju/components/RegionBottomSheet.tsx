import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Modal, Pressable, FlatList,
  TextInput, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, radius } from '@/design-system';
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
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 오버레이 */}
        <Pressable
          style={{ flex: 1, backgroundColor: 'transparent' }}
          onPress={onClose}
        />

        {/* 시트 */}
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <View style={{
            backgroundColor: colors.surfaceRaised,
            borderTopLeftRadius: radius['2xl'],
            borderTopRightRadius: radius['2xl'],
            maxHeight: 560,
          }}>
            {/* 핸들 */}
            <View style={{
              width: 40, height: 4, borderRadius: radius.full,
              backgroundColor: colors.borderStrong,
              alignSelf: 'center',
              marginTop: 14,
            }} />

            {/* 헤더 */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
              <Text style={{
                fontFamily: fontFamily.serifMedium,
                fontSize: 16,
                letterSpacing: 0.5,
                color: colors.textPrimary,
                textAlign: 'center',
                paddingVertical: 14,
              }}>
                출생 지역 선택
              </Text>

              {/* 검색창 */}
              <View style={{ position: 'relative' }}>
                <View style={{
                  position: 'absolute',
                  left: 12, top: 0, bottom: 0,
                  justifyContent: 'center',
                  zIndex: 1,
                }}>
                  <Ionicons name="search" size={15} color={colors.textDisabled} />
                </View>
                <TextInput
                  ref={searchRef}
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    paddingVertical: 10,
                    paddingLeft: 36,
                    paddingRight: 12,
                    fontFamily: fontFamily.sansRegular,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                  placeholder="지역명 검색   예) 서울, 부산, 제주"
                  placeholderTextColor={colors.textDisabled}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                />
              </View>
            </View>

            {/* 구분선 */}
            <View style={{ height: 1, backgroundColor: colors.border }} />

            {/* 목록 */}
            {filtered.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{
                  fontFamily: fontFamily.sansRegular,
                  fontSize: 14,
                  color: colors.textDisabled,
                }}>
                  검색 결과가 없습니다
                </Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.name}
                style={{ paddingVertical: 6, paddingHorizontal: 12, maxHeight: 340 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isSelected = item.name === selectedRegion?.name;
                  return (
                    <Pressable
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 11,
                        paddingHorizontal: 10,
                        borderRadius: radius.lg,
                        backgroundColor: isSelected
                          ? colors.fillAccentSub
                          : pressed ? colors.surface : 'transparent',
                        marginBottom: 2,
                      })}
                      onPress={() => handleSelect(item)}
                    >
                      {/* 왼쪽: 지역명 + 전체명 */}
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flex: 1 }}>
                        <Text style={{
                          fontFamily: isSelected ? fontFamily.serifMedium : fontFamily.serifRegular,
                          fontSize: 16,
                          color: isSelected ? colors.fillAccent : colors.textPrimary,
                        }}>
                          {item.name}
                        </Text>
                        <Text style={{
                          fontFamily: fontFamily.sansRegular,
                          fontSize: 11.5,
                          color: isSelected ? colors.warningBorder : colors.textTertiary,
                          flexShrink: 1,
                        }}>
                          {item.full}
                        </Text>
                      </View>

                      {/* 오른쪽: 보정 분 + 체크 */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {item.offset !== null && (
                          <Text style={{
                            fontFamily: fontFamily.sansRegular,
                            fontSize: 11,
                            letterSpacing: 0.4,
                            color: isSelected ? colors.warningBorder : colors.textDisabled,
                          }}>
                            약 {item.offset}분
                          </Text>
                        )}
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={colors.fillAccent} />
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
