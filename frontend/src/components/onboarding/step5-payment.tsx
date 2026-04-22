import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useOnboardingStep5 } from '@/hooks/use-onboarding';
import {
  step5Schema,
  type Step5FormValues,
  detectCardBrand,
  brandRequiresCvv,
} from '@/features/onboarding/schemas';

export default function OnboardingStep5() {
  const { setStepData, completeStep, reset } = useOnboardingStore();
  const step5Mutation = useOnboardingStep5();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [isComplete, setIsComplete] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register: field,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step5FormValues>({
    resolver: zodResolver(step5Schema),
    mode: 'onChange',
    defaultValues: {
      cardholderName: '',
      cardNumber: '',
      expiry: '',
      cvv: '',
      sameAsBilling: true,
      billingAddressJson: '',
    },
  });

  const cardNumber = watch('cardNumber');
  const cardholderName = watch('cardholderName');
  const expiry = watch('expiry');
  const detectedBrand = detectCardBrand(cardNumber || '');
  const needsCvv = brandRequiresCvv(detectedBrand);

  // Format card number for display
  const displayNumber = (cardNumber || '').replace(/\s/g, '').padEnd(16, '\u2022');
  const formattedDisplay = displayNumber.match(/.{1,4}/g)?.join(' ') || displayNumber;

  const onSubmit = async (values: Step5FormValues) => {
    setApiError('');
    const digits = values.cardNumber.replace(/\s/g, '');
    const last4 = digits.slice(-4);
    const brand = detectedBrand || 'Unknown';

    if (brandRequiresCvv(brand) && (!values.cvv || !/^\d{3,4}$/.test(values.cvv))) {
      setApiError('CVV is required for Visa/Mastercard');
      return;
    }

    try {
      await step5Mutation.mutateAsync({
        cardholderName: values.cardholderName,
        last4,
        brand,
        expiry: values.expiry,
        billingAddressJson: values.sameAsBilling ? undefined : values.billingAddressJson || undefined,
      });
      setStepData('step5', {
        cardholderName: values.cardholderName,
        last4,
        brand,
        expiry: values.expiry,
      });
      completeStep(6);
      setIsComplete(true);
    } catch {
      setApiError('Failed to save payment method');
    }
  };

  if (isComplete) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-heading font-bold">You're all set!</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Your account is fully verified. Start exploring cars or list your own.
        </p>
        <div className="flex justify-center gap-3 pt-4">
          <Button
            onClick={() => {
              reset();
              navigate(returnTo || '/search');
            }}
          >
            Browse cars
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              navigate('/dashboard');
            }}
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form id="onboarding-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-xl font-medium">Payment method</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add a payment method to complete your setup. You won't be charged now.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Form side */}
        <div className="space-y-4">
          {/* Card brand tabs */}
          <div className="flex gap-2">
            {['Visa', 'Mastercard', 'Uzcard', 'Humo'].map((brand) => (
              <div
                key={brand}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap
                  ${detectedBrand === brand ? 'border-primary bg-primary/5 text-primary' : 'border-muted-foreground/20 text-muted-foreground'}
                `}
              >
                {brand}
              </div>
            ))}
          </div>

          {/* Cardholder name */}
          <div className="space-y-1.5">
            <Label htmlFor="cardholderName">Cardholder name</Label>
            <Input
              id="cardholderName"
              placeholder="JOHN DOE"
              className="h-11 uppercase"
              {...field('cardholderName')}
            />
            {errors.cardholderName && (
              <p className="text-sm text-destructive">{errors.cardholderName.message}</p>
            )}
          </div>

          {/* Card number */}
          <div className="space-y-1.5">
            <Label htmlFor="cardNumber">Card number</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                className="pl-10 h-11"
                maxLength={19}
                {...field('cardNumber')}
                onChange={(e) => {
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

          {/* Expiry + CVV */}
          <div className={`grid gap-4 ${needsCvv ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-1.5">
              <Label htmlFor="expiry">Expiry</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                maxLength={5}
                className="h-11"
                {...field('expiry')}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
                  e.target.value = val.slice(0, 5);
                  field('expiry').onChange(e);
                }}
              />
              {errors.expiry && (
                <p className="text-sm text-destructive">{errors.expiry.message}</p>
              )}
            </div>
            {needsCvv && (
              <div className="space-y-1.5">
                <Label htmlFor="cvv">CVV</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cvv"
                    placeholder="123"
                    maxLength={4}
                    type="password"
                    className="pl-10 h-11"
                    {...field('cvv')}
                  />
                </div>
                {errors.cvv && (
                  <p className="text-sm text-destructive">{errors.cvv.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Billing address toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="rounded" {...field('sameAsBilling')} />
            <span>Billing address same as home address</span>
          </label>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Your card details are handled securely. We only store the last 4 digits.
          </p>
        </div>

        {/* Live card preview */}
        <div className="hidden lg:flex items-start justify-center pt-10">
          <div className="w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6 flex flex-col justify-between shadow-xl">
            <div className="flex justify-between items-start">
              <div className="w-10 h-7 rounded bg-yellow-400/80" />
              <span className="text-sm font-medium opacity-80">
                {detectedBrand || 'Card'}
              </span>
            </div>
            <div
              className="text-lg tracking-[0.2em] font-mono"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {formattedDisplay}
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase opacity-60">Cardholder</p>
                <p className="text-sm font-medium tracking-wide">
                  {cardholderName || 'YOUR NAME'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase opacity-60">Expires</p>
                <p className="text-sm font-medium">{expiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>
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
