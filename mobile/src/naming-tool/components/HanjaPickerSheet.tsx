/**
 * 한자 선택 바텀시트
 * - Modal + 슬라이드 애니메이션
 * - 검색 입력 + 결과 목록 (자원오행 색상 표시)
 */
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ohaengColors, colors, fontFamily } from '@/design-system';
import { CharSlotData } from '../types';
import { useHanjaSearch } from '../hooks/useHanjaSearch';

interface Props {
  visible: boolean;
  onClose: () => void;
  hangul: string;
  role: 'surname' | 'name';
  onSelect: (data: Partial<CharSlotData>) => void;
}

const SHEET_HEIGHT = 480;

export default function HanjaPickerSheet({ visible, onClose, hangul, role, onSelect }: Props) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const { query, results, loading, search, clearResults } = useHanjaSearch(role);

  useEffect(() => {
    if (visible) {
      if (hangul) search(hangul);
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
      }).start(() => clearResults());
    }
  }, [visible]);

  useEffect(() => {
    if (visible && hangul) search(hangul);
  }, [hangul]);

  function handleSelect(r: ReturnType<typeof useHanjaSearch>['results'][0]) {
    onSelect({
      hanja: r.hanja,
      mean: r.mean,
      strokeCount: r.strokeCount,
      charOhaeng: r.charOhaeng,
      baleumOhaeng: r.baleumOhaeng,
      soundEumyang: r.soundEumyang,
      strokeEumyang: r.strokeEumyang,
    });
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        <Pressable
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(58, 47, 30, 0.4)' }}
          onPress={onClose}
        />

        <Animated.View
          className="bg-bg rounded-t-xl px-4 pt-3 pb-8"
          style={[
            {
              height: SHEET_HEIGHT,
              paddingBottom: Platform.OS === 'ios' ? 32 : 16,
            },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View className="w-9 h-1 rounded-full bg-borderStrong self-center mb-3" style={{ width: 36, height: 4, borderRadius: 2 }} />

          <View className="flex-row items-center justify-between mb-3">
            <Text
              className="text-heading text-textPrimary"
              style={{ fontFamily: fontFamily.serifMedium }}
            >
              한자 선택
            </Text>
            <Pressable onPress={onClose} className="py-1 px-2">
              <Text
                className="text-bodySm text-textSecondary"
                style={{ fontFamily: fontFamily.sansRegular }}
              >
                닫기
              </Text>
            </Pressable>
          </View>

          <TextInput
            className="border-[1.5px] border-border rounded-md px-3 py-2 mb-2 bg-surfaceRaised text-textPrimary"
            style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 11, lineHeight: 19 }}
            value={query}
            onChangeText={search}
            placeholder={role === 'surname' ? '성씨 검색 (예: 김)' : '음 검색 (예: 민)'}
            placeholderTextColor={colors.textDisabled}
            autoFocus={visible}
            returnKeyType="search"
          />

          {loading && (
            <ActivityIndicator size="small" color={colors.textTertiary} className="mt-4" />
          )}

          {!loading && results.length === 0 && query.length > 0 && (
            <Text
              className="text-bodySm text-textDisabled text-center mt-5"
              style={{ fontFamily: fontFamily.sansRegular }}
            >
              검색 결과가 없습니다
            </Text>
          )}

          {results.length > 0 && (
            <ScrollView
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {results.map((r, i) => {
                const oc = r.charOhaeng ? ohaengColors[r.charOhaeng] : null;
                return (
                  <Pressable
                    key={i}
                    className="flex-row items-center py-3 border-b border-border gap-3"
                    onPress={() => handleSelect(r)}
                  >
                    <View
                      className="w-12 h-12 rounded-md border items-center justify-center"
                      style={[
                        {
                          width: 48,
                          height: 48,
                          backgroundColor: oc ? oc.light : colors.surface,
                          borderColor: oc ? oc.border : colors.border,
                        },
                      ]}
                    >
                      <Text
                        className="text-hanjaLg"
                        style={{
                          fontFamily: fontFamily.serifMedium,
                          color: oc?.base ?? colors.textSecondary,
                        }}
                      >
                        {r.hanja}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text
                        className="text-uiSm text-textPrimary"
                        style={{ fontFamily: fontFamily.sansMedium }}
                      >
                        {r.eum} · {r.mean}
                      </Text>
                      <Text
                        className="text-bodySm text-textTertiary"
                        style={{ fontFamily: fontFamily.sansRegular }}
                      >
                        {r.strokeCount != null ? `${r.strokeCount}획` : '획수 미상'}
                        {r.charOhaeng ? ` · 자원오행 ${r.charOhaeng}` : ''}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
