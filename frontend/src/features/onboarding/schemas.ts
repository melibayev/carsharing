import { z } from 'zod';

const nameCharset = /^[A-Za-z\s\-']+$/;

export const step1Schema = z
  .object({
    firstName: z
      .string()
      .min(2, 'At least 2 characters')
      .max(50)
      .regex(nameCharset, 'Letters, spaces, hyphens, and apostrophes only'),
    lastName: z
      .string()
      .min(2, 'At least 2 characters')
      .max(50)
      .regex(nameCharset, 'Letters, spaces, hyphens, and apostrophes only'),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Za-z]/, 'Must contain a letter')
      .regex(/\d/, 'Must contain a digit'),
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type Step1FormValues = z.infer<typeof step1Schema>;

export const step2Schema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().optional(),
  phoneNumber: z.string().min(7, 'Valid phone number required'),
  homeAddressLine: z.string().min(1, 'Address is required'),
  homeCity: z.string().min(1, 'City is required'),
  homeRegionId: z.string().min(1, 'Region is required'),
  homePostalCode: z.string().optional(),
  homeLat: z.number().optional(),
  homeLng: z.number().optional(),
});

export type Step2FormValues = z.infer<typeof step2Schema>;

export const step3Schema = z.object({
  driverLicenseNumber: z
    .string()
    .min(5, 'At least 5 characters')
    .max(30)
    .regex(/^[A-Za-z0-9\s\-]+$/, 'Alphanumeric characters only'),
  driverLicenseExpiry: z.string().min(1, 'Expiry date is required'),
  driverLicensePhotoUrl: z.string().min(1, 'License front photo is required'),
  driverLicenseBackUrl: z.string().min(1, 'License back photo is required'),
  driverLicenseSelfieUrl: z.string().min(1, 'Selfie with license is required'),
  licenseIssuedCountry: z.string().optional(),
  licenseIssuedRegionId: z.string().optional(),
});

export type Step3FormValues = z.infer<typeof step3Schema>;

export const step4Schema = z.object({
  skipped: z.boolean(),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  documentFrontUrl: z.string().optional(),
  documentBackUrl: z.string().optional(),
  selfieUrl: z.string().optional(),
});

export type Step4FormValues = z.infer<typeof step4Schema>;

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\s/g, '');
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i] ?? '0', 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export const step5Schema = z.object({
  cardholderName: z
    .string()
    .min(2, 'At least 2 characters')
    .max(50)
    .regex(/^[A-Za-z][A-Za-z\s\-.']+$/, 'Latin letters only'),
  cardNumber: z
    .string()
    .min(13)
    .max(19)
    .regex(/^[\d\s]+$/, 'Digits only')
    .refine((v) => luhnCheck(v), 'Invalid card number'),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Use MM/YY format'),
  cvv: z.string().optional(),
  sameAsBilling: z.boolean(),
  billingAddressJson: z.string().optional(),
});

export type Step5FormValues = z.infer<typeof step5Schema>;

export function getPasswordStrength(password: string): 'weak' | 'fair' | 'strong' {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return 'weak';
  if (score <= 4) return 'fair';
  return 'strong';
}

export function detectCardBrand(number: string): string | null {
  const digits = number.replace(/\s/g, '');
  if (/^8600/.test(digits)) return 'Uzcard';
  if (/^9860/.test(digits)) return 'Humo';
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2(2[2-9]|[3-6]\d|7[01]\d|720)/.test(digits))
    return 'Mastercard';
  return null;
}

export function brandRequiresCvv(brand: string | null): boolean {
  return brand !== 'Uzcard' && brand !== 'Humo';
}
