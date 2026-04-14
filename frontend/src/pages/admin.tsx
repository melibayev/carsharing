import { useState } from 'react';
import { Users, Car, Calendar, DollarSign, Shield, Ban, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminMetrics, useAdminUsers, useAdminBookings, useBanUser, useUnbanUser, useVerifyUser } from '@/hooks/use-admin';
import { formatUzs, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BookingStatus } from '@/types';

const statusLabels: Record<string, string> = {
  [BookingStatus.PendingApproval]: 'Kutilmoqda',
  [BookingStatus.Confirmed]: 'Tasdiqlangan',
  [BookingStatus.InProgress]: 'Faol',
  [BookingStatus.Completed]: 'Tugallangan',
  [BookingStatus.CancelledByGuest]: 'Bekor qilingan',
  [BookingStatus.CancelledByHost]: 'Bekor qilingan',
  [BookingStatus.Rejected]: 'Rad etilgan',
  [BookingStatus.Disputed]: 'Munozarali',
};

export default function AdminPage() {
  const { data: metrics, isLoading: metricsLoading } = useAdminMetrics();
  const [usersPage] = useState(1);
  const [bookingsPage] = useState(1);
  const { data: users, isLoading: usersLoading } = useAdminUsers(usersPage);
  const { data: bookings, isLoading: bookingsLoading } = useAdminBookings(bookingsPage);
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();
  const verifyMutation = useVerifyUser();
  const { toast } = useToast();

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>

      {/* Metrics */}
      {metricsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Car className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.totalCars}</p>
                <p className="text-xs text-muted-foreground">Total Cars</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.totalBookings}</p>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold font-mono">{formatUzs(metrics.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      {metrics && metrics.recentActivity.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentActivity.slice(0, 10).map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{a.type}</Badge>
                    <span>{a.description}</span>
                  </div>
                  <span className="text-muted-foreground">{formatDate(a.timestamp)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Users</TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2"><Calendar className="h-4 w-4" /> Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {usersLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          ) : users && users.items.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Name</th>
                        <th className="p-3 text-left font-medium">Email</th>
                        <th className="p-3 text-left font-medium">Joined</th>
                        <th className="p-3 text-left font-medium">Trips</th>
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.items.map((u) => (
                        <tr key={u.id} className="border-b last:border-0">
                          <td className="p-3 font-medium">{u.firstName} {u.lastName}</td>
                          <td className="p-3 text-muted-foreground">{u.email}</td>
                          <td className="p-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                          <td className="p-3">{u.guestTripCount + u.hostTripCount}</td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {u.isIdentityVerified && <Badge variant="secondary">Verified</Badge>}
                              {u.isBanned && <Badge variant="destructive">Banned</Badge>}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {!u.isIdentityVerified && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => verifyMutation.mutate(u.id, { onSuccess: () => toast({ title: 'User verified' }) })}
                                  disabled={verifyMutation.isPending}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" /> Verify
                                </Button>
                              )}
                              {u.isBanned ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => unbanMutation.mutate(u.id, { onSuccess: () => toast({ title: 'User unbanned' }) })}
                                  disabled={unbanMutation.isPending}
                                >
                                  Unban
                                </Button>
                              ) : (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => banMutation.mutate(u.id, { onSuccess: () => toast({ title: 'User banned' }) })}
                                  disabled={banMutation.isPending}
                                >
                                  <Ban className="h-3 w-3 mr-1" /> Ban
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground">No users found.</p>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          {bookingsLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          ) : bookings && bookings.items.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Car</th>
                        <th className="p-3 text-left font-medium">Guest</th>
                        <th className="p-3 text-left font-medium">Dates</th>
                        <th className="p-3 text-left font-medium">Total</th>
                        <th className="p-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.items.map((b) => (
                        <tr key={b.id} className="border-b last:border-0">
                          <td className="p-3 font-medium">{b.carTitle}</td>
                          <td className="p-3 text-muted-foreground">{b.guest?.firstName ?? 'Guest'}</td>
                          <td className="p-3 text-muted-foreground">{formatDate(b.startUtc)} – {formatDate(b.endUtc)}</td>
                          <td className="p-3 font-mono">{formatUzs(b.totalChargedUsd)}</td>
                          <td className="p-3"><Badge variant="outline">{statusLabels[b.status]}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground">No bookings found.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
