import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Car, Calendar, Star, MessageSquare, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useBookingDetail, useApproveBooking, useRejectBooking, useCancelBooking, useCheckIn, useCheckOut } from '@/hooks/use-bookings';
import { useCreateReview } from '@/hooks/use-reviews';
import { useAuthStore } from '@/stores/auth-store';
import { formatUzs, formatDateRange, formatDate, getInitials } from '@/lib/utils';
import { BookingStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

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

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { data: booking, isLoading } = useBookingDetail(id!);
  const approveMutation = useApproveBooking();
  const rejectMutation = useRejectBooking();
  const cancelMutation = useCancelBooking();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const reviewMutation = useCreateReview();

  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  if (isLoading) {
    return (
      <div className="container py-8 max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-heading font-bold">Booking not found</h2>
        <Button className="mt-4 rounded-xl" onClick={() => navigate('/dashboard')}>Back</Button>
      </div>
    );
  }

  const isHost = booking.host?.id === user?.id;
  const isGuest = booking.guestId === user?.id;

  const handleApprove = () => {
    approveMutation.mutate(booking.id, {
      onSuccess: () => toast({ title: 'Booking approved!' }),
    });
  };

  const handleReject = () => {
    rejectMutation.mutate({ bookingId: booking.id, reason: rejectReason }, {
      onSuccess: () => { setShowReject(false); toast({ title: 'Booking rejected' }); },
    });
  };

  const handleCancel = () => {
    cancelMutation.mutate({ bookingId: booking.id, reason: cancelReason }, {
      onSuccess: () => { setShowCancel(false); toast({ title: 'Booking cancelled' }); },
    });
  };

  const handleCheckIn = () => {
    checkInMutation.mutate({ bookingId: booking.id, odometerKm: Number(odometerKm) }, {
      onSuccess: () => { setShowCheckIn(false); toast({ title: 'Checked in!' }); },
    });
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate({ bookingId: booking.id, odometerKm: Number(odometerKm) }, {
      onSuccess: () => { setShowCheckOut(false); toast({ title: 'Trip completed!' }); },
    });
  };

  const handleReview = () => {
    reviewMutation.mutate(
      { bookingId: booking.id, rating: reviewRating, comment: reviewComment },
      {
        onSuccess: () => { setShowReview(false); toast({ title: 'Review submitted!' }); },
      },
    );
  };

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
        <ChevronLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">{booking.carTitle}</h1>
          <p className="text-muted-foreground">{formatDateRange(booking.startUtc, booking.endUtc)}</p>
        </div>
        <Badge className="text-sm">{statusLabels[booking.status]}</Badge>
      </div>

      {/* Booking Info */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-32 rounded bg-muted overflow-hidden">
              {booking.coverPhotoUrl ? (
                <img src={booking.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center"><Car className="h-8 w-8 text-muted-foreground" /></div>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">{booking.carTitle}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {booking.days} days - {formatDate(booking.startUtc)} to {formatDate(booking.endUtc)}
              </p>
            </div>
          </div>

          <Separator />

          {/* People */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Guest</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={booking.guest?.profilePhotoUrl ?? undefined} />
                  <AvatarFallback>{getInitials(booking.guest?.firstName ?? 'G')}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{booking.guest?.firstName ?? 'Guest'}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Host</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={booking.host?.profilePhotoUrl ?? undefined} />
                  <AvatarFallback>{getInitials(booking.host?.firstName ?? 'H')}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{booking.host?.firstName ?? 'Host'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{formatUzs(booking.dailyRateUsd, false)} x {booking.days} days</span>
              <span className="font-mono">{formatUzs(booking.subtotalUsd)}</span>
            </div>
            <div className="flex justify-between"><span>Cleaning fee</span><span className="font-mono">{formatUzs(booking.cleaningFeeUsd)}</span></div>
            <div className="flex justify-between"><span>Service fee</span><span className="font-mono">{formatUzs(booking.serviceFeeUsd)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span className="font-mono">{formatUzs(booking.taxesUsd)}</span></div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="font-mono">{formatUzs(booking.totalChargedUsd)}</span>
            </div>
            {isHost && (
              <div className="flex justify-between text-green-600">
                <span>Your payout</span>
                <span className="font-mono">{formatUzs(booking.hostPayoutUsd)}</span>
              </div>
            )}
          </div>

          {booking.guestMessage && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Guest message</p>
                <p className="text-sm mt-1">{booking.guestMessage}</p>
              </div>
            </>
          )}

          {booking.checkInOdometerKm != null && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Check-in odometer:</span> {booking.checkInOdometerKm.toLocaleString()} km</div>
                {booking.checkOutOdometerKm != null && (
                  <div><span className="text-muted-foreground">Check-out odometer:</span> {booking.checkOutOdometerKm.toLocaleString()} km</div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isHost && booking.status === BookingStatus.PendingApproval && (
          <>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
            <Button variant="destructive" onClick={() => setShowReject(true)}>Reject</Button>
          </>
        )}
        {isHost && booking.status === BookingStatus.Confirmed && (
          <Button onClick={() => { setOdometerKm(''); setShowCheckIn(true); }}>Check In</Button>
        )}
        {isHost && booking.status === BookingStatus.InProgress && (
          <Button onClick={() => { setOdometerKm(''); setShowCheckOut(true); }}>Check Out</Button>
        )}
        {(isGuest || isHost) && (booking.status === BookingStatus.PendingApproval || booking.status === BookingStatus.Confirmed) && (
          <Button variant="outline" onClick={() => setShowCancel(true)}>Cancel</Button>
        )}
        {booking.canReview && (
          <Button variant="secondary" onClick={() => setShowReview(true)} className="gap-2">
            <Star className="h-4 w-4" /> Write Review
          </Button>
        )}
        <Button variant="outline" onClick={() => navigate(`/messages/${booking.id}`)} className="gap-2">
          <MessageSquare className="h-4 w-4" /> Open conversation
        </Button>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this booking.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || rejectMutation.isPending}>
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>Please provide a reason for cancellation.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancel(false)}>Go Back</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={!cancelReason || cancelMutation.isPending}>
              {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={showCheckIn} onOpenChange={setShowCheckIn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In</DialogTitle>
            <DialogDescription>Record the odometer reading at pick-up.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Odometer (km)</Label>
            <Input type="number" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} placeholder="e.g. 45000" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckIn(false)}>Cancel</Button>
            <Button onClick={handleCheckIn} disabled={!odometerKm || checkInMutation.isPending}>
              {checkInMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-out Dialog */}
      <Dialog open={showCheckOut} onOpenChange={setShowCheckOut}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Out</DialogTitle>
            <DialogDescription>Record the odometer reading at return.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Odometer (km)</Label>
            <Input type="number" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} placeholder="e.g. 45500" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckOut(false)}>Cancel</Button>
            <Button onClick={handleCheckOut} disabled={!odometerKm || checkOutMutation.isPending}>
              {checkOutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>Share your experience with this trip.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setReviewRating(n)}>
                    <Star className={`h-8 w-8 ${n <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Textarea placeholder="How was your experience?" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReview(false)}>Cancel</Button>
            <Button onClick={handleReview} disabled={!reviewComment || reviewMutation.isPending}>
              {reviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
