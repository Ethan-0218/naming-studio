/**
 * Query Key Factory — 앱 전체 query key를 한 곳에서 관리.
 * 계층적 구조로 정의해 부모 key로 invalidation 가능.
 *
 * 예시:
 *   queryKeys.myeongju.list()         → ['myeongju', 'list']
 *   queryKeys.hanja.search('name','지') → ['hanja', 'search', 'name', '지']
 */
export const queryKeys = {
  myeongju: {
    all: ['myeongju'] as const,
    list: () => [...queryKeys.myeongju.all, 'list'] as const,
  },
  hanja: {
    all: ['hanja'] as const,
    search: (role: 'surname' | 'name', q: string) =>
      [...queryKeys.hanja.all, 'search', role, q] as const,
  },
  purchases: {
    all: ['purchases'] as const,
    status: (sessionId?: string) =>
      [...queryKeys.purchases.all, 'status', sessionId ?? 'global'] as const,
  },
} as const;
