import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { getPurchaseStatus, PurchaseStatusResponse } from '../api';

/**
 * 사용자의 구매 상태를 조회하는 훅.
 *
 * @param sessionId AI 작명 세션 ID (AI 작명 구매 상태 조회 시 전달)
 */
export function usePurchaseStatus(sessionId?: string) {
  const { auth } = useAuth();

  return useQuery<PurchaseStatusResponse>({
    queryKey: queryKeys.purchases.status(sessionId),
    queryFn: () => getPurchaseStatus({ sessionId }),
    enabled: !!auth.token,
    staleTime: 30_000,
  });
}

/** 구매 완료 후 관련 쿼리를 invalidate하는 헬퍼. */
export function useInvalidatePurchaseStatus() {
  const queryClient = useQueryClient();
  return (sessionId?: string) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.purchases.status(sessionId),
    });
    // 글로벌 상태(self_naming_premium 등)도 갱신
    queryClient.invalidateQueries({
      queryKey: queryKeys.purchases.all,
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.auth.me(),
    });
  };
}
