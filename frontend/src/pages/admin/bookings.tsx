import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAdminBookings, useAdminApproveBooking, useAdminRejectBooking } from '@/hooks/use-admin';
import { formatUzs, formatDate, formatDateRange } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, MessageSquare, Calendar, Car, Users } from 'lucide-react';
import { BookingStatus, type AdminBookingDto } from '@/types';

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

const STATUS_TABS: { label: string; value: string | undefined }[] = [
  { label: 'Pending Approval', value: BookingStatus.PendingApproval },
  { label: 'Confirmed', value: BookingStatus.Confirmed },
  { label: 'In Progress', value: BookingStatus.InProgress },
  { label: 'Completed', value: BookingStatus.Completed },
  { label: 'Rejected', value: BookingStatus.Rejected },
  { label: 'Cancelled', value: BookingStatus.CancelledByGuest },
  { label: 'All', value: undefined },
];

function BookingDetailDialog({
  booking,
  onClose,
}: {
  booking: AdminBookingDto;
  onClose: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const approveMutation = useAdminApproveBooking();
  const rejectMutation = useAdminRejectBooking();
  const { toast } = useToast();

  const handleApprove = async () => {
    try { await approveMutation.mutateAsync(booking.id); toast({ title: 'Booking approved' }); onClose(); }
    catch { toast({ title: 'Failed to approve', variant: 'destructive' }); }
  };
  const handleReject = async () => {
    try { await rejectMutation.mutateAsync({ id: booking.id, reason }); toast({ title: 'Booking rejected' }); onClose(); }
    catch { toast({ title: 'Failed to reject', variant: 'destructive' }); }
  };

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            {booking.carTitle}
            <Badge variant={statusVariant[booking.status] ?? 'outline'} className="ml-1">{booking.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Car photo */}
          {booking.coverPhotoUrl && (
            <img src={booking.coverPhotoUrl} alt={booking.carTitle} className="w-full h-36 object-cover rounded-lg" />
          )}

          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Guest</p>
              <p className="font-medium">{booking.guestName}</p>
              <p className="text-xs text-muted-foreground">{booking.guestEmail}</p>
              {booking.guestPhone && <p className="text-xs text-muted-foreground">{booking.guestPhone}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Host</p>
              <p className="font-medium">{booking.hostName}</p>
              <p className="text-xs text-muted-foreground">{booking.hostEmail}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Dates</p>
              <p className="font-medium">{formatDateRange(booking.startUtc, booking.endUtc)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-medium">{formatUzs(booking.totalChargedUsd)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(booking.createdAt)}</p>
            </div>
            {booking.confirmedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Confirmed</p>
                <p className="font-medium">{formatDate(booking.confirmedAt)}</p>
              </div>
            )}
          </div>

          {booking.guestMessage && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40">
              <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Guest message</p>
                <p>{booking.guestMessage}</p>
              </div>
            </div>
          )}

          {rejecting && (
            <div className="space-y-1">
              <Label className="text-xs text-destructive">Rejection reason (optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for rejection…"
                rows={3}
                autoFocus
              />
            </div>
          )}
        </div>

        {booking.status === BookingStatus.PendingApproval && (
          <DialogFooter className="gap-2">
            {!rejecting ? (
              <>
                <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => setRejecting(true)} disabled={isPending}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={isPending}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleReject} disabled={isPending}>
                  <XCircle className="h-4 w-4 mr-1" /> Confirm Rejection
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(BookingStatus.PendingApproval);
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingDto | null>(null);
  const { data, isLoading } = useAdminBookings(statusFilter, page);

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bookings</h1>

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.label}
            size="sm"
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No bookings found.</div>
      ) : (
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
                    <tr key={booking.id} className="border-b last:border-0 align-top cursor-pointer hover:bg-muted/40" onClick={() => setSelectedBooking(booking)}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {booking.coverPhotoUrl && (
                            <img
                              src={booking.coverPhotoUrl}
                              alt={booking.carTitle}
                              className="h-10 w-14 object-cover rounded"
                            />
                          )}
                          <span className="font-medium">{booking.carTitle}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{booking.guestName}</p>
                        <p className="text-xs text-muted-foreground">{booking.guestEmail}</p>
                        {booking.guestPhone && (
                          <p className="text-xs text-muted-foreground">{booking.guestPhone}</p>
                        )}
                        {booking.guestMessage && (
                          <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground max-w-[200px]">
                            <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{booking.guestMessage}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{booking.hostName}</p>
                        <p className="text-xs text-muted-foreground">{booking.hostEmail}</p>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {formatDateRange(booking.startUtc, booking.endUtc)}
                      </td>
                      <td className="p-3">
                        <Badge variant={statusVariant[booking.status] ?? 'outline'}>
                          {booking.status}
                        </Badge>
                        {booking.confirmedAt && (
                          <p className="text-xs text-muted-foreground mt-1">✓ {formatDate(booking.confirmedAt)}</p>
                        )}
                      </td>
                      <td className="p-3">{formatUzs(booking.totalChargedUsd)}</td>
                      <td className="p-3 text-muted-foreground text-xs">{formatDate(booking.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground py-2">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {selectedBooking && (
        <BookingDetailDialog booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  );
}
