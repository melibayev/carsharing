import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

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

  const updateIntent = useCallback((partial: Partial<BookingIntent>) => {
    setIntent((prev) => ({ ...prev, ...partial }));
  }, []);

  const submit = useCallback(() => {
    const params = new URLSearchParams();
    if (intent.city) params.set('city', intent.city);
    if (intent.startDate) params.set('startDate', intent.startDate);
    if (intent.endDate) params.set('endDate', intent.endDate);
    navigate(`/search?${params.toString()}`);
  }, [intent, navigate]);

  const goToOnboarding = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/onboarding');
    } else {
      navigate('/search');
    }
  }, [isAuthenticated, navigate]);

  return { intent, updateIntent, submit, goToOnboarding };
}
