import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  AdminMetricsDto,
  AdminUserDto,
  BookingDto,
  CarListDto,
  PagedResult,
} from '@/types';

export function useAdminMetrics() {
  return useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: async () => {
      const res = await api.get<AdminMetricsDto>('/admin/metrics');
      return res.data;
    },
  });
}

export function useAdminUsers(page = 1) {
  return useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: async () => {
      const res = await api.get<PagedResult<AdminUserDto>>('/admin/users', { params: { page } });
      return res.data;
    },
  });
}

export function useAdminBookings(page = 1) {
  return useQuery({
    queryKey: ['admin', 'bookings', page],
    queryFn: async () => {
      const res = await api.get<PagedResult<BookingDto>>('/admin/bookings', { params: { page } });
      return res.data;
    },
  });
}

export function useAdminCars(page = 1) {
  return useQuery({
    queryKey: ['admin', 'cars', page],
    queryFn: async () => {
      const res = await api.get<PagedResult<CarListDto>>('/admin/cars', { params: { page } });
      return res.data;
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/admin/users/${userId}/ban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/admin/users/${userId}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useVerifyUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/admin/users/${userId}/verify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
