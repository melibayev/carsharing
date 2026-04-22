import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, User, FileText, Camera, ShieldCheck, CreditCard, MailCheck, Menu } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding-store';

const steps = [
  { id: 1, label: 'Account', icon: User },
  { id: 2, label: 'Verify email', icon: MailCheck },
  { id: 3, label: 'Personal details', icon: FileText },
  { id: 4, label: 'License', icon: Camera },
  { id: 5, label: 'Identity', icon: ShieldCheck },
  { id: 6, label: 'Payment', icon: CreditCard },
] as const;

interface OnboardingLayoutProps {
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  showBack?: boolean;
  showSaveExit?: boolean;
}

export default function OnboardingLayout({
  children,
  onBack,
  onContinue,
  continueDisabled = false,
  continueLabel,
  showBack = true,
  showSaveExit = true,
}: OnboardingLayoutProps) {
  const { currentStep, lastCompletedStep } = useOnboardingStore();
  const navigate = useNavigate();
  const [mobileStepperOpen, setMobileStepperOpen] = useState(false);

  const progress = ((currentStep - 1) / 5) * 100;
  const currentStepDef = steps[currentStep - 1];
  const buttonText = continueLabel ?? (currentStep === 1 ? 'Create account' : currentStep === 6 ? 'Finish' : 'Continue');

  const handleStepClick = (_stepId: number) => {
    // Step navigation disabled — users must complete steps in order
  };

  const handleSaveAndExit = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
        <Link to="/" className="font-heading font-bold text-lg">
          CarSharing
        </Link>
        <button
          onClick={handleSaveAndExit}
          className={`text-sm transition-colors ${
            showSaveExit
              ? 'text-muted-foreground hover:text-foreground'
              : 'invisible pointer-events-none'
          }`}
        >
          Save and exit
        </button>
      </div>

      {/* Mobile stepper */}
      <div className="sm:hidden border-b bg-card px-4 py-3 space-y-2">
        <button
          onClick={() => setMobileStepperOpen(!mobileStepperOpen)}
          className="flex items-center justify-between w-full text-sm"
        >
          <span className="text-muted-foreground">
            Step {currentStep} of 6 — {currentStepDef?.label}
          </span>
          <Menu className="h-4 w-4 text-muted-foreground" />
        </button>
        <Progress value={progress} className="h-1" />
        {mobileStepperOpen && (
          <div className="pt-2 space-y-1.5">
            {steps.map((step) => {
              const isCompleted = step.id <= lastCompletedStep;
              const isActive = step.id === currentStep;
              return (
                <button
                  key={step.id}
                  disabled
                  className={`flex items-center gap-3 w-full text-left px-2 py-1.5 rounded-md text-sm
                    ${isActive ? 'bg-accent/10 text-foreground' : 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0
                      ${isCompleted ? 'bg-foreground text-background' : isActive ? 'border-2 border-accent text-accent' : 'border border-muted-foreground/30 text-muted-foreground'}
                    `}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.id}
                  </div>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left rail (desktop) */}
        <aside className="hidden sm:flex w-64 border-r bg-card p-6 flex-col gap-6 shrink-0">
          <nav className="space-y-1">
            {steps.map((step, idx) => {
              const isCompleted = step.id <= lastCompletedStep;
              const isActive = step.id === currentStep;
              const Icon = step.icon;

              return (
                <div key={step.id}>
                  <button
                    disabled
                    className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm
                      ${isActive ? 'bg-accent/10' : 'opacity-50 cursor-not-allowed'}
                    `}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 transition-colors
                        ${isCompleted ? 'bg-foreground text-background' : isActive ? 'border-2 border-accent text-accent' : 'border border-muted-foreground/30 text-muted-foreground'}
                      `}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span
                      className={`
                        ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}
                      `}
                    >
                      {step.label}
                    </span>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className="ml-[22px] w-px h-4 my-0.5">
                      <div
                        className={`w-full h-full ${step.id <= lastCompletedStep ? 'bg-foreground' : 'bg-muted-foreground/20'}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
        </main>
      </div>

      {/* Sticky bottom bar */}
      <div className="border-t bg-card px-4 md:px-6 py-3 flex items-center justify-between shrink-0 sticky bottom-0 z-10">
        <div>
          {showBack && currentStep > 1 && onBack && (
            <Button variant="ghost" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
        <span className="hidden md:block text-sm text-muted-foreground">
          Step {currentStep} of 6
        </span>
        <div>
          {onContinue && (
            <Button onClick={onContinue} disabled={continueDisabled}>
              {buttonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
