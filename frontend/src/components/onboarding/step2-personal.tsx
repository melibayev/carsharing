import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useOnboardingStep2 } from '@/hooks/use-onboarding';
import { REGIONS } from '@/lib/regions';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  phoneNumber: z.string().min(7, 'Valid phone number required'),
  addressLine1: z.string().min(1, 'Address is required'),
  addressCity: z.string().min(1, 'City is required'),
  addressRegion: z.string().min(1, 'Region is required'),
  addressPostalCode: z.string().min(1, 'Postal code is required'),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingStep2() {
  const { formData, updateForm, nextStep, prevStep } = useOnboardingStore();
  const step2Mutation = useOnboardingStep2();

  const {
    register: field,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName || '',
      dateOfBirth: formData.dateOfBirth,
      phoneNumber: formData.phoneNumber,
      addressLine1: formData.addressLine1,
      addressCity: formData.addressCity,
      addressRegion: formData.addressRegion,
      addressPostalCode: formData.addressPostalCode,
    },
  });

  const regionValue = watch('addressRegion');

  const onSubmit = async (values: FormValues) => {
    try {
      await step2Mutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName || undefined,
        dateOfBirth: values.dateOfBirth,
        phoneNumber: values.phoneNumber,
        addressLine1: values.addressLine1,
        addressCity: values.addressCity,
        addressRegion: values.addressRegion,
        addressPostalCode: values.addressPostalCode,
      });
      updateForm(values);
      nextStep();
    } catch {
      // Error handled by react-query
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Personal details</CardTitle>
        <CardDescription>
          Tell us a bit more about yourself
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...field('firstName')} />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle name</Label>
              <Input id="middleName" placeholder="Optional" {...field('middleName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...field('lastName')} />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="dateOfBirth" type="date" className="pl-10" {...field('dateOfBirth')} />
              </div>
              {errors.dateOfBirth && (
                <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phoneNumber" type="tel" placeholder="+998 90 123 4567" className="pl-10" {...field('phoneNumber')} />
              </div>
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="addressLine1" placeholder="Street address" className="pl-10" {...field('addressLine1')} />
            </div>
            {errors.addressLine1 && (
              <p className="text-sm text-destructive">{errors.addressLine1.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressCity">City</Label>
              <Input id="addressCity" {...field('addressCity')} />
              {errors.addressCity && (
                <p className="text-sm text-destructive">{errors.addressCity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select
                value={regionValue}
                onValueChange={(v) => setValue('addressRegion', v, { shouldValidate: true })}
              >
                <SelectTrigger>
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
              {errors.addressRegion && (
                <p className="text-sm text-destructive">{errors.addressRegion.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressPostalCode">Postal code</Label>
              <Input id="addressPostalCode" {...field('addressPostalCode')} />
              {errors.addressPostalCode && (
                <p className="text-sm text-destructive">{errors.addressPostalCode.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting || step2Mutation.isPending}>
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
