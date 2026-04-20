import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  AdminMetricsDto,
  AdminUserDto,
  AdminFinanceDto,
  AdminCarDto,
  AdminBookingDto,
  DisputeDto,
  KycVerificationDto,
  AuditLogDto,
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
      const res = await api.get<PagedResult<AdminBookingDto>>('/admin/bookings', { params: { page } });
      return res.data;
    },
  });
}

export function useAdminCars(page = 1) {
  return useQuery({
    queryKey: ['admin', 'cars', page],
    queryFn: async () => {
      const res = await api.get<PagedResult<AdminCarDto>>('/admin/cars', { params: { page } });
      return res.data;
    },
  });
}

export function useAdminDisputes(status?: string, page = 1) {
  return useQuery({
    queryKey: ['admin', 'disputes', status, page],
    queryFn: async () => {
      const res = await api.get<PagedResult<DisputeDto>>('/admin/disputes', {
        params: { status, page },
      });
      return res.data;
    },
  });
}

export function useAdminVerifications(page = 1) {
  return useQuery({
    queryKey: ['admin', 'verifications', page],
    queryFn: async () => {
      const res = await api.get<PagedResult<KycVerificationDto>>('/admin/verifications', {
        params: { page },
      });
      return res.data;
    },
  });
}

export function useAdminFinance() {
  return useQuery({
    queryKey: ['admin', 'finance'],
    queryFn: async () => {
      const res = await api.get<AdminFinanceDto>('/admin/finance');
      return res.data;
    },
  });
}

export function useAdminAuditLogs(entityType?: string, page = 1) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', entityType, page],
    queryFn: async () => {
      const res = await api.get<PagedResult<AuditLogDto>>('/admin/audit-logs', {
        params: { entityType, page, pageSize: 50 },
      });
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

export function useReviewKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved, rejectionReason, notes }: {
      id: string;
      approved: boolean;
      rejectionReason?: string;
      notes?: string;
    }) => {
      await api.post(`/admin/verifications/${id}/review`, { approved, rejectionReason, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'metrics'] });
    },
  });
}

export function useResolveDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resolution, refundAmount }: {
      id: string;
      resolution: string;
      refundAmount?: number;
    }) => {
      await api.post(`/admin/disputes/${id}/resolve`, { resolution, refundAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'metrics'] });
    },
  });
}

export function useEscalateDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/disputes/${id}/escalate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    },
  });
}

export function useApproveCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (carId: string) => {
      await api.post(`/admin/cars/${carId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cars'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'metrics'] });
    },
  });
}

export function useRejectCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (carId: string) => {
      await api.post(`/admin/cars/${carId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cars'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'metrics'] });
    },
  });
}
