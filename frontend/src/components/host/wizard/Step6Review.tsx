import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCarDraft, useSubmitDraft } from '@/hooks/use-host';
import { useListingWizardStore } from '@/stores/listing-wizard-store';
import { Skeleton } from '@/components/ui/skeleton';

export default function Step6Review({ draftId }: { draftId: string }) {
  const navigate = useNavigate();
  const { resetWizard } = useListingWizardStore();
  const { data: draft, isLoading } = useCarDraft(draftId);
  const submit = useSubmitDraft(draftId);

  async function handleSubmit() {
    await submit.mutateAsync();
    resetWizard();
    navigate('/host/cars');
  }

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review & Submit</h2>
      <p className="text-sm text-muted-foreground">
        Review your listing details before submitting for admin approval.
      </p>

      {draft && (
        <Card>
          <CardContent className="pt-6 space-y-3 text-sm">
            <Row label="Make / Model" value={`${draft.make ?? '—'} ${draft.model ?? ''}`} />
            <Row label="Year" value={draft.year} />
            <Row label="VIN" value={draft.vin ?? '—'} />
            <Row label="Color" value={draft.color ?? '—'} />
            <Row label="Daily Rate" value={draft.dailyPriceUzs ? `${new Intl.NumberFormat('uz-UZ').format(draft.dailyPriceUzs)} UZS` : '—'} />
            <Row label="Status" value={draft.currentStep} />
          </CardContent>
        </Card>
      )}

      <div className="bg-muted/40 rounded-lg p-4 text-sm text-muted-foreground">
        After submitting, our team will review your listing within 1–2 business days. You'll receive a notification once it's approved.
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={submit.isPending}
      >
        {submit.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</>
        ) : submit.isSuccess ? (
          <><CheckCircle2 className="h-4 w-4 mr-2" />Submitted!</>
        ) : (
          'Submit for Approval'
        )}
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? '—'}</span>
    </div>
  );
}
