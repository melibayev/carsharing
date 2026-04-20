import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  OnboardingStatusDto,
  OnboardingStep2Request,
  OnboardingStep3Request,
  OnboardingStep4Request,
  OnboardingStep5Request,
  DocumentUploadResponse,
  EmailAvailableResponse,
} from '@/types';

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: async () => {
      const res = await api.get<OnboardingStatusDto>('/onboarding/status');
      return res.data;
    },
  });
}

export function useOnboardingStep2() {
  return useMutation({
    mutationFn: async (data: OnboardingStep2Request) => {
      const res = await api.patch<OnboardingStatusDto>('/onboarding/step2', data);
      return res.data;
    },
  });
}

export function useOnboardingStep3() {
  return useMutation({
    mutationFn: async (data: OnboardingStep3Request) => {
      const res = await api.patch<OnboardingStatusDto>('/onboarding/step3', data);
      return res.data;
    },
  });
}

export function useOnboardingStep4() {
  return useMutation({
    mutationFn: async (data: OnboardingStep4Request) => {
      const res = await api.patch<OnboardingStatusDto>('/onboarding/step4', data);
      return res.data;
    },
  });
}

export function useOnboardingStep5() {
  return useMutation({
    mutationFn: async (data: OnboardingStep5Request) => {
      const res = await api.patch<OnboardingStatusDto>('/onboarding/step5', data);
      return res.data;
    },
  });
}

export function useDocumentUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<DocumentUploadResponse>(
        '/onboarding/documents/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return res.data;
    },
  });
}

export function useCheckEmailAvailable() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.get<EmailAvailableResponse>(
        `/onboarding/email-available?email=${encodeURIComponent(email)}`
      );
      return res.data;
    },
  });
}
