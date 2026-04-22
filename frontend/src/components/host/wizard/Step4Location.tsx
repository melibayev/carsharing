import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePatchDraft } from '@/hooks/use-host';
import { useListingWizardStore } from '@/stores/listing-wizard-store';

const schema = z.object({
  privacyRadiusMeters: z.coerce.number().min(200).max(5000),
  canDeliverToAirports: z.boolean(),
  selfCheckInAvailable: z.boolean(),
  gpsTrackerInstalled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function Step4Location({ draftId, onNext }: { draftId: string; onNext?: () => void }) {
  const { localData, mergeLocalData } = useListingWizardStore();
  const patch = usePatchDraft(draftId);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      privacyRadiusMeters: (localData as any).privacyRadiusMeters ?? 500,
      canDeliverToAirports: (localData as any).canDeliverToAirports ?? false,
      selfCheckInAvailable: (localData as any).selfCheckInAvailable ?? false,
      gpsTrackerInstalled: (localData as any).gpsTrackerInstalled ?? false,
    },
  });

  const canDeliver = watch('canDeliverToAirports');
  const selfCheckIn = watch('selfCheckInAvailable');
  const gps = watch('gpsTrackerInstalled');

  async function onSubmit(values: FormValues) {
    await patch.mutateAsync({ ...values, currentStep: 'LocationAvailability' } as any);
    mergeLocalData(values as any);
    onNext?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-semibold">Location & Availability</h2>

      <div className="space-y-1">
        <Label>Privacy Radius (meters)</Label>
        <Input type="number" {...register('privacyRadiusMeters')} />
        <p className="text-xs text-muted-foreground">
          Your exact address is hidden; an approximate zone is shown to renters.
        </p>
        {errors.privacyRadiusMeters && (
          <p className="text-xs text-destructive">{errors.privacyRadiusMeters.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Airport Delivery</p>
            <p className="text-xs text-muted-foreground">Offer delivery to Tashkent airports</p>
          </div>
          <Switch checked={canDeliver} onCheckedChange={(v) => setValue('canDeliverToAirports', v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Self Check-in</p>
            <p className="text-xs text-muted-foreground">Renter picks up without meeting you</p>
          </div>
          <Switch checked={selfCheckIn} onCheckedChange={(v) => setValue('selfCheckInAvailable', v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">GPS Tracker Installed</p>
            <p className="text-xs text-muted-foreground">Increases trust and may improve tier</p>
          </div>
          <Switch checked={gps} onCheckedChange={(v) => setValue('gpsTrackerInstalled', v)} />
        </div>
      </div>

      <Button type="submit" disabled={patch.isPending} className="w-full">
        {patch.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save & Continue
      </Button>
    </form>
  );
}
