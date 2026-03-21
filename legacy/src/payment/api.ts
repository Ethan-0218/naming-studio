import { BACKEND_URL } from '../../constants/config';
import { getToken } from '../auth/tokenStorage';
import {
  ProductId,
  PurchaseRecord,
  PurchaseStatus,
  VerifyPurchaseResult,
} from './types';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  return { Authorization: `Bearer ${token}` };
}

export async function verifyPurchase(params: {
  productId: ProductId;
  transactionId: string;
  receiptData: string;
  sessionId: string | null;
}): Promise<VerifyPurchaseResult> {
  const res = await fetch(`${BACKEND_URL}/api/purchases/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
    },
    body: JSON.stringify({
      product_id: params.productId,
      transaction_id: params.transactionId,
      receipt_data: params.receiptData,
      session_id: params.sessionId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`구매 검증 실패: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    purchaseId: data.purchase_id,
    productType: data.product_type,
    sessionUnlocked: data.session_unlocked,
    userPremium: data.user_premium,
  };
}

export interface PurchaseStatusResponse extends PurchaseStatus {
  purchases: PurchaseRecord[];
}

export async function getPurchaseStatus(params: {
  sessionId?: string;
}): Promise<PurchaseStatusResponse> {
  const headers = await authHeaders();
  const url = new URL(`${BACKEND_URL}/api/purchases/status`);
  if (params.sessionId) url.searchParams.set('session_id', params.sessionId);

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    throw new Error(`구매 상태 조회 실패: ${res.status}`);
  }

  const data = await res.json();
  return {
    selfNamingPremium: data.self_naming_premium,
    aiNamingUnlocked: data.ai_naming_unlocked,
    aiNamingPurchasedCount: data.ai_naming_purchased_count,
    purchases: (data.purchases ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      productId: p.product_id as string,
      productType: p.product_type as string,
      amountKrw: p.amount_krw as number,
      sessionId: (p.session_id as string | null) ?? null,
      purchasedAt: p.purchased_at as string,
    })),
  };
}
