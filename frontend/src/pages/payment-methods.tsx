import { useState } from 'react';
import { CreditCard, Trash2, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentMethods, useDeleteCard, useSetDefaultCard } from '@/hooks/use-payments';
import { useToast } from '@/hooks/use-toast';
import AddCardModal from '@/components/payments/add-card-modal';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

export default function PaymentMethodsPage() {
  const { toast } = useToast();
  const { data: methods, isLoading } = usePaymentMethods();
  const deleteMutation = useDeleteCard();
  const defaultMutation = useSetDefaultCard();

  const [showAddCard, setShowAddCard] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast({ title: 'Card removed.' });
    } catch {
      toast({ title: 'Could not remove card.', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await defaultMutation.mutateAsync(id);
      toast({ title: 'Default card updated.' });
    } catch {
      toast({ title: 'Could not update default card.', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Payment Methods
        </h1>
        {(methods?.length ?? 0) < 5 && (
          <Button onClick={() => setShowAddCard(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add card
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saved cards</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !methods?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No cards saved yet.</p>
          ) : (
            <div className="divide-y">
              {methods.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-4">
                  <CreditCard className="h-6 w-6 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {m.brand} ••••{m.last4}
                      {m.isDefault && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Default</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.cardholderName} · Expires {m.expMonth}/{m.expYear}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!m.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Set as default"
                        disabled={defaultMutation.isPending}
                        onClick={() => handleSetDefault(m.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remove card"
                      disabled={deleteMutation.isPending}
                      onClick={() => setDeleteId(m.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddCardModal
        open={showAddCard}
        onOpenChange={setShowAddCard}
        onAdded={() => setShowAddCard(false)}
      />

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove card?</DialogTitle>
            <DialogDescription>
              This card will be removed from your account. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
