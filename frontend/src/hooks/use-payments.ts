import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  AccountBalanceDto,
  LedgerEntryDto,
  TopUpIntentRequest,
  TopUpIntentResponse,
  ConfirmTopUpRequest,
  UserPaymentMethodDto,
  AddCardIntentRequest,
  AddCardIntentResponse,
  ConfirmCardRequest,
  ResendCardSmsRequest,
  CheckoutDto,
  PayBookingRequest,
  PayBookingResponse,
  ReceiptDto,
  PagedResult,
} from '@/types';

// ── Balance ─────────────────────────────────────────────────────────────────

export function useBalance() {
  return useQuery({
    queryKey: ['balance'],
    queryFn: async () => {
      const res = await api.get<AccountBalanceDto>('/balance');
      return res.data;
    },
  });
}

export function useLedger(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['ledger', page, pageSize],
    queryFn: async () => {
      const res = await api.get<PagedResult<LedgerEntryDto>>('/balance/ledger', {
        params: { page, pageSize },
      });
      return res.data;
    },
  });
}

export function useCreateTopUpIntent() {
  return useMutation({
    mutationFn: async (request: TopUpIntentRequest) => {
      const res = await api.post<TopUpIntentResponse>('/balance/topup/intent', request);
      return res.data;
    },
  });
}

export function useConfirmTopUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (request: ConfirmTopUpRequest) => {
      const res = await api.post<AccountBalanceDto>('/balance/topup/confirm', request);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}

// ── Payment Methods ──────────────────────────────────────────────────────────

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await api.get<UserPaymentMethodDto[]>('/payment-methods');
      return res.data;
    },
  });
}

export function useAddCardIntent() {
  return useMutation({
    mutationFn: async (request: AddCardIntentRequest) => {
      const res = await api.post<AddCardIntentResponse>('/payment-methods/intent', request);
      return res.data;
    },
  });
}

export function useConfirmCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (request: ConfirmCardRequest) => {
      const res = await api.post<UserPaymentMethodDto>('/payment-methods/confirm', request);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useResendCardSms() {
  return useMutation({
    mutationFn: async (request: ResendCardSmsRequest) => {
      await api.post('/payment-methods/resend-sms', request);
    },
  });
}

export function useSetDefaultCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/payment-methods/${id}/default`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/payment-methods/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

// ── Checkout ─────────────────────────────────────────────────────────────────

export function useCheckout(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['checkout', bookingId],
    queryFn: async () => {
      const res = await api.get<CheckoutDto>(`/bookings/${bookingId}/checkout`);
      return res.data;
    },
    enabled: !!bookingId,
    refetchInterval: false,
  });
}

export function usePayBooking(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ request, idempotencyKey }: { request: PayBookingRequest; idempotencyKey?: string }) => {
      const res = await api.post<PayBookingResponse>(`/bookings/${bookingId}/pay`, request, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking', bookingId] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}

// ── Receipt ─────────────────────────────────────────────────────────────────

export function useReceipt(receiptId: string | undefined) {
  return useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: async () => {
      const res = await api.get<ReceiptDto>(`/receipts/${receiptId}`);
      return res.data;
    },
    enabled: !!receiptId,
  });
}

export function useEmailReceipt() {
  return useMutation({
    mutationFn: async (receiptId: string) => {
      await api.post(`/receipts/${receiptId}/email`);
    },
  });
}
