import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMyBookings } from '@/hooks/use-bookings';
import { formatDate, getInitials } from '@/lib/utils';
import { BookingStatus } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  [BookingStatus.PendingApproval]: 'Pending',
  [BookingStatus.Confirmed]: 'Confirmed',
  [BookingStatus.InProgress]: 'Active',
  [BookingStatus.Completed]: 'Completed',
  [BookingStatus.CancelledByGuest]: 'Cancelled',
  [BookingStatus.CancelledByHost]: 'Cancelled',
  [BookingStatus.Rejected]: 'Rejected',
  [BookingStatus.Disputed]: 'Disputed',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [BookingStatus.PendingApproval]: 'outline',
  [BookingStatus.Confirmed]: 'default',
  [BookingStatus.InProgress]: 'default',
  [BookingStatus.Completed]: 'secondary',
  [BookingStatus.CancelledByGuest]: 'destructive',
  [BookingStatus.CancelledByHost]: 'destructive',
  [BookingStatus.Rejected]: 'destructive',
  [BookingStatus.Disputed]: 'destructive',
};

export default function HostBookings() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyBookings('host', page);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground text-sm mt-1">All booking requests for your cars</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const bookings = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-muted-foreground text-sm mt-1">All booking requests for your cars</p>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
          <CalendarDays className="h-10 w-10 opacity-30" />
          <p className="text-sm">No bookings yet. Bookings will appear here once guests reserve your cars.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/host/bookings/${booking.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-16 w-24 rounded-lg bg-muted overflow-hidden shrink-0">
                  {booking.coverPhotoUrl ? (
                    <img src={booking.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <CalendarDays className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{booking.carTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(booking.startUtc)} – {formatDate(booking.endUtc)} · {booking.days} days
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={booking.guest?.profilePhotoUrl ?? undefined} />
                      <AvatarFallback className="text-[9px]">{getInitials(booking.guest?.firstName ?? 'G')}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{booking.guest?.firstName ?? 'Guest'}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant={STATUS_VARIANT[booking.status] ?? 'outline'}>
                    {STATUS_LABELS[booking.status] ?? booking.status}
                  </Badge>
                  <p className="text-sm font-semibold">${booking.totalChargedUsd.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
