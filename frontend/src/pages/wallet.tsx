import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, Car, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useBalance, useLedger } from '@/hooks/use-payments';
import { formatUzs, formatDate } from '@/lib/utils';
import TopUpModal from '@/components/payments/top-up-modal';
import type { LedgerEntryDto } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  TopUp: 'Top-up',
  BookingHold: 'Funds held',
  BookingHoldRelease: 'Hold released',
  BookingCapture: 'Trip payment',
  RefundCredit: 'Refund',
  PayoutDebit: 'Payout',
  AdjustmentCredit: 'Adjustment',
  AdjustmentDebit: 'Adjustment',
  HostEarning: 'Trip earning',
};

function TransactionRow({ entry, onBookingClick }: { entry: LedgerEntryDto; onBookingClick: (id: string) => void }) {
  const isCredit = entry.direction === 'Credit';
  const label = TYPE_LABELS[entry.type] ?? entry.type;

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Icon / car photo */}
      <div className="shrink-0">
        {entry.carPhotoUrl ? (
          <img
            src={entry.carPhotoUrl}
            alt={entry.carTitle ?? 'Car'}
            className="h-10 w-14 rounded object-cover"
          />
        ) : (
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant={isCredit ? 'default' : 'secondary'} className="text-xs shrink-0">
            {label}
          </Badge>
          {entry.relatedBookingId && (
            <button
              className="text-xs text-primary flex items-center gap-0.5 hover:underline shrink-0"
              onClick={() => onBookingClick(entry.relatedBookingId!)}
            >
              View booking <ExternalLink className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
        {entry.carTitle && (
          <p className="text-sm font-medium mt-0.5 truncate flex items-center gap-1">
            <Car className="h-3 w-3 shrink-0 text-muted-foreground" />
            {entry.carTitle}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
          {isCredit ? '+' : '-'}{formatUzs(entry.amountUzs)}
        </p>
        <p className="text-xs text-muted-foreground">Bal: {formatUzs(entry.balanceAfterUzs)}</p>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const navigate = useNavigate();
  const { data: balance, isLoading: balanceLoading } = useBalance();
  const [page, setPage] = useState(1);
  const { data: ledgerPage, isLoading: ledgerLoading } = useLedger(page);
  const [showTopUp, setShowTopUp] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Wallet className="h-6 w-6" />
        My Wallet
      </h1>

      {/* Balance card */}
      <Card>
        <CardContent className="pt-6 pb-5">
          {balanceLoading ? (
            <Skeleton className="h-12 w-40" />
          ) : balance ? (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-3xl font-bold">{formatUzs(balance.availableUzs)}</p>
                {balance.lockedUzs > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatUzs(balance.lockedUzs)} held for upcoming trip
                  </p>
                )}
              </div>
              <Button onClick={() => setShowTopUp(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Top up
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          {ledgerLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : ledgerPage?.items.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
              <Wallet className="h-10 w-10 opacity-30" />
              <p className="text-sm">No transactions yet. Top up to start booking.</p>
            </div>
          ) : (
            <div className="divide-y">
              {ledgerPage?.items.map((entry) => (
                <TransactionRow
                  key={entry.id}
                  entry={entry}
                  onBookingClick={(id) => navigate(`/bookings/${id}`)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {ledgerPage && ledgerPage.totalCount > ledgerPage.pageSize && (
            <div className="flex justify-between mt-4 pt-3 border-t">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-xs text-muted-foreground self-center">
                Page {page} of {Math.ceil(ledgerPage.totalCount / ledgerPage.pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(ledgerPage.totalCount / ledgerPage.pageSize)}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <TopUpModal
        open={showTopUp}
        onOpenChange={setShowTopUp}
        onConfirmed={() => setShowTopUp(false)}
      />
    </div>
  );
}
