import { Users, Car, CalendarCheck, DollarSign, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminMetrics } from '@/hooks/use-admin';
import { formatUzs, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const { data: metrics, isLoading } = useAdminMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!metrics) return null;

  const cards = [
    { icon: Users, label: 'Total Users', value: metrics.totalUsers, color: 'text-blue-500' },
    { icon: Car, label: 'Total Cars', value: metrics.totalCars, color: 'text-green-500' },
    { icon: CalendarCheck, label: 'Total Bookings', value: metrics.totalBookings, color: 'text-purple-500' },
    { icon: DollarSign, label: 'Total Revenue', value: formatUzs(metrics.totalRevenue), color: 'text-yellow-500' },
    { icon: ShieldAlert, label: 'Pending Approvals', value: metrics.pendingApprovals, color: 'text-orange-500' },
    { icon: AlertTriangle, label: 'Active Disputes', value: metrics.activeDisputes, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <card.icon className={`h-8 w-8 ${card.color} shrink-0`} />
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue: {formatUzs(metrics.monthlyRevenue)}</CardTitle>
        </CardHeader>
      </Card>

      {/* Recent Activity */}
      {metrics.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentActivity.slice(0, 15).map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {a.type}
                    </Badge>
                    <span>{a.description}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">{formatDate(a.timestamp)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
