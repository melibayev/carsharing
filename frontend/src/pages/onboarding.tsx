import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, User, FileText, CreditCard, Camera, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useAuthStore } from '@/stores/auth-store';
import OnboardingStep1 from '@/components/onboarding/step1-account';
import OnboardingStep2 from '@/components/onboarding/step2-personal';
import OnboardingStep3 from '@/components/onboarding/step3-license';
import OnboardingStep4 from '@/components/onboarding/step4-identity';
import OnboardingStep5 from '@/components/onboarding/step5-payment';

const steps = [
  { id: 1, label: 'Account', icon: User },
  { id: 2, label: 'Personal', icon: FileText },
  { id: 3, label: 'License', icon: Camera },
  { id: 4, label: 'Identity', icon: ShieldCheck },
  { id: 5, label: 'Payment', icon: CreditCard },
];

export default function OnboardingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentStep, setStep } = useOnboardingStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  // Sync step from URL query param
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const parsed = parseInt(stepParam, 10);
      if (parsed >= 1 && parsed <= 5) {
        setStep(parsed);
      }
    }
  }, [searchParams, setStep]);

  // Update URL when step changes
  useEffect(() => {
    const current = searchParams.get('step');
    if (current !== String(currentStep)) {
      setSearchParams({ step: String(currentStep) }, { replace: true });
    }
  }, [currentStep, searchParams, setSearchParams]);

  // Guard: if auth'd and past step 1, allow. If not auth'd, must be step 1.
  useEffect(() => {
    if (!isAuthenticated && currentStep > 1) {
      setStep(1);
    }
  }, [isAuthenticated, currentStep, setStep]);

  const progress = ((currentStep - 1) / 4) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <OnboardingStep1 />;
      case 2:
        return <OnboardingStep2 />;
      case 3:
        return <OnboardingStep3 />;
      case 4:
        return <OnboardingStep4 />;
      case 5:
        return <OnboardingStep5 />;
      default:
        return <OnboardingStep1 />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-4xl py-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-heading font-bold">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Step {currentStep} of 5
            </p>
          </div>

          {/* Horizontal Stepper */}
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : isActive
                            ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span
                      className={`text-xs font-medium hidden sm:block ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] sm:mt-[-0.5rem] ${
                        step.id < currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Step Content */}
      <div className="container max-w-2xl py-8">
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
      </div>
    </div>
  );
}
