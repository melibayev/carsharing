import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { usePatchDraft } from '@/hooks/use-host';
import { useAvailableFeatures } from '@/hooks/use-host';
import { useListingWizardStore } from '@/stores/listing-wizard-store';

const schema = z.object({
  dailyPriceUzs: z.coerce.number().min(50000, 'Minimum 50,000 UZS'),
  securityDepositUzs: z.coerce.number().min(0),
  cleaningFeeUzs: z.coerce.number().min(0),
  weeklyDiscountPercent: z.coerce.number().min(0).max(50),
  monthlyDiscountPercent: z.coerce.number().min(0).max(70),
  // Trip settings
  minTripDays: z.coerce.number().min(1).max(30),
  maxTripDays: z.coerce.number().min(1).max(90),
  advanceNoticeHours: z.coerce.number().min(0).max(168),
  isInstantBook: z.boolean(),
  // Mileage
  dailyKmLimit: z.coerce.number().min(0),
  extraKmFeeUzs: z.coerce.number().min(0),
  // Condition
  odometerKm: z.coerce.number().min(0),
  // Details
  description: z.string().optional(),
  rules: z.string().optional(),
  features: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Step5Pricing({ draftId, onNext }: { draftId: string; onNext?: () => void }) {
  const { localData, mergeLocalData } = useListingWizardStore();
  const patch = usePatchDraft(draftId);
  const { data: availableFeatures = [] } = useAvailableFeatures();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dailyPriceUzs: (localData as any).dailyPriceUzs ?? '',
      securityDepositUzs: (localData as any).securityDepositUzs ?? 0,
      cleaningFeeUzs: (localData as any).cleaningFeeUzs ?? 0,
      weeklyDiscountPercent: (localData as any).weeklyDiscountPercent ?? 0,
      monthlyDiscountPercent: (localData as any).monthlyDiscountPercent ?? 0,
      minTripDays: (localData as any).minTripDays ?? 1,
      maxTripDays: (localData as any).maxTripDays ?? 30,
      advanceNoticeHours: (localData as any).advanceNoticeHours ?? 4,
      isInstantBook: (localData as any).isInstantBook ?? true,
      dailyKmLimit: (localData as any).dailyKmLimit ?? 300,
      extraKmFeeUzs: (localData as any).extraKmFeeUzs ?? 0,
      odometerKm: (localData as any).odometerKm ?? 0,
      description: (localData as any).description ?? '',
      rules: (localData as any).rules ?? '',
      features: (localData as any).features ?? [],
    },
  });

  const selectedFeatures = watch('features') ?? [];
  const isInstantBook = watch('isInstantBook');

  function toggleFeature(name: string) {
    const next = selectedFeatures.includes(name)
      ? selectedFeatures.filter((f) => f !== name)
      : [...selectedFeatures, name];
    setValue('features', next);
  }

  async function onSubmit(values: FormValues) {
    await patch.mutateAsync({ ...values, currentStep: 'PricingRules', features: values.features ?? [] } as any);
    mergeLocalData(values as any);
    onNext?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-semibold">Pricing & Details</h2>

      {/* Pricing */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pricing</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Daily Rate (UZS)</Label>
            <Input type="number" {...register('dailyPriceUzs')} placeholder="200000" />
            {errors.dailyPriceUzs && <p className="text-xs text-destructive">{errors.dailyPriceUzs.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Security Deposit (UZS)</Label>
            <Input type="number" {...register('securityDepositUzs')} placeholder="0" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Cleaning Fee (UZS)</Label>
            <Input type="number" {...register('cleaningFeeUzs')} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label>Weekly Discount (%)</Label>
            <Input type="number" {...register('weeklyDiscountPercent')} min={0} max={50} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Monthly Discount (%)</Label>
            <Input type="number" {...register('monthlyDiscountPercent')} min={0} max={70} />
          </div>
        </div>
      </div>

      {/* Trip Settings */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Trip Settings</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Min Trip Days</Label>
            <Input type="number" {...register('minTripDays')} min={1} max={30} />
          </div>
          <div className="space-y-1">
            <Label>Max Trip Days</Label>
            <Input type="number" {...register('maxTripDays')} min={1} max={90} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Advance Notice (hours)</Label>
            <Input type="number" {...register('advanceNoticeHours')} min={0} max={168} />
            <p className="text-xs text-muted-foreground">How far in advance renters must book</p>
          </div>
          <div className="space-y-1">
            <Label>Mileage Limit / Day (km)</Label>
            <Input type="number" {...register('dailyKmLimit')} />
            <p className="text-xs text-muted-foreground">0 = unlimited</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Extra Mileage Fee (UZS/km)</Label>
            <Input type="number" {...register('extraKmFeeUzs')} placeholder="0" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-sm font-medium">Instant Book</p>
            <p className="text-xs text-muted-foreground">Allow renters to book without approval</p>
          </div>
          <Switch
            checked={isInstantBook}
            onCheckedChange={(v) => setValue('isInstantBook', v)}
          />
        </div>
      </div>

      {/* Condition */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Condition</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Odometer (km)</Label>
            <Input type="number" {...register('odometerKm')} min={0} />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea
          {...register('description')}
          placeholder="Tell guests what makes this car special — comfort, performance, ideal use cases…"
          rows={4}
        />
      </div>

      {/* Features */}
      {availableFeatures.length > 0 && (
        <div className="space-y-3">
          <Label>Features & Amenities <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <div className="grid grid-cols-2 gap-2">
            {availableFeatures.map((name) => {
              const checked = selectedFeatures.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleFeature(name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                    checked
                      ? 'bg-primary/10 border-primary text-primary font-medium'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  <span className={`flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center ${checked ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                    {checked && <Check className="h-3 w-3 text-white" />}
                  </span>
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rules */}
      <div className="space-y-1">
        <Label>House Rules <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea
          {...register('rules')}
          placeholder="No smoking, no pets, return with full tank…"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={patch.isPending} className="w-full">
        {patch.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save & Continue
      </Button>
    </form>
  );
}
