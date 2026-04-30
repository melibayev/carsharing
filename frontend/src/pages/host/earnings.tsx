import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, Clock, Car, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useHostDashboard, useHostWallet, useHostLedger } from '@/hooks/use-host';
import type { LedgerEntryDto } from '@/types';

function fmt(uzs: number) {
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(uzs) + ' UZS';
}

const TYPE_LABELS: Record<string, string> = {
  TopUp: 'Top-up',
  BookingHold: 'Hold',
  BookingHoldRelease: 'Hold released',
  BookingCapture: 'Payment',
  RefundCredit: 'Refund',
  PayoutDebit: 'Payout',
  AdjustmentCredit: 'Adjustment',
  AdjustmentDebit: 'Adjustment',
  HostEarning: 'Trip earning',
};

function TransactionRow({ entry }: { entry: LedgerEntryDto }) {
  const label = TYPE_LABELS[entry.type] ?? entry.type;
  const isCredit = entry.direction === 'Credit';

  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {/* Car photo or icon */}
        {entry.carPhotoUrl ? (
          <img
            src={entry.carPhotoUrl}
            alt={entry.carTitle ?? 'Car'}
            className="h-10 w-14 rounded-md object-cover shrink-0"
          />
        ) : (
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isCredit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {isCredit
              ? <ArrowUpRight className="h-4 w-4 text-green-600" />
              : <ArrowDownLeft className="h-4 w-4 text-red-500" />}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={isCredit ? 'default' : 'secondary'} className="text-xs">{label}</Badge>
            {entry.relatedBookingId && (
              <Link
                to={`/host/bookings/${entry.relatedBookingId}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View booking
              </Link>
            )}
          </div>
          {entry.carTitle && (
            <div className="flex items-center gap-1 mt-0.5">
              <Car className="h-3 w-3 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground truncate">{entry.carTitle}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
          {isCredit ? '+' : '−'}{fmt(entry.amountUzs)}
        </p>
        <p className="text-xs text-muted-foreground">Balance: {fmt(entry.balanceAfterUzs)}</p>
      </div>
    </div>
  );
}

export default function HostEarnings() {
  const [page, setPage] = useState(1);
  const { data: dashboard, isLoading: dashLoading } = useHostDashboard();
  const { data: wallet, isLoading: walletLoading } = useHostWallet();
  const { data: ledger, isLoading: ledgerLoading } = useHostLedger(page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings & Wallet</h1>
        <p className="text-muted-foreground text-sm mt-1">Your revenue summary and transaction history</p>
      </div>

      {/* Summary cards */}
      {dashLoading || walletLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold mt-1">{wallet ? fmt(wallet.availableUzs) : '—'}</p>
                  {(wallet?.lockedUzs ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{fmt(wallet!.lockedUzs)} held</p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold mt-1">{dashboard ? fmt(dashboard.revenueThisMonth) : '—'}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Month</p>
                  <p className="text-2xl font-bold mt-1">{dashboard ? fmt(dashboard.lastMonthRevenue) : '—'}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Rating</p>
                  <p className="text-2xl font-bold mt-1">{dashboard?.averageRating.toFixed(1) ?? '—'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{dashboard?.upcomingTrips ?? 0} upcoming</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <span className="text-yellow-500 text-base">★</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {ledgerLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : !ledger?.items?.length ? (
            <div className="flex flex-col items-center justify-center h-36 text-muted-foreground gap-3">
              <Wallet className="h-10 w-10 opacity-30" />
              <p className="text-sm">No transactions yet.</p>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {ledger.items.map((entry) => (
                  <TransactionRow key={entry.id} entry={entry} />
                ))}
              </div>

              {/* Pagination */}
              {(ledger.totalCount > ledger.pageSize) && (
                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {Math.ceil(ledger.totalCount / ledger.pageSize)}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= Math.ceil(ledger.totalCount / ledger.pageSize)} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
