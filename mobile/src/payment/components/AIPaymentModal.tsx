import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Font } from '@/components/Font';
import { colors, primitives } from '@/design-system';
import {
  PRODUCT_IDS,
  ProductId,
  selectUnlimitedPrice,
  selectUnlimitedProductId,
} from '../types';
import { useIAP } from '../hooks/useIAP';
import { useInvalidatePurchaseStatus } from '../hooks/usePurchaseStatus';

interface Props {
  visible: boolean;
  sessionId: string;
  /** 해당 세션에서 기구매한 추천 수 합계 (ai_naming_1×n + ai_naming_5×n) */
  purchasedCount: number;
  onClose: () => void;
  /** 구매 완료 후 호출 — 부모에서 handlePayment() 등 후속 처리 */
  onSuccess: () => void;
}

interface PlanOption {
  title: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  discountLabel?: string;
  productId: ProductId;
  isConsumable: boolean;
  badge?: string;
}

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR') + '원';
}

const SHEET_TRANSLATE_INITIAL = 500;

export default function AIPaymentModal({
  visible,
  sessionId,
  purchasedCount,
  onClose,
  onSuccess,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selectedProductId, setSelectedProductId] = useState<ProductId | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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

  const { purchaseProduct, isPurchasing } = useIAP({
    sessionId,
    onPurchaseComplete: (_productType, _userPremium) => {
      invalidatePurchaseStatus(sessionId);
      setSelectedProductId(null);
      onSuccess();
    },
    onPurchaseError: (msg) => {
      setErrorMsg(msg);
      setSelectedProductId(null);
    },
  });

  const unlimitedProductId = selectUnlimitedProductId(purchasedCount);
  const unlimitedPrice = selectUnlimitedPrice(purchasedCount);
  const hasDiscount = purchasedCount > 0;
  const discountAmount = hasDiscount ? 49800 - unlimitedPrice : 0;

  const plans: PlanOption[] = [
    {
      title: '이름 추천 1개',
      subtitle: '추천 이름 1개를 탐색해요',
      price: 4900,
      productId: PRODUCT_IDS.AI_NAMING_1,
      isConsumable: true,
    },
    {
      title: '이름 추천 5개',
      subtitle: '추천 이름 5개를 탐색해요',
      price: 21900,
      productId: PRODUCT_IDS.AI_NAMING_5,
      isConsumable: true,
    },
    {
      title: '이름 추천 무제한',
      subtitle: '이 명주로는 무한히 탐색해요',
      price: unlimitedPrice,
      originalPrice: hasDiscount ? 49800 : undefined,
      discountLabel: hasDiscount
        ? `${formatPrice(discountAmount)} 할인`
        : undefined,
      productId: unlimitedProductId,
      isConsumable: false,
      badge: '추천',
    },
  ];

  async function handlePurchase(plan: PlanOption) {
    setErrorMsg(null);
    setSelectedProductId(plan.productId);
    await purchaseProduct(plan.productId);
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
          className="bg-bg rounded-t-[20px]"
          style={{
            maxHeight: '88%',
            paddingBottom: insets.bottom || 16,
            transform: [{ translateY: sheetY }],
          }}
        >
          {/* 닫기 */}
          <View className="items-end px-[24px] pt-[16px] pb-[4px]">
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
          <View className="px-[24px] pt-[4px] pb-[16px]">
            <Font
              tag="primaryMedium"
              style={{
                fontSize: 20,
                color: colors.textPrimary,
                lineHeight: 30,
              }}
            >
              AI 이름 추천 이용권
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
              이 명주(사주)에서 사용할 수 있는 이름 탐색 횟수예요
            </Font>
            {purchasedCount > 0 && (
              <View className="mt-3 px-3 py-2 rounded-[8px] bg-fillAccentSub flex-row items-center gap-2">
                <Font
                  tag="secondary"
                  style={{ fontSize: 12, color: colors.fillAccent }}
                >
                  이미 {purchasedCount}개 이름 추천 이용권을 보유 중이에요.
                  무제한 업그레이드 시 할인이 적용돼요.
                </Font>
              </View>
            )}
          </View>

          {/* 플랜 카드 목록 */}
          {__DEV__ && (
            <View
              className="mx-[16px] mb-[10px] px-3 py-2 rounded-[8px]"
              style={{ backgroundColor: colors.fillAccentSub }}
            >
              <Font
                tag="secondaryMedium"
                style={{ fontSize: 12, color: colors.fillAccent }}
              >
                DEV 모드 — 실제 결제 없이 즉시 처리됩니다
              </Font>
            </View>
          )}
          <ScrollView
            className="px-[16px]"
            showsVerticalScrollIndicator={false}
          >
            {plans.map((plan) => {
              const isSelected = selectedProductId === plan.productId;
              return (
                <Pressable
                  key={plan.productId}
                  onPress={() => handlePurchase(plan)}
                  disabled={isPurchasing}
                  className="mb-[10px] rounded-[14px] border active:opacity-80"
                  style={{
                    borderColor: isSelected ? colors.fillAccent : colors.border,
                    backgroundColor: isSelected
                      ? primitives.gold200
                      : colors.surfaceRaised,
                  }}
                >
                  <View className="px-[18px] py-[16px]">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-4">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Font
                            tag="primaryMedium"
                            style={{
                              fontSize: 16,
                              color: colors.textPrimary,
                            }}
                          >
                            {plan.title}
                          </Font>
                          {plan.badge && (
                            <View
                              className="px-2 py-[2px] rounded-full"
                              style={{ backgroundColor: colors.fillAccent }}
                            >
                              <Font
                                tag="secondaryMedium"
                                style={{ fontSize: 10, color: '#fff' }}
                              >
                                {plan.badge}
                              </Font>
                            </View>
                          )}
                        </View>
                        <Font
                          tag="secondary"
                          style={{
                            fontSize: 13,
                            color: colors.textTertiary,
                            lineHeight: 18,
                          }}
                        >
                          {plan.subtitle}
                        </Font>
                      </View>

                      {/* 가격 */}
                      <View className="items-end">
                        {plan.originalPrice && (
                          <Font
                            tag="secondary"
                            style={{
                              fontSize: 12,
                              color: colors.textDisabled,
                              textDecorationLine: 'line-through',
                            }}
                          >
                            {formatPrice(plan.originalPrice)}
                          </Font>
                        )}
                        <Font
                          tag="primaryMedium"
                          style={{
                            fontSize: 17,
                            color: colors.fillAccent,
                            lineHeight: 24,
                          }}
                        >
                          {formatPrice(plan.price)}
                        </Font>
                        {plan.discountLabel && (
                          <View
                            className="mt-1 px-2 py-[2px] rounded-full"
                            style={{ backgroundColor: colors.negativeSub }}
                          >
                            <Font
                              tag="secondaryMedium"
                              style={{
                                fontSize: 10,
                                color: colors.negative,
                              }}
                            >
                              {plan.discountLabel}
                            </Font>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* 구매 버튼 */}
                    <View
                      className="mt-3 pt-3 border-t"
                      style={{ borderTopColor: colors.border }}
                    >
                      <View
                        className="rounded-[8px] py-[10px] items-center"
                        style={{
                          backgroundColor: isSelected
                            ? colors.fillAccent
                            : colors.fillBold,
                        }}
                      >
                        {isSelected && isPurchasing ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Font
                            tag="secondaryMedium"
                            style={{ fontSize: 14, color: '#fff' }}
                          >
                            {formatPrice(plan.price)}에 구매하기
                          </Font>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 오류 메시지 */}
          {errorMsg && (
            <View className="mx-[16px] mt-2 px-3 py-2 rounded-[8px] bg-negativeSub">
              <Font
                tag="secondary"
                style={{ fontSize: 12, color: colors.negative }}
              >
                {errorMsg}
              </Font>
            </View>
          )}

          {/* 안내 문구 */}
          <View className="px-[24px] pt-[12px]">
            <Font
              tag="secondary"
              style={{
                fontSize: 11,
                color: colors.textDisabled,
                lineHeight: 16,
                textAlign: 'center',
              }}
            >
              1회 구매 · 이 명주에서만 사용 · 구매 후 환불 불가
            </Font>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
