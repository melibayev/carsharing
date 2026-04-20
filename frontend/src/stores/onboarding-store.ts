import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingFormData {
  // Step 1 - Account
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  // Step 2 - Personal
  middleName: string;
  dateOfBirth: string;
  phoneNumber: string;
  addressLine1: string;
  addressCity: string;
  addressRegion: string;
  addressPostalCode: string;
  // Step 3 - License
  driverLicenseNumber: string;
  driverLicenseExpiry: string;
  driverLicensePhotoUrl: string;
  // Step 4 - ID
  nationalIdNumber: string;
  nationalIdFrontUrl: string;
  nationalIdBackUrl: string;
  selfieUrl: string;
  // Step 5 - Payment
  paymentMethodLast4: string;
  paymentMethodBrand: string;
}

interface OnboardingState {
  currentStep: number;
  formData: OnboardingFormData;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateForm: (data: Partial<OnboardingFormData>) => void;
  reset: () => void;
}

const initialFormData: OnboardingFormData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  middleName: '',
  dateOfBirth: '',
  phoneNumber: '',
  addressLine1: '',
  addressCity: '',
  addressRegion: '',
  addressPostalCode: '',
  driverLicenseNumber: '',
  driverLicenseExpiry: '',
  driverLicensePhotoUrl: '',
  nationalIdNumber: '',
  nationalIdFrontUrl: '',
  nationalIdBackUrl: '',
  selfieUrl: '',
  paymentMethodLast4: '',
  paymentMethodBrand: '',
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      formData: { ...initialFormData },
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 5) })),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
      updateForm: (data) =>
        set((s) => ({ formData: { ...s.formData, ...data } })),
      reset: () => set({ currentStep: 1, formData: { ...initialFormData } }),
    }),
    {
      name: 'carsharing-onboarding',
      partialize: (state) => ({
        currentStep: state.currentStep,
        formData: state.formData,
      }),
    },
  ),
);
