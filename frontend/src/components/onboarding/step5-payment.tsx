import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useOnboardingStep5 } from '@/hooks/use-onboarding';

const schema = z.object({
  cardNumber: z
    .string()
    .min(13, 'Enter a valid card number')
    .max(19)
    .regex(/^[\d\s]+$/, 'Only digits allowed'),
  expiryDate: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, 'Use MM/YY format'),
  cvv: z
    .string()
    .min(3, 'Enter CVV')
    .max(4)
    .regex(/^\d+$/, 'Only digits'),
  cardBrand: z.string().min(1, 'Select a card brand'),
});

type FormValues = z.infer<typeof schema>;

const cardBrands = [
  { value: 'Visa', label: 'Visa' },
  { value: 'Mastercard', label: 'Mastercard' },
  { value: 'Uzcard', label: 'Uzcard' },
  { value: 'Humo', label: 'Humo' },
];

export default function OnboardingStep5() {
  const { formData, updateForm, prevStep, reset } = useOnboardingStore();
  const step5Mutation = useOnboardingStep5();
  const navigate = useNavigate();
  const [isComplete, setIsComplete] = useState(false);

  const {
    register: field,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardBrand: formData.paymentMethodBrand || '',
    },
  });

  const brandValue = watch('cardBrand');

  const onSubmit = async (values: FormValues) => {
    const last4 = values.cardNumber.replace(/\s/g, '').slice(-4);
    try {
      await step5Mutation.mutateAsync({
        paymentMethodLast4: last4,
        paymentMethodBrand: values.cardBrand,
      });
      updateForm({
        paymentMethodLast4: last4,
        paymentMethodBrand: values.cardBrand,
      });
      setIsComplete(true);
    } catch {
      // Error handled by react-query
    }
  };

  if (isComplete) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-heading font-bold">You're all set!</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your account is fully verified. Start exploring cars or list your own.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button onClick={() => { reset(); navigate('/search'); }}>
              Browse cars
            </Button>
            <Button variant="outline" onClick={() => { reset(); navigate('/dashboard'); }}>
              Go to dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Payment method</CardTitle>
        <CardDescription>
          Add a payment method to complete your setup. You won't be charged now.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card number</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                className="pl-10"
                maxLength={19}
                {...field('cardNumber')}
                onChange={(e) => {
                  // Auto-format with spaces
                  const raw = e.target.value.replace(/\D/g, '');
                  const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                  e.target.value = formatted;
                  field('cardNumber').onChange(e);
                }}
              />
            </div>
            {errors.cardNumber && (
              <p className="text-sm text-destructive">{errors.cardNumber.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry</Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                maxLength={5}
                {...field('expiryDate')}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
                  e.target.value = val.slice(0, 5);
                  field('expiryDate').onChange(e);
                }}
              />
              {errors.expiryDate && (
                <p className="text-sm text-destructive">{errors.expiryDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                maxLength={4}
                type="password"
                {...field('cvv')}
              />
              {errors.cvv && (
                <p className="text-sm text-destructive">{errors.cvv.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Card brand</Label>
              <Select
                value={brandValue}
                onValueChange={(v) => setValue('cardBrand', v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  {cardBrands.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cardBrand && (
                <p className="text-sm text-destructive">{errors.cardBrand.message}</p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Your card details are handled securely. We only store the last 4 digits and card brand.
          </p>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting || step5Mutation.isPending}>
              {isSubmitting ? 'Processing...' : 'Complete setup'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
