import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePatchDraft } from '@/hooks/use-host';
import { useListingWizardStore } from '@/stores/listing-wizard-store';

const schema = z.object({
  dailyPriceUzs: z.coerce.number().min(50000, 'Minimum 50,000 UZS'),
  securityDepositUzs: z.coerce.number().min(0),
  dailyKmLimit: z.coerce.number().min(0),
  extraKmFeeUzs: z.coerce.number().min(0),
  rules: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Step5Pricing({ draftId, onNext }: { draftId: string; onNext?: () => void }) {
  const { localData, mergeLocalData } = useListingWizardStore();
  const patch = usePatchDraft(draftId);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dailyPriceUzs: (localData as any).dailyPriceUzs ?? '',
      securityDepositUzs: (localData as any).securityDepositUzs ?? 0,
      dailyKmLimit: (localData as any).dailyKmLimit ?? 300,
      extraKmFeeUzs: (localData as any).extraKmFeeUzs ?? 0,
      rules: (localData as any).rules ?? '',
    },
  });

  async function onSubmit(values: FormValues) {
    await patch.mutateAsync({ ...values, currentStep: 'PricingRules' } as any);
    mergeLocalData(values as any);
    onNext?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">Pricing & Rules</h2>

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
          <Label>Mileage Limit / Day (km)</Label>
          <Input type="number" {...register('dailyKmLimit')} />
          <p className="text-xs text-muted-foreground">0 = unlimited</p>
        </div>
        <div className="space-y-1">
          <Label>Extra Mileage Fee (UZS/km)</Label>
          <Input type="number" {...register('extraKmFeeUzs')} placeholder="0" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>House Rules (optional)</Label>
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
