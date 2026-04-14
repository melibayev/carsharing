import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  BookingDto,
  CreateBookingRequest,
  QuoteRequest,
  QuoteResponse,
  PagedResult,
} from '@/types';

export function useQuote(params: QuoteRequest | null) {
  return useQuery({
    queryKey: ['quote', params],
    queryFn: async () => {
      const res = await api.post<QuoteResponse>('/bookings/quote', params);
      return res.data;
    },
    enabled: !!params?.carId && !!params?.startUtc && !!params?.endUtc,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      const res = await api.post<BookingDto>('/bookings', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useMyBookings(role: 'guest' | 'host', page = 1) {
  return useQuery({
    queryKey: ['bookings', role, page],
    queryFn: async () => {
      const res = await api.get<PagedResult<BookingDto>>('/bookings/me', { params: { role, page } });
      return res.data;
    },
  });
}

export function useBookingDetail(bookingId: string) {
  return useQuery({
    queryKey: ['bookings', bookingId],
    queryFn: async () => {
      const res = await api.get<BookingDto>(`/bookings/${bookingId}`);
      return res.data;
    },
    enabled: !!bookingId,
  });
}

export function useApproveBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await api.post<BookingDto>(`/bookings/${bookingId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useRejectBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const res = await api.post<BookingDto>(`/bookings/${bookingId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const res = await api.post<BookingDto>(`/bookings/${bookingId}/cancel`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, odometerKm }: { bookingId: string; odometerKm: number }) => {
      const res = await api.post<BookingDto>(`/bookings/${bookingId}/check-in`, { odometerKm, photoUrls: [] });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, odometerKm }: { bookingId: string; odometerKm: number }) => {
      const res = await api.post<BookingDto>(`/bookings/${bookingId}/check-out`, { odometerKm, photoUrls: [] });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
