import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMyeongJu } from '../api';
import { queryKeys } from '@/lib/queryKeys';

export function useCreateMyeongJu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMyeongJu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myeongju.list() });
    },
  });
}
