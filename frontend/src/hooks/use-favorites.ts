import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CarListDto } from '@/types';
import { useAuthStore } from '@/stores/auth-store';

export function useFavorites() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await api.get<CarListDto[]>('/users/favorites');
      return res.data;
    },
    enabled: isAuthenticated(),
  });
}

export function useIsFavorite(carId: string) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['favorites', carId],
    queryFn: async () => {
      const res = await api.get<{ isFavorite: boolean }>(`/users/favorites/${carId}/check`);
      return res.data.isFavorite;
    },
    enabled: isAuthenticated(),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ carId, isFavorite }: { carId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await api.delete(`/users/favorites/${carId}`);
      } else {
        await api.post(`/users/favorites/${carId}`);
      }
    },
    onSuccess: (_, { carId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorites', carId] });
    },
  });
}
