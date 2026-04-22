import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useOnboardingStatus } from '@/hooks/use-onboarding';

interface BookingIntent {
  city: string;
  startDate: string;
  endDate: string;
}

export function useBookingIntent() {
  const [intent, setIntent] = useState<BookingIntent>({
    city: '',
    startDate: '',
    endDate: '',
  });
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const { data: status } = useOnboardingStatus();

  const updateIntent = useCallback((partial: Partial<BookingIntent>) => {
    setIntent((prev) => ({ ...prev, ...partial }));
  }, []);

  const buildSearchUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (intent.city) params.set('city', intent.city);
    if (intent.startDate) params.set('startDate', intent.startDate);
    if (intent.endDate) params.set('endDate', intent.endDate);
    return `/search?${params.toString()}`;
  }, [intent]);

  const submit = useCallback(() => {
    const searchUrl = buildSearchUrl();

    if (!isAuthenticated) {
      navigate(`/register?returnTo=${encodeURIComponent(searchUrl)}`);
      return;
    }

    if (status?.isComplete) {
      navigate(searchUrl);
      return;
    }

    // Determine which onboarding step to resume
    const stepMap: Record<string, number> = {
      Step1Done: 2,
      Step2Done: 3,
      Step3Done: 4,
      Step4Done: 5,
    };
    const resumeStep = status?.status ? stepMap[status.status] ?? 2 : 2;
    navigate(
      `/onboarding?step=${resumeStep}&returnTo=${encodeURIComponent(searchUrl)}`,
    );
  }, [intent, isAuthenticated, status, navigate, buildSearchUrl]);

  const goToOnboarding = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    if (status?.isComplete) {
      navigate('/search');
      return;
    }
    const stepMap: Record<string, number> = {
      Step1Done: 2,
      Step2Done: 3,
      Step3Done: 4,
      Step4Done: 5,
    };
    const resumeStep = status?.status ? stepMap[status.status] ?? 2 : 2;
    navigate(`/onboarding?step=${resumeStep}`);
  }, [isAuthenticated, status, navigate]);

  return { intent, updateIntent, submit, goToOnboarding };
}
