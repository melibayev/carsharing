import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Calendar, Star, MessageSquare, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import { useMyBookings } from '@/hooks/use-bookings';
import { useMyCars } from '@/hooks/use-cars';
import { formatUzs, formatDateRange } from '@/lib/utils';
import { BookingStatus } from '@/types';

const statusLabels: Record<string, string> = {
  [BookingStatus.PendingApproval]: 'Pending',
  [BookingStatus.Confirmed]: 'Confirmed',
  [BookingStatus.InProgress]: 'Active',
  [BookingStatus.Completed]: 'Completed',
  [BookingStatus.CancelledByGuest]: 'Cancelled',
  [BookingStatus.CancelledByHost]: 'Cancelled',
  [BookingStatus.Rejected]: 'Rejected',
  [BookingStatus.Disputed]: 'Disputed',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [BookingStatus.PendingApproval]: 'outline',
  [BookingStatus.Confirmed]: 'default',
  [BookingStatus.InProgress]: 'default',
  [BookingStatus.Completed]: 'secondary',
  [BookingStatus.CancelledByGuest]: 'destructive',
  [BookingStatus.CancelledByHost]: 'destructive',
  [BookingStatus.Rejected]: 'destructive',
  [BookingStatus.Disputed]: 'destructive',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [guestPage] = useState(1);
  const [hostPage] = useState(1);
  const { data: guestBookings, isLoading: guestLoading } = useMyBookings('guest', guestPage);
  const { data: hostBookings, isLoading: hostLoading } = useMyBookings('host', hostPage);
  const { data: myCars, isLoading: carsLoading } = useMyCars();

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {user?.firstName}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10"><Calendar className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{user?.guestTripCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Trips (guest)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/10"><Car className="h-5 w-5 text-green-500" /></div>
            <div>
              <p className="text-2xl font-bold">{user?.hostTripCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Trips (host)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-500/10"><Star className="h-5 w-5 text-yellow-500" /></div>
            <div>
              <p className="text-2xl font-bold">{user?.averageRatingAsGuest ? user.averageRatingAsGuest.toFixed(1) : '-'}</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/10"><DollarSign className="h-5 w-5 text-blue-500" /></div>
            <div>
              <p className="text-2xl font-bold">{myCars?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">My listings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="guest">
        <TabsList>
          <TabsTrigger value="guest" className="gap-2">
            <Calendar className="h-4 w-4" /> My bookings
          </TabsTrigger>
          <TabsTrigger value="host" className="gap-2">
            <Car className="h-4 w-4" /> As host
          </TabsTrigger>
          <TabsTrigger value="cars" className="gap-2">
            <DollarSign className="h-4 w-4" /> My listings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guest" className="space-y-4">
          {guestLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : guestBookings && guestBookings.items.length > 0 ? (
            guestBookings.items.map((b) => (
              <Link key={b.id} to={`/bookings/${b.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-16 w-24 rounded bg-muted overflow-hidden flex-shrink-0">
                      {b.coverPhotoUrl ? (
                        <img src={b.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><Car className="h-6 w-6 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{b.carTitle}</p>
                      <p className="text-sm text-muted-foreground">{formatDateRange(b.startUtc, b.endUtc)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={statusColors[b.status]}>{statusLabels[b.status]}</Badge>
                      <p className="text-sm font-medium mt-1 font-mono">{formatUzs(b.totalChargedUsd)}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="font-heading font-semibold">No bookings yet</p>
                <Button asChild className="rounded-xl"><Link to="/search">Search cars</Link></Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="host" className="space-y-4">
          {hostLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : hostBookings && hostBookings.items.length > 0 ? (
            hostBookings.items.map((b) => (
              <Link key={b.id} to={`/bookings/${b.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-16 w-24 rounded bg-muted overflow-hidden flex-shrink-0">
                      {b.coverPhotoUrl ? (
                        <img src={b.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><Car className="h-6 w-6 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{b.carTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateRange(b.startUtc, b.endUtc)} - {b.guest?.firstName ?? 'Guest'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={statusColors[b.status]}>{statusLabels[b.status]}</Badge>
                      <p className="text-sm font-medium mt-1 font-mono">{formatUzs(b.hostPayoutUsd)}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="font-heading font-semibold">No host bookings yet</p>
                <Button asChild className="rounded-xl"><Link to="/host/cars/new">List your car</Link></Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cars" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild className="rounded-xl"><Link to="/host/cars/new">+ List your car</Link></Button>
          </div>
          {carsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : myCars && myCars.length > 0 ? (
            myCars.map((car) => (
              <Link key={car.id} to={`/cars/${car.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-16 w-24 rounded bg-muted overflow-hidden flex-shrink-0">
                      {car.coverPhotoUrl ? (
                        <img src={car.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><Car className="h-6 w-6 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{car.year} {car.make} {car.model}</p>
                      <p className="text-sm text-muted-foreground">
                        {car.city} - {car.tripCount} trips - {car.averageRating > 0 ? car.averageRating.toFixed(1) : 'New'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono">{formatUzs(car.dailyPriceUsd)}/day</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <Car className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="font-heading font-semibold">No listings yet</p>
                <Button asChild className="rounded-xl"><Link to="/host/cars/new">List your car</Link></Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
