import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  CarListDto,
  CarDetailDto,
  CarSearchParams,
  CreateCarRequest,
  PagedResult,
} from '@/types';

export function useCarSearch(params: CarSearchParams) {
  return useQuery({
    queryKey: ['cars', 'search', params],
    queryFn: async () => {
      const res = await api.get<PagedResult<CarListDto>>('/cars/search', { params });
      return res.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useFeaturedCars(count = 8) {
  return useQuery({
    queryKey: ['cars', 'featured', count],
    queryFn: async () => {
      const res = await api.get<CarListDto[]>('/cars/featured', { params: { count } });
      return res.data;
    },
  });
}

export function useCarDetail(carId: string) {
  return useQuery({
    queryKey: ['cars', carId],
    queryFn: async () => {
      const res = await api.get<CarDetailDto>(`/cars/${carId}`);
      return res.data;
    },
    enabled: !!carId,
  });
}

export function useMyCars() {
  return useQuery({
    queryKey: ['cars', 'mine'],
    queryFn: async () => {
      const res = await api.get<CarListDto[]>('/cars/mine');
      return res.data;
    },
  });
}

export function useCreateCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCarRequest) => {
      const res = await api.post<CarDetailDto>('/cars', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
  });
}

export function useUpdateCar(carId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreateCarRequest>) => {
      const res = await api.put<CarDetailDto>(`/cars/${carId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
  });
}

export function useDeleteCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (carId: string) => {
      await api.delete(`/cars/${carId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ carId, isFavorited }: { carId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        await api.delete(`/users/me/favorites/${carId}`);
      } else {
        await api.post(`/users/me/favorites/${carId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await api.get<CarListDto[]>('/users/me/favorites');
      return res.data;
    },
  });
}

export function useUploadCarPhoto(carId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/cars/${carId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars', carId] });
    },
  });
}
