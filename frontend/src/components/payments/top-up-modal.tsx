import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTopUpIntent, useConfirmTopUp } from '@/hooks/use-payments';
import { formatUzs } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  required?: number;
  onConfirmed?: () => void;
}

type Step = 'amount' | 'otp';

const PRESETS = [50_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

export default function TopUpModal({ open, onOpenChange, required, onConfirmed }: Props) {
  const { toast } = useToast();
  const intentMutation = useCreateTopUpIntent();
  const confirmMutation = useConfirmTopUp();

  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState(required ? Math.max(50_000, Math.ceil(required / 1000) * 1000) : 200_000);
  const [customAmount, setCustomAmount] = useState('');
  const [intentId, setIntentId] = useState('');
  const [phoneHint, setPhoneHint] = useState('');
  const [otp, setOtp] = useState('');

  const reset = () => {
    setStep('amount');
    setOtp('');
    setIntentId('');
    setPhoneHint('');
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const selectedAmount = customAmount ? parseInt(customAmount.replace(/\D/g, ''), 10) || 0 : amount;

  const handleSubmitAmount = async () => {
    if (selectedAmount < 50_000) {
      toast({ title: 'Minimum top-up is 50,000 UZS.', variant: 'destructive' });
      return;
    }
    if (selectedAmount > 50_000_000) {
      toast({ title: 'Maximum top-up is 50,000,000 UZS.', variant: 'destructive' });
      return;
    }

    try {
      const res = await intentMutation.mutateAsync({ amountUzs: selectedAmount });
      setIntentId(res.intentId);
      setPhoneHint(res.phoneHint);
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Error', description: msg ?? 'Please try again.', variant: 'destructive' });
    }
  };

  const handleConfirm = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Enter the 6-digit code.', variant: 'destructive' });
      return;
    }
    try {
      await confirmMutation.mutateAsync({ intentId, code: otp });
      toast({ title: `${formatUzs(selectedAmount)} added to your wallet.` });
      reset();
      onConfirmed?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Invalid code', description: msg ?? 'Try again.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{step === 'amount' ? 'Top up wallet' : 'Verify top-up'}</DialogTitle>
          <DialogDescription>
            {step === 'amount'
              ? required
                ? `You need at least ${formatUzs(required)} more to complete the booking.`
                : 'Add funds to your wallet.'
              : `Enter the 6-digit code sent to ${phoneHint}.`}
          </DialogDescription>
        </DialogHeader>

        {step === 'amount' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setAmount(p); setCustomAmount(''); }}
                  className={`text-xs py-2 px-1 rounded-md border transition-colors ${
                    !customAmount && amount === p
                      ? 'border-primary bg-primary/10 font-semibold'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {(p / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <Label>Custom amount (UZS)</Label>
              <Input
                inputMode="numeric"
                placeholder="e.g. 300000"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <p className="text-sm font-medium text-right">
              Amount: {formatUzs(selectedAmount)}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Verification code</Label>
              <Input
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          {step === 'amount' ? (
            <Button onClick={handleSubmitAmount} disabled={intentMutation.isPending}>
              {intentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Continue
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={confirmMutation.isPending}>
              {confirmMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
