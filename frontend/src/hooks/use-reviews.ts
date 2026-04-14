import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ReviewDto, CreateReviewRequest } from '@/types';

export function useReviewsForCar(carId: string) {
  return useQuery({
    queryKey: ['reviews', 'car', carId],
    queryFn: async () => {
      const res = await api.get<ReviewDto[]>('/reviews', { params: { carId } });
      return res.data;
    },
    enabled: !!carId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateReviewRequest) => {
      const res = await api.post<ReviewDto>('/reviews', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
