import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Font } from '@/components/Font';
import { colors, primitives } from '@/design-system';
import { PRODUCT_IDS } from '../types';
import { useIAP } from '../hooks/useIAP';
import { useInvalidatePurchaseStatus } from '../hooks/usePurchaseStatus';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REASONS = [
  '용신 오행이 부족한 에너지를 보완해 사주의 균형을 맞춥니다.',
  '이름 글자의 자원·발음 오행이 용신과 상생하면 긍정적 기운이 강화됩니다.',
  '용신 보완이 잘 된 이름은 평생 좋은 운을 뒷받침하는 힘이 됩니다.',
];

const SHEET_TRANSLATE_INITIAL = 400;

export default function SelfNamingPaywallOverlay({
  visible,
  onClose,
  onSuccess,
}: Props) {
  const insets = useSafeAreaInsets();
  const invalidatePurchaseStatus = useInvalidatePurchaseStatus();

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(SHEET_TRANSLATE_INITIAL)).current;

  useEffect(() => {
    if (visible) {
      overlayOpacity.setValue(0);
      sheetY.setValue(SHEET_TRANSLATE_INITIAL);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(sheetY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 16,
        }),
      ]).start();
    }
  }, [visible, overlayOpacity, sheetY]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(sheetY, {
        toValue: SHEET_TRANSLATE_INITIAL,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }

  const { purchaseProduct, isPurchasing, purchaseError } = useIAP({
    sessionId: null,
    onPurchaseComplete: (_productType, _userPremium) => {
      invalidatePurchaseStatus();
      onSuccess();
    },
  });

  async function handlePurchase() {
    await purchaseProduct(PRODUCT_IDS.SELF_NAMING_PREMIUM);
  }

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <Animated.View
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)', opacity: overlayOpacity }}
      >
        <Animated.View
          className="bg-bg px-[24px] rounded-t-[20px]"
          style={{
            paddingBottom: insets.bottom || 24,
            transform: [{ translateY: sheetY }],
          }}
        >
          {/* 닫기 */}
          <View className="items-end pt-[16px] pb-[4px]">
            <Pressable
              onPress={handleClose}
              className="p-2 active:opacity-50"
              disabled={isPurchasing}
            >
              <Font
                tag="secondary"
                style={{ fontSize: 22, color: colors.textTertiary }}
              >
                ✕
              </Font>
            </Pressable>
          </View>

          {/* 타이틀 */}
          <View className="pt-[4px] pb-[16px]">
            <Font
              tag="primaryMedium"
              style={{
                fontSize: 20,
                color: colors.textPrimary,
                lineHeight: 30,
              }}
            >
              스스로 이름짓기 프리미엄
            </Font>
            <Font
              tag="secondary"
              style={{
                fontSize: 13,
                color: colors.textTertiary,
                marginTop: 4,
                lineHeight: 19,
              }}
            >
              용신 보완 분석으로 사주에 꼭 맞는 이름을 지어보세요
            </Font>
          </View>

          {/* 혜택 카드 */}
          <View
            className="rounded-[14px] p-4 mb-[16px] border"
            style={{
              backgroundColor: primitives.gold200,
              borderColor: primitives.gold400,
            }}
          >
            <Font
              tag="secondaryMedium"
              style={{
                fontSize: 13,
                color: colors.textPrimary,
                marginBottom: 10,
              }}
            >
              작명에서 용신이 중요한 이유
            </Font>
            {REASONS.map((reason, i) => (
              <View key={i} className="flex-row gap-2 mb-2">
                <Font
                  tag="secondary"
                  style={{ fontSize: 13, color: primitives.gold600 }}
                >
                  •
                </Font>
                <Font
                  tag="secondary"
                  className="flex-1"
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    lineHeight: 19,
                  }}
                >
                  {reason}
                </Font>
              </View>
            ))}
          </View>

          {/* 가격 안내 */}
          <View className="flex-row items-center justify-between mb-[14px] px-1">
            <Font
              tag="secondary"
              style={{ fontSize: 14, color: colors.textSecondary }}
            >
              1회 결제 · 모든 명주 적용 · 평생 이용
            </Font>
            <Font
              tag="primaryMedium"
              style={{ fontSize: 18, color: colors.fillAccent }}
            >
              2,900원
            </Font>
          </View>

          {/* 오류 메시지 */}
          {purchaseError && (
            <View className="mb-3 px-3 py-2 rounded-[8px] bg-negativeSub">
              <Font
                tag="secondary"
                style={{ fontSize: 12, color: colors.negative }}
              >
                {purchaseError}
              </Font>
            </View>
          )}

          {/* 구매 버튼 */}
          <Pressable
            onPress={handlePurchase}
            disabled={isPurchasing}
            className="rounded-[12px] py-[16px] items-center active:opacity-80"
            style={{ backgroundColor: colors.fillBold }}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Font
                tag="secondaryMedium"
                style={{ fontSize: 16, color: '#fff' }}
              >
                2,900원에 구매하기
              </Font>
            )}
          </Pressable>

          <View className="pt-[10px]">
            <Font
              tag="secondary"
              style={{
                fontSize: 11,
                color: colors.textDisabled,
                textAlign: 'center',
              }}
            >
              구매 후 환불 불가 · Apple/Google 정책 적용
            </Font>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
