import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { usePatchDraft, useVinAvailable } from '@/hooks/use-host';
import { useListingWizardStore } from '@/stores/listing-wizard-store';

const schema = z.object({
  make: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  year: z.coerce.number().min(2000).max(new Date().getFullYear() + 1),
  vin: z.string().length(17, 'VIN must be 17 characters'),
  color: z.string().min(1, 'Required'),
  transmission: z.enum(['Manual', 'Automatic']),
  seats: z.coerce.number().min(2).max(12),
});

type FormValues = z.infer<typeof schema>;

export default function Step1VehicleIdentity({ draftId, onNext }: { draftId: string; onNext?: () => void }) {
  const { localData, mergeLocalData } = useListingWizardStore();
  const patch = usePatchDraft(draftId);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      make: localData.make ?? '',
      model: localData.model ?? '',
      year: localData.year ?? new Date().getFullYear(),
      vin: localData.vin ?? '',
      color: localData.color ?? '',
      transmission: (localData.transmission as any) ?? 'Automatic',
      seats: localData.seats ?? 5,
    },
  });

  const vin = watch('vin');
  const { data: vinCheck } = useVinAvailable(vin?.length === 17 ? vin : '');

  async function onSubmit(values: FormValues) {
    await patch.mutateAsync({ ...values, currentStep: 'VehicleIdentity' });
    mergeLocalData(values as any);
    onNext?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">Vehicle Information</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Make</Label>
          <Input {...register('make')} placeholder="Toyota" />
          {errors.make && <p className="text-xs text-destructive">{errors.make.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Model</Label>
          <Input {...register('model')} placeholder="Camry" />
          {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Year</Label>
          <Input type="number" {...register('year')} />
          {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Color</Label>
          <Input {...register('color')} placeholder="White" />
          {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label>VIN</Label>
        <Input
          {...register('vin')}
          placeholder="17-character VIN"
          className={vinCheck?.available === false ? 'border-destructive' : ''}
        />
        {errors.vin && <p className="text-xs text-destructive">{errors.vin.message}</p>}
        {vinCheck?.available === false && (
          <p className="text-xs text-destructive">This VIN is already registered.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Transmission</Label>
          <Select
            defaultValue="Automatic"
            onValueChange={(v) => setValue('transmission', v as 'Manual' | 'Automatic')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Automatic">Automatic</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Seats</Label>
          <Input type="number" {...register('seats')} min={2} max={12} />
        </div>
      </div>

      <Button type="submit" disabled={patch.isPending} className="w-full">
        {patch.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save & Continue
      </Button>
    </form>
  );
}
