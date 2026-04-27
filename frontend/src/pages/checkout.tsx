import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, Wallet, Loader2, Timer, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCheckout, usePayBooking } from '@/hooks/use-payments';
import { formatUzs, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { PayBookingRequest, UserPaymentMethodDto } from '@/types';
import AddCardModal from '@/components/payments/add-card-modal';
import TopUpModal from '@/components/payments/top-up-modal';

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

type Tab = 'balance' | 'card';

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: checkout, isLoading } = useCheckout(id);
  const payMutation = usePayBooking(id!);

  const [tab, setTab] = useState<Tab>('balance');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const idempotencyKey = useRef(genId());

  // Restore recommended method
  useEffect(() => {
    if (!checkout) return;
    if (checkout.recommendedMethodId) {
      setTab('card');
      setSelectedCardId(checkout.recommendedMethodId);
    } else if (checkout.balance.availableUzs >= checkout.priceBreakdown.totalUzs) {
      setTab('balance');
    }
  }, [checkout?.recommendedMethodId]);

  // Countdown timer
  useEffect(() => {
    if (!checkout?.lockExpiresAt) return;
    const tick = () => {
      const secs = Math.max(0, Math.floor((new Date(checkout.lockExpiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(secs);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [checkout?.lockExpiresAt]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Booking not found or not payable.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/bookings')}>
          My bookings
        </Button>
      </div>
    );
  }

  const { booking, priceBreakdown, balance, paymentMethods } = checkout;
  const activeCards = paymentMethods.filter((m) => m.isActive);
  const canPayWithBalance = balance.availableUzs >= priceBreakdown.totalUzs;

  const handlePay = async () => {
    if (timeLeft === 0) {
      toast({ title: 'Session expired', description: 'Refresh the page to try again.', variant: 'destructive' });
      return;
    }

    const request: PayBookingRequest =
      tab === 'balance'
        ? { method: 'AccountBalance' }
        : { method: 'Card', paymentMethodId: selectedCardId ?? undefined };

    if (tab === 'card' && !selectedCardId) {
      toast({ title: 'Select a card', variant: 'destructive' });
      return;
    }

    try {
      await payMutation.mutateAsync({ request, idempotencyKey: idempotencyKey.current });
      navigate(`/bookings/${id}/success`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg === 'LOCK_EXPIRED') {
        toast({ title: 'Session expired', description: 'Refresh to restart checkout.', variant: 'destructive' });
      } else {
        toast({ title: 'Payment failed', description: msg ?? 'Please try again.', variant: 'destructive' });
      }
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
        {timeLeft !== null && (
          <Badge variant={timeLeft < 60 ? 'destructive' : 'secondary'} className="ml-auto flex items-center gap-1">
            <Timer className="h-3 w-3" />
            {formatTimer(timeLeft)}
          </Badge>
        )}
      </div>

      {/* Booking summary */}
      <Card>
        <CardContent className="pt-5 space-y-1">
          <p className="font-semibold">{booking.carTitle}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(booking.startUtc)} – {formatDate(booking.endUtc)} · {priceBreakdown.days} day{priceBreakdown.days !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Price breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Price breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label={`${formatUzs(priceBreakdown.dailyRateUzs)} × ${priceBreakdown.days} days`} value={formatUzs(priceBreakdown.subtotalUzs)} />
          {priceBreakdown.cleaningFeeUzs > 0 && <Row label="Cleaning fee" value={formatUzs(priceBreakdown.cleaningFeeUzs)} />}
          {priceBreakdown.serviceFeeUzs > 0 && <Row label="Service fee" value={formatUzs(priceBreakdown.serviceFeeUzs)} />}
          {priceBreakdown.taxesUzs > 0 && <Row label="Taxes" value={formatUzs(priceBreakdown.taxesUzs)} />}
          <Separator />
          <Row label="Total" value={formatUzs(priceBreakdown.totalUzs)} bold />
        </CardContent>
      </Card>

      {/* Payment method tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tab buttons */}
          <div className="flex gap-2">
            <TabButton active={tab === 'balance'} onClick={() => setTab('balance')}>
              <Wallet className="h-4 w-4" />
              Wallet
            </TabButton>
            <TabButton active={tab === 'card'} onClick={() => setTab('card')}>
              <CreditCard className="h-4 w-4" />
              Card
            </TabButton>
          </div>

          {/* Balance tab */}
          {tab === 'balance' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Available balance</p>
                  <p className="text-lg font-bold">{formatUzs(balance.availableUzs)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowTopUp(true)}>
                  Top up
                </Button>
              </div>
              {!canPayWithBalance && (
                <p className="text-sm text-destructive">
                  Insufficient balance. Need {formatUzs(priceBreakdown.totalUzs - balance.availableUzs)} more.
                </p>
              )}
            </div>
          )}

          {/* Card tab */}
          {tab === 'card' && (
            <div className="space-y-3">
              {activeCards.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cards added yet.</p>
              ) : (
                activeCards.map((card) => (
                  <CardOption
                    key={card.id}
                    card={card}
                    selected={selectedCardId === card.id}
                    onSelect={() => setSelectedCardId(card.id)}
                  />
                ))
              )}
              {activeCards.length < 5 && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAddCard(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add card
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay button */}
      <Button
        className="w-full"
        size="lg"
        disabled={
          payMutation.isPending ||
          timeLeft === 0 ||
          (tab === 'balance' && !canPayWithBalance) ||
          (tab === 'card' && !selectedCardId)
        }
        onClick={handlePay}
      >
        {payMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        Pay {formatUzs(priceBreakdown.totalUzs)}
      </Button>

      {/* Modals */}
      <AddCardModal
        open={showAddCard}
        onOpenChange={setShowAddCard}
        onAdded={() => {
          setShowAddCard(false);
          window.location.reload();
        }}
      />
      <TopUpModal
        open={showTopUp}
        required={priceBreakdown.totalUzs - balance.availableUzs}
        onOpenChange={setShowTopUp}
        onConfirmed={() => {
          setShowTopUp(false);
          window.location.reload();
        }}
      />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold text-base' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

function CardOption({ card, selected, onSelect }: { card: UserPaymentMethodDto; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 rounded-md border text-left transition-colors ${
        selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
      }`}
    >
      <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {card.brand} ••••{card.last4}
          {card.isDefault && <span className="ml-2 text-xs text-muted-foreground">(default)</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {card.cardholderName} · {card.expMonth}/{card.expYear}
        </p>
      </div>
      <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${selected ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
    </button>
  );
}
