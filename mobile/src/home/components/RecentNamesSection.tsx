import React from 'react';
import { View, Pressable } from 'react-native';
import { primitives } from '@/design-system';
import { Font } from '@/components/Font';

const RECENT_NAMES = [
  {
    hanja: '金敏俊',
    name: '김 민 준',
    date: '오늘 · 발음오행 · 수리책',
    score: 87,
    label: '매우 좋음',
  },
  {
    hanja: '朴서윤',
    name: '박 서 윤',
    date: '어제 · 자원오행 · 획수음양',
    score: 74,
    label: '좋음',
  },
  {
    hanja: '崔도윤',
    name: '최 도 윤',
    date: '3일 전 · 발음오행 · 수리책',
    score: 61,
    label: '보통',
  },
];

function scoreColor(score: number): string {
  if (score >= 80) return primitives.teal600;
  if (score >= 70) return primitives.gold600;
  return primitives.ink500;
}

export default function RecentNamesSection() {
  return (
    <View className="px-4 pt-5">
      <View className="flex-row items-center justify-between mb-3 px-1">
        <Font
          tag="secondary"
          className="text-textTertiary"
          style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}
        >
          최근 분석 이름
        </Font>
        <Font
          tag="secondary"
          className="text-textTertiary"
          style={{ fontSize: 11, letterSpacing: 0.5 }}
        >
          전체 보기 →
        </Font>
      </View>

      <View className="rounded-[14px] border border-border overflow-hidden gap-px bg-border">
        {RECENT_NAMES.map((item) => (
          <Pressable
            key={item.name}
            className="flex-row items-center gap-3.5 px-4 py-[14px]"
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? primitives.hanji200
                : primitives.hanji50,
            })}
          >
            <Font
              tag="primaryMedium"
              className="text-textSecondary shrink-0"
              style={{ fontSize: 15, width: 42, letterSpacing: 2 }}
            >
              {item.hanja}
            </Font>
            <View className="flex-1">
              <Font
                tag="primaryMedium"
                className="text-textPrimary"
                style={{ fontSize: 16, letterSpacing: 1.5 }}
              >
                {item.name}
              </Font>
              <Font
                tag="secondary"
                className="text-textDisabled mt-0.5"
                style={{ fontSize: 11 }}
              >
                {item.date}
              </Font>
            </View>
            <View className="items-end gap-0.5">
              <Font
                tag="primaryMedium"
                style={{
                  fontSize: 20,
                  color: scoreColor(item.score),
                  lineHeight: 20,
                }}
              >
                {item.score}
              </Font>
              <Font
                tag="secondary"
                className="text-textDisabled"
                style={{ fontSize: 10 }}
              >
                {item.label}
              </Font>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
