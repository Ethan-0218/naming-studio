import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMyeongJu } from '../api';
import { queryKeys } from '@/lib/queryKeys';

export function useDeleteMyeongJu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMyeongJu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myeongju.list() });
    },
  });
}
