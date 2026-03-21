import { useUserProfile } from '@/auth/hooks/useUserProfile';
import { usePurchaseStatus } from './usePurchaseStatus';

/**
 * 스스로 이름짓기(셀프 작명) 프리미엄 여부.
 * 구매 상태 API를 우선하고, 그다음 서버 유저 프로필의 isPremium을 사용합니다.
 */
export function useSelfNamingPremium(): boolean {
  const { data: purchaseStatus } = usePurchaseStatus();
  const { profile } = useUserProfile();
  return purchaseStatus?.selfNamingPremium ?? profile?.isPremium ?? false;
}
