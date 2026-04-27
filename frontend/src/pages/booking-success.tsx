import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBookingDetail } from '@/hooks/use-bookings';
import { formatDate } from '@/lib/utils';

export default function BookingSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: booking } = useBookingDetail(id!);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
      <div>
        <h1 className="text-2xl font-bold">Payment successful!</h1>
        <p className="text-muted-foreground mt-1">
          {booking?.status === 'Confirmed'
            ? 'Your booking is confirmed. Have a great trip!'
            : 'Your booking request has been submitted. The host will review it shortly.'}
        </p>
      </div>

      {booking && (
        <Card>
          <CardContent className="pt-5 space-y-1 text-left">
            <p className="font-semibold">{booking.carTitle}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(booking.startUtc)} – {formatDate(booking.endUtc)}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              Status: <span className="font-medium">{booking.status}</span>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => navigate('/bookings')}>
          My bookings
        </Button>
        <Button onClick={() => navigate(`/bookings/${id}`)}>
          View booking
        </Button>
      </div>
    </div>
  );
}
