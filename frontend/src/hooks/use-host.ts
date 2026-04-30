import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  EligibilityDto,
  PayoutMethodDto,
  AttachPayoutMethodRequest,
  SignAgreementRequest,
  CarDraftDto,
  PatchDraftRequest,
  SubmitDraftResponse,
  VinAvailableResponse,
  HostDashboardDto,
  HostCarListDto,
  AccountBalanceDto,
  LedgerEntryDto,
  PagedResult,
} from '@/types';

// ── Eligibility ───────────────────────────────────────────────────────────────

export function useHostEligibility() {
  return useQuery({
    queryKey: ['host', 'eligibility'],
    queryFn: async () => {
      const res = await api.get<EligibilityDto>('/host/eligibility');
      return res.data;
    },
    staleTime: 30_000,
  });
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export function useConfirmIdentity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/host/onboarding/identity/confirm');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['host', 'eligibility'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useAttachPayoutMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AttachPayoutMethodRequest) => {
      const res = await api.post<PayoutMethodDto>('/host/onboarding/payout', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['host', 'payout-methods'] });
      qc.invalidateQueries({ queryKey: ['host', 'eligibility'] });
    },
  });
}

export function usePayoutMethods() {
  return useQuery({
    queryKey: ['host', 'payout-methods'],
    queryFn: async () => {
      const res = await api.get<PayoutMethodDto[]>('/host/onboarding/payout-methods');
      return res.data;
    },
  });
}

export function useDeletePayoutMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/host/onboarding/payout-methods/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['host', 'payout-methods'] });
    },
  });
}

export function useSignAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: SignAgreementRequest) => {
      const res = await api.post('/host/onboarding/agreement', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['host', 'eligibility'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ── VIN check ─────────────────────────────────────────────────────────────────

export function useVinAvailable(vin: string) {
  return useQuery({
    queryKey: ['host', 'vin', vin],
    queryFn: async () => {
      const res = await api.get<VinAvailableResponse>('/host/cars/vin-available', { params: { vin } });
      return res.data;
    },
    enabled: vin.length === 17,
    staleTime: 30_000,
  });
}

// ── Car Drafts ────────────────────────────────────────────────────────────────

export function useCarDrafts() {
  return useQuery({
    queryKey: ['host', 'drafts'],
    queryFn: async () => {
      const res = await api.get<CarDraftDto[]>('/host/cars/drafts');
      return res.data;
    },
  });
}

export function useCarDraft(id: string) {
  return useQuery({
    queryKey: ['host', 'drafts', id],
    queryFn: async () => {
      const res = await api.get<CarDraftDto>(`/host/cars/drafts/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<CarDraftDto>('/host/cars/drafts');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['host', 'drafts'] });
    },
  });
}

export function usePatchDraft(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PatchDraftRequest) => {
      const res = await api.patch<CarDraftDto>(`/host/cars/drafts/${id}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(['host', 'drafts', id], data);
      qc.invalidateQueries({ queryKey: ['host', 'drafts'] });
    },
  });
}

export function useSubmitDraft(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<SubmitDraftResponse>(`/host/cars/drafts/${id}/submit`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['host', 'drafts'] });
      qc.invalidateQueries({ queryKey: ['host', 'cars'] });
    },
  });
}

export function useUploadDraftDocument(draftId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: FormData) => {
      const res = await api.post<{ docId: string; url: string; category: string }>(
        `/host/cars/drafts/${draftId}/documents`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return { documentId: res.data.docId, url: res.data.url, docType: res.data.category };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['host', 'drafts', draftId] });
    },
  });
}

// ── Host Cars ─────────────────────────────────────────────────────────────────

export function useHostCars(status?: string) {
  return useQuery({
    queryKey: ['host', 'cars', status],
    queryFn: async () => {
      const res = await api.get<{ total: number; page: number; items: HostCarListDto[] }>('/host/cars', {
        params: status ? { status } : undefined,
      });
      return res.data.items;
    },
  });
}

export function useSnoozeCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (carId: string) => api.post(`/host/cars/${carId}/snooze`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['host', 'cars'] }),
  });
}

export function useUnsnoozeCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (carId: string) => api.post(`/host/cars/${carId}/unsnooze`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['host', 'cars'] }),
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function useHostDashboard() {
  return useQuery({
    queryKey: ['host', 'dashboard'],
    queryFn: async () => {
      const res = await api.get<HostDashboardDto>('/host/dashboard');
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useHostWallet() {
  return useQuery({
    queryKey: ['host', 'wallet'],
    queryFn: async () => {
      const res = await api.get<AccountBalanceDto>('/host/wallet');
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useHostLedger(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['host', 'wallet', 'ledger', page],
    queryFn: async () => {
      const res = await api.get<PagedResult<LedgerEntryDto>>('/host/wallet/ledger', {
        params: { page, pageSize },
      });
      return res.data;
    },
    staleTime: 30_000,
  });
}
