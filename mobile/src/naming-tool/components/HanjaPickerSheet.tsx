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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ohaengColors, palette, radius, spacing, textStyles } from '@/design-system';
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

  // 열린 상태에서 한글 글자가 바뀌면 재검색
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
        style={styles.overlay}
      >
        {/* 반투명 배경 — 탭하면 닫힘 */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* 시트 */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* 드래그 핸들 */}
          <View style={styles.handle} />

          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={[textStyles.sectionTitle, { color: palette.ink }]}>한자 선택</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={[textStyles.body, { color: palette.inkMid }]}>닫기</Text>
            </Pressable>
          </View>

          {/* 검색 입력 */}
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={search}
            placeholder={role === 'surname' ? '성씨 검색 (예: 김)' : '음 검색 (예: 민)'}
            placeholderTextColor={palette.inkFaint}
            autoFocus={visible}
            returnKeyType="search"
          />

          {/* 결과 영역 */}
          {loading && (
            <ActivityIndicator
              size="small"
              color={palette.inkLight}
              style={{ marginTop: spacing['4'] }}
            />
          )}

          {!loading && results.length === 0 && query.length > 0 && (
            <Text style={[textStyles.body, { color: palette.inkFaint, textAlign: 'center', marginTop: spacing['5'] }]}>
              검색 결과가 없습니다
            </Text>
          )}

          {results.length > 0 && (
            <ScrollView
              style={styles.resultList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {results.map((r, i) => {
                const oc = r.charOhaeng ? ohaengColors[r.charOhaeng] : null;
                return (
                  <Pressable key={i} style={styles.resultRow} onPress={() => handleSelect(r)}>
                    {/* 한자 박스 — 자원오행 색상 */}
                    <View style={[
                      styles.hanjaBox,
                      oc
                        ? { backgroundColor: oc.light, borderColor: oc.border }
                        : { backgroundColor: palette.surface, borderColor: palette.border },
                    ]}>
                      <Text style={[textStyles.hanjaDisplay, { fontSize: 24, color: oc?.base ?? palette.inkMid }]}>
                        {r.hanja}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[textStyles.cardTitle, { color: palette.ink }]}>
                        {r.eum} · {r.mean}
                      </Text>
                      <Text style={[textStyles.body, { color: palette.inkLight }]}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(58, 47, 30, 0.4)',
  },
  sheet: {
    backgroundColor: palette.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    height: SHEET_HEIGHT,
    paddingHorizontal: spacing['4'],
    paddingTop: spacing['3'],
    paddingBottom: Platform.OS === 'ios' ? spacing['8'] : spacing['4'],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.borderMd,
    alignSelf: 'center',
    marginBottom: spacing['3'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['3'],
  },
  closeBtn: {
    paddingVertical: spacing['1'],
    paddingHorizontal: spacing['2'],
  },
  searchInput: {
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['2'],
    ...textStyles.body,
    color: palette.ink,
    backgroundColor: palette.card,
    marginBottom: spacing['2'],
  },
  resultList: {
    flex: 1,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    gap: spacing['3'],
  },
  hanjaBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
