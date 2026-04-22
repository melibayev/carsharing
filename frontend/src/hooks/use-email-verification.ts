import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface EmailVerifyStatusDto {
  emailConfirmed: boolean;
  lastCodeSentAt: string | null;
  nextResendAllowedAt: string | null;
}

interface SendCodeResponse {
  expiresInSeconds: number;
}

export function useEmailStatus() {
  return useQuery<EmailVerifyStatusDto>({
    queryKey: ['email-verify-status'],
    queryFn: async () => {
      const res = await api.get<EmailVerifyStatusDto>('/auth/email/status');
      return res.data;
    },
  });
}

export function useSendCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<SendCodeResponse>('/auth/email/send-code');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-verify-status'] });
    },
  });
}

export function useVerifyCode() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (code: string) => {
      await api.post('/auth/email/verify-code', { code });
    },
    onSuccess: () => {
      // Immediately update the auth store so guards see emailConfirmed=true
      if (user) setUser({ ...user, emailConfirmed: true });
      queryClient.invalidateQueries({ queryKey: ['email-verify-status'] });
    },
  });
}
