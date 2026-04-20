import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { KycVerificationDto } from '@/types';

export function useKycStatus() {
  return useQuery({
    queryKey: ['kyc', 'status'],
    queryFn: async () => {
      const res = await api.get<KycVerificationDto>('/kyc/status');
      return res.data;
    },
    retry: false,
  });
}

export function useSubmitKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post<KycVerificationDto>('/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
    },
  });
}
