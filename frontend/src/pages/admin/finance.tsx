import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminFinance } from '@/hooks/use-admin';
import { formatUzs } from '@/lib/utils';
import { DollarSign, TrendingUp, CreditCard, BarChart3 } from 'lucide-react';

export default function AdminFinance() {
  const { data, isLoading } = useAdminFinance();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Finance</h1>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const summaryCards = [
    { icon: DollarSign, label: 'Total Revenue', value: formatUzs(data.totalRevenue), color: 'text-green-500' },
    { icon: TrendingUp, label: 'Monthly Revenue', value: formatUzs(data.monthlyRevenue), color: 'text-blue-500' },
    { icon: CreditCard, label: 'Total Payouts', value: formatUzs(data.totalPayouts), color: 'text-purple-500' },
    { icon: CreditCard, label: 'Pending Payouts', value: formatUzs(data.pendingPayouts), color: 'text-orange-500' },
    { icon: BarChart3, label: 'Completed Bookings', value: data.completedBookings, color: 'text-teal-500' },
    { icon: BarChart3, label: 'Avg Booking Value', value: formatUzs(data.averageBookingValue), color: 'text-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Finance</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <card.icon className={`h-8 w-8 ${card.color} shrink-0`} />
              <div>
                <p className="text-xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Breakdown */}
      {data.monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Month</th>
                    <th className="text-left p-3 font-medium">Revenue</th>
                    <th className="text-left p-3 font-medium">Payouts</th>
                    <th className="text-left p-3 font-medium">Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlyBreakdown.map((m) => (
                    <tr key={`${m.year}-${m.month}`} className="border-b last:border-0">
                      <td className="p-3 font-medium">
                        {new Date(m.year, m.month - 1).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3">{formatUzs(m.revenue)}</td>
                      <td className="p-3">{formatUzs(m.payouts)}</td>
                      <td className="p-3">{m.bookings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
