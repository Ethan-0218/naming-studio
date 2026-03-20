import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthContext';
import { fetchUserProfile } from '@/auth/api';
import { queryKeys } from '@/lib/queryKeys';

const ME_STALE_MS = 120_000;

/**
 * GET /api/auth/me — 서버 기준 프로필·프리미엄.
 * `auth.profile`은 SecureStore 오프라인 스냅샷으로 placeholder에만 사용합니다.
 */
export function useUserProfile() {
  const { auth } = useAuth();
  const token = auth.token;
  const offlineProfile = auth.profile;

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      if (!token) throw new Error('토큰이 없습니다.');
      return fetchUserProfile(token);
    },
    enabled: !!token,
    placeholderData: offlineProfile ?? undefined,
    staleTime: ME_STALE_MS,
  });

  const profile = query.data ?? offlineProfile ?? null;

  return { ...query, profile };
}
