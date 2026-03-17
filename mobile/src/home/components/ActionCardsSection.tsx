import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/design-system';

interface Props {
  onAINaming: () => void;
  onSelfNaming: () => void;
}

export default function ActionCardsSection({ onAINaming, onSelfNaming }: Props) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
      <Text style={{
        fontFamily: 'NotoSansKR_400Regular',
        fontSize: 11,
        letterSpacing: 2,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        marginBottom: 12,
        paddingHorizontal: 4,
      }}>
        시작하기
      </Text>

      <View style={{ gap: 10 }}>
        {/* AI Card */}
        <Pressable
          style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
          onPress={onAINaming}
        >
          <View style={{ backgroundColor: colors.fillBold, borderRadius: 18, overflow: 'hidden', padding: 22 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colors.fillAccent,
              borderRadius: 99,
              paddingVertical: 3,
              paddingHorizontal: 9,
              alignSelf: 'flex-start',
              marginBottom: 14,
            }}>
              <Ionicons name="sparkles" size={10} color="#fff" />
              <Text style={{ fontFamily: 'NotoSansKR_500Medium', fontSize: 10, color: '#fff', letterSpacing: 0.8 }}>
                AI 추천
              </Text>
            </View>
            <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 20, letterSpacing: 1, color: colors.textInverse, lineHeight: 27, marginBottom: 8 }}>
              {'AI와 함께\n작명하기'}
            </Text>
            <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 12, color: 'rgba(251,247,238,0.6)', lineHeight: 20, marginBottom: 18 }}>
              {'성씨와 조건을 입력하면 AI가 오행·수리를\n종합해 최적의 이름을 추천해 드립니다.'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.fillAccent,
                borderRadius: 99,
                paddingVertical: 9,
                paddingHorizontal: 18,
              }}>
                <Text style={{ fontFamily: 'NotoSansKR_500Medium', fontSize: 13, color: '#fff', letterSpacing: 0.2 }}>
                  시작하기
                </Text>
                <Ionicons name="arrow-forward" size={13} color="#fff" />
              </View>
              <Text style={{ fontFamily: 'NotoSerifKR_300Light', fontSize: 48, color: 'rgba(255,255,255,0.07)', lineHeight: 48, letterSpacing: -2 }}>
                作名
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Self Card */}
        <Pressable
          style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
          onPress={onSelfNaming}
        >
          <View style={{
            backgroundColor: colors.surfaceRaised,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            padding: 20,
          }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 20, color: colors.textSecondary }}>分</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'NotoSerifKR_500Medium', fontSize: 16, letterSpacing: 0.5, color: colors.textPrimary, marginBottom: 3 }}>
                스스로 작명하기
              </Text>
              <Text style={{ fontFamily: 'NotoSansKR_400Regular', fontSize: 12, color: colors.textTertiary, lineHeight: 19 }}>
                이름을 직접 입력하고 상세 분석을 받아보세요.
              </Text>
            </View>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
