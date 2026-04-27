import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddCardIntent, useConfirmCard, useResendCardSms } from '@/hooks/use-payments';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: () => void;
}

type Step = 'card-details' | 'otp';

export default function AddCardModal({ open, onOpenChange, onAdded }: Props) {
  const { toast } = useToast();
  const intentMutation = useAddCardIntent();
  const confirmMutation = useConfirmCard();
  const resendMutation = useResendCardSms();

  const [step, setStep] = useState<Step>('card-details');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [methodId, setMethodId] = useState('');
  const [maskedCard, setMaskedCard] = useState('');
  const [phoneHint, setPhoneHint] = useState('');
  const [otp, setOtp] = useState('');

  const resetForm = () => {
    setStep('card-details');
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setCardholderName('');
    setMethodId('');
    setMaskedCard('');
    setPhoneHint('');
    setOtp('');
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const formatCardNumber = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleCardSubmit = async () => {
    const digits = cardNumber.replace(/\s/g, '');
    const [expMonthStr, expYearStr] = expiry.split('/');
    const expMonth = parseInt(expMonthStr ?? '0', 10);
    const expYear = parseInt('20' + (expYearStr ?? '0'), 10);

    if (digits.length < 13 || !expMonth || !expYear || cvv.length < 3 || !cardholderName.trim()) {
      toast({ title: 'Please fill all fields correctly.', variant: 'destructive' });
      return;
    }

    try {
      const res = await intentMutation.mutateAsync({
        cardNumber: digits,
        expMonth,
        expYear,
        cvv,
        cardholderName: cardholderName.trim(),
      });
      setMethodId(res.paymentMethodId);
      setMaskedCard(res.maskedCard);
      setPhoneHint(res.phoneHint);
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Card error', description: msg ?? 'Please check your card details.', variant: 'destructive' });
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Enter the 6-digit code.', variant: 'destructive' });
      return;
    }
    try {
      await confirmMutation.mutateAsync({ paymentMethodId: methodId, code: otp });
      toast({ title: 'Card added successfully.' });
      resetForm();
      onAdded?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Invalid code', description: msg ?? 'Try again.', variant: 'destructive' });
    }
  };

  const handleResend = async () => {
    try {
      await resendMutation.mutateAsync({ paymentMethodId: methodId });
      toast({ title: 'Code resent.' });
    } catch {
      toast({ title: 'Could not resend. Please wait a moment.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{step === 'card-details' ? 'Add card' : 'Verify phone'}</DialogTitle>
          <DialogDescription>
            {step === 'card-details'
              ? 'Enter your card details to save it to your account.'
              : `We sent a 6-digit code to ${phoneHint}. Enter it below to verify.`}
          </DialogDescription>
        </DialogHeader>

        {step === 'card-details' ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Card number</Label>
              <Input
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Expiry</Label>
                <Input
                  inputMode="numeric"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                />
              </div>
              <div className="space-y-1">
                <Label>CVV</Label>
                <Input
                  inputMode="numeric"
                  placeholder="123"
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Cardholder name</Label>
              <Input
                placeholder="JOHN DOE"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Card: {maskedCard}</p>
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
            <Button variant="link" size="sm" className="px-0" onClick={handleResend} disabled={resendMutation.isPending}>
              Resend code
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          {step === 'card-details' ? (
            <Button onClick={handleCardSubmit} disabled={intentMutation.isPending}>
              {intentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Continue
            </Button>
          ) : (
            <Button onClick={handleOtpSubmit} disabled={confirmMutation.isPending}>
              {confirmMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Verify
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
