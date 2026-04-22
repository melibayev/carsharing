import { useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useAuthStore } from '@/stores/auth-store';
import OnboardingLayout from '@/features/onboarding/OnboardingLayout';
import OnboardingStep2 from '@/components/onboarding/step2-personal';
import OnboardingStep3 from '@/components/onboarding/step3-license';
import OnboardingStep4 from '@/components/onboarding/step4-identity';
import OnboardingStep5 from '@/components/onboarding/step5-payment';

export default function OnboardingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentStep, setStep, lastCompletedStep, prevStep } = useOnboardingStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const hasInitialized = useRef(false);

  // Sync step from URL query param only on mount / URL change
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const parsed = parseInt(stepParam, 10);
      if (parsed >= 3 && parsed <= 6) {
        const maxAllowed = Math.min(parsed, lastCompletedStep + 1);
        setStep(Math.max(3, maxAllowed));
      }
    } else if (!hasInitialized.current) {
      setStep(3);
    }
    hasInitialized.current = true;
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep URL in sync with current step
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (String(currentStep) !== stepParam) {
      setSearchParams({ step: String(currentStep) }, { replace: true });
    }
  }, [currentStep, setSearchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect unauthenticated users to /register
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/register', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Guard: unverified users cannot access steps 3+
  useEffect(() => {
    if (isAuthenticated && user && !user.emailConfirmed) {
      navigate('/onboarding/verify-email', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleContinue = useCallback(() => {
    const form = document.getElementById('onboarding-step-form') as HTMLFormElement | null;
    if (form) {
      form.requestSubmit();
    }
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep <= 3) return;
    prevStep();
  }, [currentStep, prevStep]);

  const continueLabel = currentStep === 6 ? 'Complete setup' : 'Continue';

  const renderStep = () => {
    switch (currentStep) {
      case 3:
        return <OnboardingStep2 />;
      case 4:
        return <OnboardingStep3 />;
      case 5:
        return <OnboardingStep4 />;
      case 6:
        return <OnboardingStep5 />;
      default:
        return <OnboardingStep2 />;
    }
  };

  return (
    <OnboardingLayout
      onContinue={handleContinue}
      onBack={handleBack}
      showBack={currentStep > 3}
      continueLabel={continueLabel}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  );
}
