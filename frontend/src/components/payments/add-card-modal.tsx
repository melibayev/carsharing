import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAddCardIntent, useConfirmCard, useResendCardSms } from '@/hooks/use-payments';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: () => void;
}

type Step = 'card-details' | 'otp';

// Detect card brand and type from the card number prefix
function detectBrand(digits: string): { brand: string; isLocal: boolean; type: string } {
  if (digits.startsWith('8600')) return { brand: 'Uzcard', isLocal: true, type: 'UzcardCard' };
  if (digits.startsWith('9860')) return { brand: 'Humo',   isLocal: true, type: 'HumoCard' };
  if (digits.startsWith('4'))   return { brand: 'Visa',   isLocal: false, type: 'VisaMasterCard' };
  if (digits.startsWith('5') || digits.startsWith('2'))
    return { brand: 'Mastercard', isLocal: false, type: 'VisaMasterCard' };
  return { brand: '', isLocal: false, type: 'VisaMasterCard' };
}

const BRAND_COLORS: Record<string, string> = {
  Visa:       'bg-blue-600',
  Mastercard: 'bg-orange-600',
  Uzcard:     'bg-green-600',
  Humo:       'bg-purple-600',
};

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

  // Derived: compute card brand live from the number the user is typing
  const digits = cardNumber.replace(/\s/g, '');
  const { brand, isLocal, type } = detectBrand(digits);

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
    const d = val.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return d;
  };

  const handleCardSubmit = async () => {
    const [expMonthStr, expYearStr] = expiry.split('/');
    const expMonth = parseInt(expMonthStr ?? '0', 10);
    const expYear = parseInt('20' + (expYearStr ?? '0'), 10);

    if (digits.length < 16) {
      toast({ title: 'Enter a valid 16-digit card number.', variant: 'destructive' });
      return;
    }
    if (!expMonth || !expYear) {
      toast({ title: 'Enter a valid expiry date (MM/YY).', variant: 'destructive' });
      return;
    }
    if (!isLocal && cvv.length < 3) {
      toast({ title: 'Enter the CVV (3–4 digits on the back of the card).', variant: 'destructive' });
      return;
    }
    if (!cardholderName.trim()) {
      toast({ title: 'Enter the cardholder name.', variant: 'destructive' });
      return;
    }

    try {
      const res = await intentMutation.mutateAsync({
        cardNumber: digits,
        expMonth,
        expYear,
        cvv: isLocal ? undefined : cvv,
        cardholderName: cardholderName.trim(),
        type,
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
              ? 'Enter your card details to link it to your account.'
              : `We sent a 6-digit code to ${phoneHint || 'your phone'}. Enter it below to verify.`}
          </DialogDescription>
        </DialogHeader>

        {step === 'card-details' ? (
          <div className="space-y-4">
            {/* Card number with live brand badge */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Card number</Label>
                {brand && (
                  <Badge className={`text-white text-xs ${BRAND_COLORS[brand] ?? 'bg-muted'}`}>
                    {brand}
                  </Badge>
                )}
              </div>
              <Input
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
              {isLocal && (
                <p className="text-xs text-muted-foreground">
                  {brand} card — no CVV required
                </p>
              )}
            </div>

            {/* Expiry + CVV (CVV hidden for UzCard / Humo) */}
            <div className={isLocal ? '' : 'grid grid-cols-2 gap-3'}>
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
              {!isLocal && (
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
              )}
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
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted text-sm">
              <span className="font-medium">{maskedCard}</span>
              {brand && (
                <Badge className={`text-white text-xs ml-auto ${BRAND_COLORS[brand] ?? 'bg-muted'}`}>
                  {brand}
                </Badge>
              )}
            </div>
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
