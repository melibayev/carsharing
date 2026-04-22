import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAttachPayoutMethod } from '@/hooks/use-host';
import type { PayoutMethodType } from '@/types';

const PAYOUT_TABS: { id: PayoutMethodType; label: string }[] = [
  { id: 'UzcardCard', label: 'Uzcard' },
  { id: 'HumoCard', label: 'Humo' },
  { id: 'VisaMasterCard', label: 'Visa/Mastercard' },
  { id: 'BankAccountUZS', label: 'Bank UZS' },
  { id: 'BankAccountUSD', label: 'Bank USD' },
];

const cardSchema = z.object({
  holderName: z.string().min(2, 'Required'),
  cardNumber: z.string().regex(/^\d{16}$/, 'Must be 16 digits'),
  last4: z.string().optional(),
});

type CardForm = z.infer<typeof cardSchema>;

export default function HostPayoutStep({ onNext }: { onNext: () => void }) {
  const [activeTab, setActiveTab] = useState<PayoutMethodType>('UzcardCard');
  const attach = useAttachPayoutMethod();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
  });

  const cardNumberValue = watch('cardNumber') ?? '';

  async function onSubmit(values: CardForm) {
    const last4 = values.cardNumber.slice(-4);
    const brandMap: Record<string, string> = {
      UzcardCard: 'Uzcard',
      HumoCard: 'Humo',
      VisaMasterCard: cardNumberValue.startsWith('4') ? 'Visa' : 'Mastercard',
    };
    await attach.mutateAsync({
      type: activeTab,
      brand: brandMap[activeTab] ?? activeTab,
      last4,
      holderName: values.holderName,
      tokenizedDetails: `tok_fake_${values.cardNumber}_${Date.now()}`,
    });
    onNext();
  }

  const isBank = activeTab === 'BankAccountUZS' || activeTab === 'BankAccountUSD';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Add a payout method</h2>
        <p className="text-muted-foreground mt-2">
          Choose where you'd like your earnings to be sent.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {PAYOUT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isBank ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Bank transfer</p>
                  <p className="text-xs text-muted-foreground">Bank transfer setup coming soon. Please use a card.</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="holderName">Cardholder Name</Label>
                <Input
                  id="holderName"
                  placeholder="FIRSTNAME LASTNAME"
                  {...register('holderName')}
                />
                {errors.holderName && <p className="text-xs text-destructive">{errors.holderName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    className="pl-10"
                    maxLength={16}
                    {...register('cardNumber')}
                  />
                </div>
                {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={attach.isPending}>
                {attach.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…</>
                ) : (
                  'Add Payout Method & Continue'
                )}
              </Button>

              {attach.isError && (
                <p className="text-xs text-destructive text-center">Failed to add card. Please try again.</p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
