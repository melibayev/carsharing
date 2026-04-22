import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CarDraftStep, PatchDraftRequest } from '@/types';

interface ListingWizardState {
  draftId: string | null;
  currentStep: CarDraftStep;
  localData: PatchDraftRequest;
  // Persisted form values by step
  setDraftId: (id: string | null) => void;
  setCurrentStep: (step: CarDraftStep) => void;
  mergeLocalData: (data: PatchDraftRequest) => void;
  resetWizard: () => void;
}

export const WIZARD_STEPS: CarDraftStep[] = [
  'VehicleIdentity',
  'OwnershipDocs',
  'Photos',
  'LocationAvailability',
  'PricingRules',
  'ReviewSubmit',
];

export const WIZARD_STEP_LABELS: Record<CarDraftStep, string> = {
  VehicleIdentity: 'Vehicle Info',
  OwnershipDocs: 'Ownership Docs',
  Photos: 'Photos',
  LocationAvailability: 'Location & Availability',
  PricingRules: 'Pricing & Rules',
  ReviewSubmit: 'Review & Submit',
};

export function nextStep(current: CarDraftStep): CarDraftStep | null {
  const idx = WIZARD_STEPS.indexOf(current);
  return idx < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[idx + 1]! : null;
}

export function prevStep(current: CarDraftStep): CarDraftStep | null {
  const idx = WIZARD_STEPS.indexOf(current);
  return idx > 0 ? WIZARD_STEPS[idx - 1]! : null;
}

export function stepIndex(step: CarDraftStep): number {
  return WIZARD_STEPS.indexOf(step);
}

export const useListingWizardStore = create<ListingWizardState>()(
  persist(
    (set) => ({
      draftId: null,
      currentStep: 'VehicleIdentity',
      localData: {},

      setDraftId: (id) => set({ draftId: id }),
      setCurrentStep: (step) => set({ currentStep: step }),
      mergeLocalData: (data) => set((s) => ({ localData: { ...s.localData, ...data } })),
      resetWizard: () => set({ draftId: null, currentStep: 'VehicleIdentity', localData: {} }),
    }),
    {
      name: 'carsharing-listing-draft',
      partialize: (s) => ({ draftId: s.draftId, currentStep: s.currentStep, localData: s.localData }),
    },
  ),
);
