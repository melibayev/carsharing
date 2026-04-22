import { Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useHostDashboard } from '@/hooks/use-host';
import { Skeleton } from '@/components/ui/skeleton';

export default function HostEarnings() {
  const { data, isLoading } = useHostDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-muted-foreground text-sm mt-1">Your revenue summary</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold mt-1">{data ? `$${data.revenueThisMonth.toFixed(0)}` : '—'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Last Month</p>
              <p className="text-2xl font-bold mt-1">{data ? `$${data.lastMonthRevenue.toFixed(0)}` : '—'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Avg. Rating</p>
              <p className="text-2xl font-bold mt-1">{data?.averageRating.toFixed(1) ?? '—'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
        <Wallet className="h-10 w-10 opacity-30" />
        <p className="text-sm">Detailed earnings history coming soon.</p>
      </div>
    </div>
  );
}
