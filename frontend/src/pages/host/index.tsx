import { useNavigate } from 'react-router-dom';
import {
  Car,
  CalendarDays,
  Star,
  TrendingUp,
  Plus,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useHostDashboard, useHostWallet } from '@/hooks/use-host';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function fmt(uzs: number) {
  if (uzs >= 1_000_000) return `${(uzs / 1_000_000).toFixed(1)}M UZS`;
  if (uzs >= 1_000) return `${(uzs / 1_000).toFixed(0)}K UZS`;
  return `${uzs.toFixed(0)} UZS`;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  sub,
  badge,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  badge?: { label: string; positive?: boolean };
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            {badge && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${badge.positive ? 'text-green-600' : 'text-red-500'}`}>
                {badge.positive
                  ? <ArrowUpRight className="h-3 w-3" />
                  : <ArrowDownRight className="h-3 w-3" />}
                {badge.label}
              </div>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HostDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useHostDashboard();
  const { data: wallet } = useHostWallet();

  const revenueChange = data && data.lastMonthRevenue > 0
    ? Math.round(((data.revenueThisMonth - data.lastMonthRevenue) / data.lastMonthRevenue) * 100)
    : null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your host overview</p>
        </div>
        <div className="flex items-center gap-2">
          {(data?.pendingApprovals ?? 0) > 0 && (
            <Badge variant="destructive" className="cursor-pointer" onClick={() => navigate('/host/bookings')}>
              {data!.pendingApprovals} pending
            </Badge>
          )}
          <Button onClick={() => navigate('/host/cars/new')}>
            <Plus className="h-4 w-4 mr-2" />
            List a Car
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Revenue this month"
          value={data ? fmt(data.revenueThisMonth) : '—'}
          icon={TrendingUp}
          badge={revenueChange !== null
            ? { label: `${Math.abs(revenueChange)}% vs last month`, positive: revenueChange >= 0 }
            : undefined}
        />
        <MetricCard
          label="Wallet balance"
          value={wallet ? fmt(wallet.availableUzs) : '—'}
          icon={Wallet}
          sub="available to withdraw"
        />
        <MetricCard
          label="Occupancy Rate"
          value={data ? `${Math.round(data.occupancy)}%` : '—'}
          icon={CalendarDays}
          sub="last 30 days"
        />
        <MetricCard
          label="Avg. Rating"
          value={data?.averageRating.toFixed(1) ?? '—'}
          icon={Star}
          sub={`${data?.upcomingTrips ?? 0} upcoming trips`}
        />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Revenue — last 6 months</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.monthlyChart ?? []} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmt(v)} width={80} />
              <Tooltip
                formatter={(value: number) => [fmt(value), 'Revenue']}
                labelClassName="font-medium"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top cars + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top cars */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Performing Cars</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.topCars?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <Car className="h-8 w-8 opacity-30" />
                <p className="text-sm">No completed trips yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {data.topCars.map((car) => (
                  <div key={car.carId} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{car.name}</p>
                      <p className="text-xs text-muted-foreground">{car.trips} trip{car.trips !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="text-sm font-semibold">{fmt(car.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: 'Bookings', icon: Clock, path: '/host/bookings' },
              { label: 'My Cars', icon: Car, path: '/host/cars' },
              { label: 'Earnings', icon: TrendingUp, path: '/host/earnings' },
              { label: 'Wallet', icon: Wallet, path: '/host/earnings' },
            ].map(({ label, icon: Icon, path }) => (
              <Button
                key={label}
                variant="outline"
                className="h-16 flex-col gap-1 text-xs"
                onClick={() => navigate(path)}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
