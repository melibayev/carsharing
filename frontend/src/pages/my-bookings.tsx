import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarDays, Car } from 'lucide-react';
import { useMyBookings } from '@/hooks/use-bookings';
import { BookingStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const statusLabels: Record<BookingStatus, string> = {
  [BookingStatus.PendingApproval]: 'Pending',
  [BookingStatus.Confirmed]: 'Confirmed',
  [BookingStatus.InProgress]: 'Active',
  [BookingStatus.Completed]: 'Completed',
  [BookingStatus.CancelledByGuest]: 'Cancelled',
  [BookingStatus.CancelledByHost]: 'Cancelled by host',
  [BookingStatus.Rejected]: 'Rejected',
  [BookingStatus.Disputed]: 'Disputed',
};

const statusVariant: Record<BookingStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [BookingStatus.PendingApproval]: 'secondary',
  [BookingStatus.Confirmed]: 'default',
  [BookingStatus.InProgress]: 'default',
  [BookingStatus.Completed]: 'outline',
  [BookingStatus.CancelledByGuest]: 'destructive',
  [BookingStatus.CancelledByHost]: 'destructive',
  [BookingStatus.Rejected]: 'destructive',
  [BookingStatus.Disputed]: 'destructive',
};

const TABS = [
  { label: 'All', value: undefined as BookingStatus | undefined },
  { label: 'Active', value: BookingStatus.Confirmed },
  { label: 'Completed', value: BookingStatus.Completed },
  { label: 'Cancelled', value: BookingStatus.CancelledByGuest },
];

export default function MyBookings() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<BookingStatus | undefined>(undefined);
  const { data, isLoading } = useMyBookings('guest', page);

  const bookings = data?.items ?? [];
  const filtered = activeTab ? bookings.filter((b) => b.status === activeTab) : bookings;

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((tab) => (
          <Button
            key={tab.label}
            variant={activeTab === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTab(tab.value);
              setPage(1);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
          <Car className="h-12 w-12 opacity-30" />
          <p className="text-lg">No bookings found.</p>
          <Button asChild variant="outline">
            <Link to="/search">Browse cars</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <Link key={booking.id} to={`/bookings/${booking.id}`}>
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex gap-4">
                  {booking.coverPhotoUrl ? (
                    <img
                      src={booking.coverPhotoUrl}
                      alt={booking.carTitle}
                      className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold truncate">{booking.carTitle}</p>
                      <Badge variant={statusVariant[booking.status]}>
                        {statusLabels[booking.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(booking.startUtc), 'MMM d')} –{' '}
                        {format(new Date(booking.endUtc), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {booking.days} day{booking.days !== 1 ? 's' : ''} ·{' '}
                      <span className="font-medium text-foreground">
                        ${booking.totalChargedUsd.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && Math.ceil(data.totalCount / data.pageSize) > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">
            Page {page} of {Math.ceil(data.totalCount / data.pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === Math.ceil(data.totalCount / data.pageSize)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
