import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useListingWizardStore, WIZARD_STEP_LABELS, WIZARD_STEPS, nextStep as nextStepFn, prevStep as prevStepFn } from '@/stores/listing-wizard-store';
import { useCreateDraft } from '@/hooks/use-host';
import WizardStep1VehicleIdentity from '@/components/host/wizard/Step1VehicleIdentity';
import WizardStep2OwnershipDocs from '@/components/host/wizard/Step2OwnershipDocs';
import WizardStep3Photos from '@/components/host/wizard/Step3Photos';
import WizardStep4Location from '@/components/host/wizard/Step4Location';
import WizardStep5Pricing from '@/components/host/wizard/Step5Pricing';
import WizardStep6Review from '@/components/host/wizard/Step6Review';

const STEP_COMPONENTS = [
  WizardStep1VehicleIdentity,
  WizardStep2OwnershipDocs,
  WizardStep3Photos,
  WizardStep4Location,
  WizardStep5Pricing,
  WizardStep6Review,
];

export default function HostNewCar() {
  const navigate = useNavigate();
  const { draftId, currentStep, setDraftId, setCurrentStep, resetWizard } = useListingWizardStore();
  const nextStep = () => { const s = nextStepFn(currentStep); if (s) setCurrentStep(s); };
  const prevStep = () => { const s = prevStepFn(currentStep); if (s) setCurrentStep(s); };
  const createDraft = useCreateDraft();

  useEffect(() => {
    resetWizard(); // always start fresh — clears stale localStorage state
    createDraft.mutateAsync()
      .then((draft) => setDraftId(draft.id))
      .catch(() => { /* error shown via createDraft.isError */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepIndex = WIZARD_STEPS.indexOf(currentStep);
  const StepComponent = STEP_COMPONENTS[stepIndex] as React.ComponentType<{ draftId: string; onNext?: () => void }> | undefined;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === WIZARD_STEPS.length - 1;

  if (!draftId) {
    if (createDraft.isError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <p className="text-muted-foreground">
            Could not start a new listing. Please make sure you have completed host setup.
          </p>
          <Button variant="outline" onClick={() => navigate('/host/become-a-host')}>
            Complete Host Setup
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
          onClick={() => navigate('/host/cars')}
        >
          <ChevronLeft className="h-4 w-4" />
          My Cars
        </button>
        <h1 className="text-2xl font-bold">List a Car</h1>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {stepIndex + 1} of {WIZARD_STEPS.length}</span>
          <span>{WIZARD_STEP_LABELS[currentStep]}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-80">
        {draftId && StepComponent && <StepComponent draftId={draftId} onNext={isLast ? undefined : nextStep} />}
      </div>

      {/* Navigation — Back only; each step's own button handles Save & Continue */}
      {!isFirst && (
        <div className="pt-4 border-t">
          <Button variant="ghost" onClick={prevStep}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
