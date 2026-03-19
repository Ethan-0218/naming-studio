import { useCallback, useRef, useState } from 'react';
import { ALL_PRODUCT_IDS, ProductId } from '../types';
import { verifyPurchase } from '../api';

// ─── 개발 모드 결제 우회 ──────────────────────────────────────────────────────

function useIAPDevBypass(options: UsePurchaseOptions) {
  const { sessionId, onPurchaseComplete, onPurchaseError } = options;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const [isPurchasing, setIsPurchasing] = useState(false);

  const purchaseProduct = useCallback(
    async (productId: ProductId) => {
      setIsPurchasing(true);
      try {
        const result = await verifyPurchase({
          productId,
          transactionId: `dev_bypass_${Date.now()}`,
          receiptData: '',
          sessionId: sessionIdRef.current,
        });
        onPurchaseComplete?.(result.productType, result.userPremium);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : '개발 모드 결제 우회 실패';
        onPurchaseError?.(msg);
      } finally {
        setIsPurchasing(false);
      }
    },
    [onPurchaseComplete, onPurchaseError],
  );

  return {
    purchaseProduct,
    isPurchasing,
    purchaseError: null,
    isConnected: true,
  };
}

// 네이티브 모듈 가용 여부를 모듈 로드 시점에 동기적으로 확인 (상수)
function _checkIAPAvailable(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireNativeModule } = require('expo-modules-core');
    requireNativeModule('ExpoIap');
    return true;
  } catch {
    return false;
  }
}

const _IAP_AVAILABLE = _checkIAPAvailable();

export function isIAPAvailable(): boolean {
  return _IAP_AVAILABLE;
}

interface UsePurchaseOptions {
  sessionId: string | null;
  /** 백엔드 검증 + finishTransaction 완료 후 호출 */
  onPurchaseComplete?: (productType: string, userPremium: boolean) => void;
  onPurchaseError?: (error: string) => void;
}

const UNAVAILABLE_MSG = '결제 기능은 정식 빌드에서 이용할 수 있습니다.';

/**
 * IAP 구매 처리 훅.
 *
 * expo-iap의 useIAP를 래핑하며, 백엔드 검증 후 finishTransaction을 호출하는
 * 안전한 구매 플로우를 제공합니다.
 *
 * Expo Go 등 네이티브 모듈이 없는 환경에서는 자동으로 stub 모드로 동작합니다.
 * _IAP_AVAILABLE은 모듈 로드 시 결정되는 상수이므로 훅 호출 순서가 항상 일정합니다.
 */
export function useIAP(options: UsePurchaseOptions) {
  if (__DEV__) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useIAPDevBypass(options);
  }
  if (_IAP_AVAILABLE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useIAPWithNative(options);
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useIAPStub(options);
  }
}

// ─── 네이티브 IAP가 가능한 환경 ───────────────────────────────────────────────

function useIAPWithNative(options: UsePurchaseOptions) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useIAP: useExpoIAP } =
    require('expo-iap') as typeof import('expo-iap');
  const { sessionId, onPurchaseComplete, onPurchaseError } = options;
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const handlePurchaseSuccess = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (purchase: any) => {
      setIsPurchasing(true);
      setPurchaseError(null);
      try {
        const result = await verifyPurchase({
          productId: purchase.productId as ProductId,
          transactionId: purchase.transactionId ?? purchase.productId,
          receiptData: purchase.transactionReceipt ?? '',
          sessionId: sessionIdRef.current,
        });

        // 백엔드 검증 성공 후에만 finishTransaction 호출
        await iap.finishTransaction({
          purchase,
          isConsumable:
            purchase.productId === 'com.namingstudio.ai_naming_1' ||
            purchase.productId === 'com.namingstudio.ai_naming_5',
        });

        onPurchaseComplete?.(result.productType, result.userPremium);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : '구매 처리 중 오류가 발생했습니다.';
        setPurchaseError(msg);
        onPurchaseError?.(msg);
      } finally {
        setIsPurchasing(false);
      }
    },
    [onPurchaseComplete, onPurchaseError],
  );

  const iap = useExpoIAP({
    onPurchaseSuccess: handlePurchaseSuccess,
    onPurchaseError: (err) => {
      setIsPurchasing(false);
      const friendly =
        err instanceof Error
          ? err.message
          : '결제가 취소되었거나 오류가 발생했습니다.';
      setPurchaseError(friendly);
      onPurchaseError?.(friendly);
    },
  });

  const purchaseProduct = useCallback(
    async (productId: ProductId) => {
      setIsPurchasing(true);
      setPurchaseError(null);
      try {
        if (iap.products.length === 0) {
          await iap.fetchProducts({ skus: ALL_PRODUCT_IDS, type: 'in-app' });
        }
        await iap.requestPurchase({
          request: {
            apple: { sku: productId },
            google: { skus: [productId] },
          },
          type: 'in-app',
        });
      } catch (err) {
        setIsPurchasing(false);
        const msg =
          err instanceof Error
            ? err.message
            : '결제 요청 중 오류가 발생했습니다.';
        setPurchaseError(msg);
        onPurchaseError?.(msg);
      }
    },
    [iap, onPurchaseError],
  );

  return {
    purchaseProduct,
    isPurchasing,
    purchaseError,
    isConnected: iap.connected,
  };
}

// ─── 네이티브 IAP 없는 환경 (Expo Go 등) — stub ────────────────────────────────

function useIAPStub(options: UsePurchaseOptions) {
  const { onPurchaseError } = options;
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const purchaseProduct = useCallback(
    async (_productId: ProductId) => {
      setPurchaseError(UNAVAILABLE_MSG);
      onPurchaseError?.(UNAVAILABLE_MSG);
    },
    [onPurchaseError],
  );

  return {
    purchaseProduct,
    isPurchasing: false,
    purchaseError,
    isConnected: false,
  };
}
