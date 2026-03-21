import { useQuery } from '@tanstack/react-query';
import { listMyeongJu } from '../api';
import { queryKeys } from '@/lib/queryKeys';

export function useMyeongJuList() {
  return useQuery({
    queryKey: queryKeys.myeongju.list(),
    queryFn: listMyeongJu,
    staleTime: 5 * 60_000, // 5분 (명주는 자주 안 바뀜)
  });
}
