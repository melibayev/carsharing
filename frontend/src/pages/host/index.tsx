import { useNavigate } from 'react-router-dom';
import { Car, CalendarDays, Star, TrendingUp, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useHostDashboard } from '@/hooks/use-host';

function MetricCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your host overview</p>
        </div>
        <Button onClick={() => navigate('/host/cars/new')}>
          <Plus className="h-4 w-4 mr-2" />
          List a Car
        </Button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Revenue (this month)"
          value={data ? `$${data.revenueThisMonth.toFixed(0)}` : '—'}
          icon={TrendingUp}
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
        />
        <MetricCard
          label="Upcoming Trips"
          value={data?.upcomingTrips ?? '—'}
          icon={Car}
        />
      </div>
    </div>
  );
}
