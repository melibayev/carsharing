import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Step1Data {
  firstName: string;
  lastName: string;
  email: string;
}

export interface Step2Data {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender?: string;
  phoneNumber: string;
  homeAddressLine: string;
  homeCity: string;
  homeRegionId: string;
  homePostalCode?: string;
  homeLat?: number;
  homeLng?: number;
}

export interface Step3Data {
  driverLicensePhotoUrl: string;
  driverLicenseBackUrl: string;
  driverLicenseSelfieUrl: string;
  licenseIssuedCountry?: string;
  licenseIssuedRegionId?: string;
  driverLicenseExpiry: string;
}

export interface Step4Data {
  skipped: boolean;
  documentType?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
}

export interface Step5Data {
  cardholderName: string;
  last4: string;
  brand: string;
  expiry: string;
}

interface OnboardingState {
  step1?: Step1Data;
  step2?: Step2Data;
  step3?: Step3Data;
  step4?: Step4Data;
  step5?: Step5Data;
  lastCompletedStep: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  currentStep: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStepData: <K extends 'step1' | 'step2' | 'step3' | 'step4' | 'step5'>(
    key: K,
    data: OnboardingState[K],
  ) => void;
  completeStep: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      lastCompletedStep: 0,
      currentStep: 1,
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 6) })),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
      setStepData: (key, data) => set({ [key]: data }),
      completeStep: (step) =>
        set((s) => ({
          lastCompletedStep: Math.max(s.lastCompletedStep, step) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        })),
      reset: () =>
        set({
          step1: undefined,
          step2: undefined,
          step3: undefined,
          step4: undefined,
          step5: undefined,
          lastCompletedStep: 0,
          currentStep: 1,
        }),
    }),
    {
      name: 'carsharing-onboarding-v1',
      partialize: (state) => ({
        // NEVER persist card PAN, CVV, license number, passport number
        step1: state.step1,
        step2: state.step2,
        step3: state.step3
          ? {
              driverLicensePhotoUrl: state.step3.driverLicensePhotoUrl,
              driverLicenseBackUrl: state.step3.driverLicenseBackUrl,
              driverLicenseSelfieUrl: state.step3.driverLicenseSelfieUrl,
              licenseIssuedCountry: state.step3.licenseIssuedCountry,
              licenseIssuedRegionId: state.step3.licenseIssuedRegionId,
              driverLicenseExpiry: state.step3.driverLicenseExpiry,
            }
          : undefined,
        step4: state.step4
          ? {
              skipped: state.step4.skipped,
              documentType: state.step4.documentType,
              documentFrontUrl: state.step4.documentFrontUrl,
              documentBackUrl: state.step4.documentBackUrl,
              selfieUrl: state.step4.selfieUrl,
            }
          : undefined,
        // step5: NEVER persisted (card data)
        lastCompletedStep: state.lastCompletedStep,
        currentStep: state.currentStep,
      }),
    },
  ),
);
