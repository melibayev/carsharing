import { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBalance, useLedger } from '@/hooks/use-payments';
import { formatUzs, formatDate } from '@/lib/utils';
import TopUpModal from '@/components/payments/top-up-modal';

export default function WalletPage() {
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
                    {formatUzs(balance.lockedUzs)} locked
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

      {/* Ledger */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          {ledgerLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : ledgerPage?.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions yet.</p>
          ) : (
            <div className="divide-y">
              {ledgerPage?.items.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 py-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    entry.direction === 'Credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {entry.direction === 'Credit'
                      ? <ArrowDownLeft className="h-4 w-4" />
                      : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${
                    entry.direction === 'Credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {entry.direction === 'Credit' ? '+' : '-'}{formatUzs(entry.amountUzs)}
                  </p>
                </div>
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
