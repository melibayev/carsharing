import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, MapPin, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useOnboardingStep2 } from '@/hooks/use-onboarding';
import { REGIONS } from '@/lib/regions';
import { step2Schema, type Step2FormValues } from '@/features/onboarding/schemas';

export default function OnboardingStep2() {
  const { step1, step2, setStepData, completeStep, nextStep } = useOnboardingStore();
  const step2Mutation = useOnboardingStep2();
  const [apiError, setApiError] = useState('');

  const {
    register: field,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    mode: 'onTouched',
    defaultValues: {
      firstName: step2?.firstName ?? step1?.firstName ?? '',
      lastName: step2?.lastName ?? step1?.lastName ?? '',
      middleName: step2?.middleName ?? '',
      dateOfBirth: step2?.dateOfBirth ?? '',
      gender: step2?.gender ?? '',
      phoneNumber: step2?.phoneNumber ?? '',
      homeAddressLine: step2?.homeAddressLine ?? '',
      homeCity: step2?.homeCity ?? '',
      homeRegionId: step2?.homeRegionId ?? '',
      homePostalCode: step2?.homePostalCode ?? '',
    },
  });

  const regionValue = watch('homeRegionId');
  const genderValue = watch('gender');

  const onSubmit = async (values: Step2FormValues) => {
    setApiError('');

    // 21+ age validation
    if (values.dateOfBirth) {
      const birth = new Date(values.dateOfBirth);
      const age = Math.floor(
        (Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      );
      if (age < 21) {
        setApiError('You must be at least 21 years old');
        return;
      }
    }

    try {
      await step2Mutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName || undefined,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender || undefined,
        phoneNumber: values.phoneNumber,
        homeAddressLine: values.homeAddressLine,
        homeCity: values.homeCity,
        homeRegionId: values.homeRegionId,
        homePostalCode: values.homePostalCode || undefined,
      });
      setStepData('step2', values);
      completeStep(3);
      nextStep();
    } catch {
      setApiError('Failed to save personal details');
    }
  };

  return (
    <form id="onboarding-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-xl font-medium">Personal details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us a bit more about yourself
        </p>
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" {...field('firstName')} />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="middleName">Middle name</Label>
          <Input id="middleName" placeholder="Optional" {...field('middleName')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" {...field('lastName')} />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Gender radio */}
      <div className="space-y-1.5">
        <Label>Gender (optional)</Label>
        <div className="flex gap-4">
          {['Male', 'Female'].map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                value={g}
                checked={genderValue === g}
                onChange={() => setValue('gender', g, { shouldValidate: true })}
                className="accent-primary"
              />
              {g}
            </label>
          ))}
        </div>
      </div>

      {/* Date of birth + Phone */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="dateOfBirth" type="date" className="pl-10 h-11" {...field('dateOfBirth')} />
          </div>
          {errors.dateOfBirth && (
            <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phoneNumber">Phone number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+998 90 123 4567"
              className="pl-10 h-11"
              {...field('phoneNumber')}
            />
          </div>
          {errors.phoneNumber && (
            <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
          )}
        </div>
      </div>

      {/* Home address */}
      <div className="space-y-1.5">
        <Label htmlFor="homeAddressLine">Home address</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="homeAddressLine"
            placeholder="Street address"
            className="pl-10 h-11"
            {...field('homeAddressLine')}
          />
        </div>
        {errors.homeAddressLine && (
          <p className="text-sm text-destructive">{errors.homeAddressLine.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="homeCity">City</Label>
          <Input id="homeCity" {...field('homeCity')} />
          {errors.homeCity && (
            <p className="text-sm text-destructive">{errors.homeCity.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Region</Label>
          <Select
            value={regionValue}
            onValueChange={(v) => setValue('homeRegionId', v, { shouldValidate: true })}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r.code} value={r.code}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.homeRegionId && (
            <p className="text-sm text-destructive">{errors.homeRegionId.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="homePostalCode">Postal code</Label>
          <Input id="homePostalCode" placeholder="Optional" {...field('homePostalCode')} />
        </div>
      </div>

      {apiError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          {apiError}
        </p>
      )}
    </form>
  );
}
