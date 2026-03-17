import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, textStyles, radius, primitives } from '@/design-system';
import { getSijan } from '../data';

interface Props {
  timeUnknown: boolean;
  isAm: boolean;
  hour: number;   // 1–12
  minute: number; // 0–50 (10분 단위)
  onToggleUnknown: () => void;
  onAmPmChange: (isAm: boolean) => void;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
}

export default function BirthTimeSection({
  timeUnknown, isAm, hour, minute,
  onToggleUnknown, onAmPmChange, onHourChange, onMinuteChange,
}: Props) {
  // 24시간제 변환
  const hour24 = isAm
    ? (hour === 12 ? 0 : hour)
    : (hour === 12 ? 12 : hour + 12);

  const sijan = getSijan(hour24);

  return (
    <View style={{
      paddingHorizontal: 20,
      paddingVertical: 22,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      {/* 섹션 라벨 */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
        <Text style={[textStyles.overline, { color: colors.textTertiary }]}>생시</Text>
        <Text style={{
          fontFamily: fontFamily.sansRegular,
          fontSize: 9,
          letterSpacing: 0.8,
          color: colors.textDisabled,
        }}>
          태어난 시각
        </Text>
      </View>

      {/* 생시 모름 토글 */}
      <Pressable
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: timeUnknown ? colors.borderStrong : colors.border,
          borderRadius: radius.lg,
          paddingHorizontal: 14,
          paddingVertical: 11,
          marginBottom: 14,
          opacity: pressed ? 0.85 : 1,
        })}
        onPress={onToggleUnknown}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="information-circle-outline" size={15} color={colors.textTertiary} />
          <Text style={{
            fontFamily: fontFamily.sansRegular,
            fontSize: 13,
            color: colors.textSecondary,
          }}>
            생시를 모릅니다
          </Text>
        </View>

        {/* custom toggle switch */}
        <View style={{
          width: 42, height: 24,
          borderRadius: radius.full,
          backgroundColor: timeUnknown ? colors.textSecondary : colors.borderStrong,
          justifyContent: 'center',
          paddingHorizontal: 3,
        }}>
          <View style={{
            width: 18, height: 18,
            borderRadius: 9,
            backgroundColor: '#fff',
            alignSelf: timeUnknown ? 'flex-end' : 'flex-start',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 2,
          }} />
        </View>
      </Pressable>

      {/* 시간 입력 (생시 모름이 아닐 때) */}
      {!timeUnknown && (
        <>
          {/* 오전/오후 + 시:분 */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {/* 오전/오후 세로 토글 */}
            <View style={{
              width: 52,
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: radius.lg,
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              <Pressable
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isAm ? colors.fillBold : 'transparent',
                  minHeight: 34,
                }}
                onPress={() => onAmPmChange(true)}
              >
                <Text style={{
                  fontFamily: fontFamily.sansMedium,
                  fontSize: 12,
                  letterSpacing: 0.4,
                  color: isAm ? colors.textInverse : colors.textDisabled,
                }}>
                  오전
                </Text>
              </Pressable>

              <View style={{ height: 1, backgroundColor: colors.border }} />

              <Pressable
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: !isAm ? colors.fillBold : 'transparent',
                  minHeight: 34,
                }}
                onPress={() => onAmPmChange(false)}
              >
                <Text style={{
                  fontFamily: fontFamily.sansMedium,
                  fontSize: 12,
                  letterSpacing: 0.4,
                  color: !isAm ? colors.textInverse : colors.textDisabled,
                }}>
                  오후
                </Text>
              </Pressable>
            </View>

            {/* 시:분 표시 */}
            <View style={{
              flex: 1,
              backgroundColor: colors.surfaceRaised,
              borderWidth: 1.5,
              borderColor: colors.borderStrong,
              borderRadius: radius.lg,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingHorizontal: 16,
              height: 68,
            }}>
              <Pressable onPress={() => onHourChange(hour % 12 + 1)}>
                <Text style={{
                  fontFamily: fontFamily.serifLight,
                  fontSize: 34,
                  lineHeight: 34,
                  color: colors.textPrimary,
                  letterSpacing: -1,
                  minWidth: 48,
                  textAlign: 'center',
                }}>
                  {String(hour).padStart(2, '0')}
                </Text>
              </Pressable>

              <Text style={{
                fontFamily: fontFamily.serifLight,
                fontSize: 28,
                lineHeight: 28,
                color: colors.textTertiary,
                paddingBottom: 4,
              }}>
                :
              </Text>

              <Pressable onPress={() => onMinuteChange((minute + 10) % 60)}>
                <Text style={{
                  fontFamily: fontFamily.serifLight,
                  fontSize: 34,
                  lineHeight: 34,
                  color: colors.textPrimary,
                  letterSpacing: -1,
                  minWidth: 48,
                  textAlign: 'center',
                }}>
                  {String(minute).padStart(2, '0')}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 시진 결과 카드 */}
          <View style={{
            backgroundColor: colors.fillAccentSub,
            borderWidth: 1.5,
            borderColor: primitives.gold400,
            borderRadius: radius.lg,
            padding: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}>
            {/* 대표 한자 */}
            <Text style={{
              fontFamily: fontFamily.serifLight,
              fontSize: 36,
              lineHeight: 36,
              color: colors.fillAccent,
              flexShrink: 0,
            }}>
              {sijan.hanja}
            </Text>

            <View>
              {/* 시진 이름 + 한자 */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                <Text style={{
                  fontFamily: fontFamily.serifMedium,
                  fontSize: 18,
                  letterSpacing: 0.5,
                  color: colors.fillAccent,
                }}>
                  {sijan.name}
                </Text>
                <Text style={{
                  fontFamily: fontFamily.serifLight,
                  fontSize: 14,
                  letterSpacing: 1,
                  color: primitives.gold400,
                }}>
                  {sijan.hanjaFull}
                </Text>
              </View>
              {/* 시간 범위 */}
              <Text style={{
                fontFamily: fontFamily.sansRegular,
                fontSize: 12,
                letterSpacing: 0.4,
                color: colors.textTertiary,
              }}>
                {sijan.range}
              </Text>
              {/* 안내 */}
              <Text style={{
                fontFamily: fontFamily.sansRegular,
                fontSize: 11,
                color: primitives.gold400,
                marginTop: 2,
              }}>
                사주의 시주(時柱)로 사용됩니다
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
