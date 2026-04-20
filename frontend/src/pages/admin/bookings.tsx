import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminBookings } from '@/hooks/use-admin';
import { formatUzs, formatDate, formatDateRange } from '@/lib/utils';
import { BookingStatus } from '@/types';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [BookingStatus.PendingApproval]: 'secondary',
  [BookingStatus.Confirmed]: 'default',
  [BookingStatus.InProgress]: 'default',
  [BookingStatus.Completed]: 'outline',
  [BookingStatus.CancelledByGuest]: 'destructive',
  [BookingStatus.CancelledByHost]: 'destructive',
  [BookingStatus.Rejected]: 'destructive',
  [BookingStatus.Disputed]: 'destructive',
};

export default function AdminBookings() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminBookings(page);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Bookings</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bookings</h1>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Car</th>
                  <th className="text-left p-3 font-medium">Guest</th>
                  <th className="text-left p-3 font-medium">Host</th>
                  <th className="text-left p-3 font-medium">Dates</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((booking) => (
                  <tr key={booking.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{booking.carTitle}</td>
                    <td className="p-3 text-muted-foreground">{booking.guestName}</td>
                    <td className="p-3 text-muted-foreground">{booking.hostName}</td>
                    <td className="p-3 text-muted-foreground">
                      {formatDateRange(booking.startUtc, booking.endUtc)}
                    </td>
                    <td className="p-3">
                      <Badge variant={statusVariant[booking.status] ?? 'outline'}>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="p-3">{formatUzs(booking.totalChargedUsd)}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(booking.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data && data.totalCount > data.pageSize && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground py-2">
            Page {page} of {Math.ceil(data.totalCount / data.pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(data.totalCount / data.pageSize)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
