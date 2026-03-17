import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors } from '@/design-system';

const RECENT_NAMES = [
  { hanja: '金敏俊', name: '김 민 준', date: '오늘 · 발음오행 · 수리책', score: 87, label: '매우 좋음' },
  { hanja: '朴서윤', name: '박 서 윤', date: '어제 · 자원오행 · 획수음양', score: 74, label: '좋음' },
  { hanja: '崔도윤', name: '최 도 윤', date: '3일 전 · 발음오행 · 수리책', score: 61, label: '보통' },
];

function scoreColor(score: number): string {
  if (score >= 80) return colors.positive;
  if (score >= 70) return colors.warning;
  return colors.textTertiary;
}

export default function RecentNamesSection() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 }}>
        <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 11, letterSpacing: 2, color: colors.textTertiary, textTransform: 'uppercase' }}>
          최근 분석 이름
        </Text>
        <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 11, color: colors.textTertiary, letterSpacing: 0.5 }}>
          전체 보기 →
        </Text>
      </View>

      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', gap: 1, backgroundColor: colors.border }}>
        {RECENT_NAMES.map((item) => (
          <Pressable
            key={item.name}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.surface : colors.surfaceRaised,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
            })}
          >
            <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 15, color: colors.textSecondary, width: 42, flexShrink: 0, letterSpacing: 2 }}>
              {item.hanja}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 16, color: colors.textPrimary, letterSpacing: 1.5 }}>
                {item.name}
              </Text>
              <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 11, color: colors.textDisabled, marginTop: 2 }}>
                {item.date}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 20, color: scoreColor(item.score), lineHeight: 20 }}>
                {item.score}
              </Text>
              <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 10, color: colors.textDisabled }}>
                {item.label}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
