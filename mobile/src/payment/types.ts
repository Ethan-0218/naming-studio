export const PRODUCT_IDS = {
  SELF_NAMING_PREMIUM: 'com.namingstudio.self_naming_premium',
  AI_NAMING_1: 'com.namingstudio.ai_naming_1',
  AI_NAMING_5: 'com.namingstudio.ai_naming_5',
  AI_NAMING_UNLIMITED: 'com.namingstudio.ai_naming_unlimited',
  AI_NAMING_UNLIMITED_U1: 'com.namingstudio.ai_naming_unlimited_u1',
  AI_NAMING_UNLIMITED_U2: 'com.namingstudio.ai_naming_unlimited_u2',
  AI_NAMING_UNLIMITED_U3: 'com.namingstudio.ai_naming_unlimited_u3',
  AI_NAMING_UNLIMITED_U4: 'com.namingstudio.ai_naming_unlimited_u4',
  AI_NAMING_UNLIMITED_U5: 'com.namingstudio.ai_naming_unlimited_u5',
  AI_NAMING_UNLIMITED_U5PLUS: 'com.namingstudio.ai_naming_unlimited_u5plus',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

export const ALL_PRODUCT_IDS: ProductId[] = Object.values(PRODUCT_IDS);

export interface PurchaseStatus {
  selfNamingPremium: boolean;
  aiNamingUnlocked: boolean;
  aiNamingPurchasedCount: number;
}

export interface PurchaseRecord {
  id: string;
  productId: string;
  productType: string;
  amountKrw: number;
  sessionId: string | null;
  purchasedAt: string;
}

export interface VerifyPurchaseResult {
  purchaseId: string;
  productType: string;
  sessionUnlocked: boolean;
  userPremium: boolean;
}

/** 기구매 추천 수에 따른 무제한 업그레이드 product ID */
export function selectUnlimitedProductId(purchasedCount: number): ProductId {
  if (purchasedCount === 0) return PRODUCT_IDS.AI_NAMING_UNLIMITED;
  if (purchasedCount === 1) return PRODUCT_IDS.AI_NAMING_UNLIMITED_U1;
  if (purchasedCount === 2) return PRODUCT_IDS.AI_NAMING_UNLIMITED_U2;
  if (purchasedCount === 3) return PRODUCT_IDS.AI_NAMING_UNLIMITED_U3;
  if (purchasedCount === 4) return PRODUCT_IDS.AI_NAMING_UNLIMITED_U4;
  if (purchasedCount === 5) return PRODUCT_IDS.AI_NAMING_UNLIMITED_U5;
  return PRODUCT_IDS.AI_NAMING_UNLIMITED_U5PLUS;
}

/** 기구매 추천 수에 따른 무제한 업그레이드 가격 */
export function selectUnlimitedPrice(purchasedCount: number): number {
  if (purchasedCount === 0) return 49800;
  if (purchasedCount >= 6) return 21900;
  return 49800 - purchasedCount * 4900;
}
