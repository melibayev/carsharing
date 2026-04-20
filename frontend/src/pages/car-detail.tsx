import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Star, MapPin, Calendar, Shield, Fuel, Cog, Users, Zap,
  ChevronLeft, ChevronRight, Car, Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCarDetail } from '@/hooks/use-cars';
import { useQuote, useCreateBooking } from '@/hooks/use-bookings';
import { useAuthStore } from '@/stores/auth-store';
import { formatUzs, formatDate, getInitials } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Transmission, FuelType } from '@/types';

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthStore();
  const { data: car, isLoading } = useCarDetail(id!);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guestMessage, setGuestMessage] = useState('');

  const quoteParams = car && startDate && endDate
    ? { carId: car.id, startUtc: new Date(startDate).toISOString(), endUtc: new Date(endDate).toISOString() }
    : null;
  const { data: quote, isLoading: quoteLoading } = useQuote(quoteParams);
  const bookingMutation = useCreateBooking();

  const handleBook = () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: `/cars/${id}` } } });
      return;
    }
    if (!car || !startDate || !endDate) return;
    bookingMutation.mutate(
      {
        carId: car.id,
        startUtc: new Date(startDate).toISOString(),
        endUtc: new Date(endDate).toISOString(),
        guestMessage: guestMessage || undefined,
      },
      {
        onSuccess: (booking) => {
          toast({ title: car.isInstantBook ? 'Confirmed' : 'Pending approval', description: car.isInstantBook ? 'Your booking is confirmed.' : 'Waiting for host approval.' });
          navigate(`/bookings/${booking.id}`);
        },
        onError: () => {
          toast({ title: 'Error', description: 'Please choose different dates.', variant: 'destructive' });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="container py-16 text-center space-y-4">
        <Car className="h-16 w-16 mx-auto text-muted-foreground" />
        <h2 className="text-2xl font-heading font-bold">Car not found</h2>
        <Button onClick={() => navigate('/search')}>Search cars</Button>
      </div>
    );
  }

  const photos = car.photos.length > 0
    ? car.photos.sort((a, b) => a.sortOrder - b.sortOrder).map((p) => p.url)
    : [];

  const transmissionLabel = car.transmission === Transmission.Automatic ? 'Automatic' : 'Manual';
  const fuelLabel = car.fuelType === FuelType.Electric ? 'Electric' : car.fuelType === FuelType.Diesel ? 'Diesel' : car.fuelType === FuelType.Hybrid ? 'Hybrid' : 'Gasoline';

  return (
    <div className="container py-8 space-y-8">
      {/* Photo Gallery */}
      <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[16/7]">
        {photos.length > 0 ? (
          <>
            <img src={photos[photoIndex]} alt={`${car.year} ${car.make} ${car.model}`} className="w-full h-full object-cover" />
            {photos.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl"
                  onClick={() => setPhotoIndex((photoIndex - 1 + photos.length) % photos.length)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl"
                  onClick={() => setPhotoIndex((photoIndex + 1) % photos.length)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-3 right-3">
                  <Button variant="secondary" size="sm" className="gap-1 rounded-xl">
                    <ImageIcon className="h-4 w-4" />
                    {photoIndex + 1} / {photos.length}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Car className="h-24 w-24 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold">
                  {car.year} {car.make} {car.model}
                  {car.trim && <span className="text-muted-foreground font-normal"> {car.trim}</span>}
                </h1>
                <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {car.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {car.averageRating > 0 ? `${car.averageRating.toFixed(1)} (${car.tripCount} trips)` : 'New'}
                  </span>
                </div>
              </div>
              {car.isInstantBook && (
                <Badge className="gap-1 rounded-xl"><Zap className="h-3 w-3" /> Instant</Badge>
              )}
            </div>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Car, label: 'Body type', value: car.bodyType },
              { icon: Users, label: 'Seats', value: `${car.seats}` },
              { icon: Cog, label: 'Transmission', value: transmissionLabel },
              { icon: Fuel, label: 'Fuel type', value: fuelLabel },
            ].map((spec) => (
              <div key={spec.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <spec.icon className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{spec.label}</p>
                  <p className="font-medium text-sm">{spec.value}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="reviews">Reviews{car.reviews.length > 0 ? ` (${car.reviews.length})` : ''}</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-6 pt-4">
              {car.description && (
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{car.description}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {car.year && (
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground">Year</p>
                    <p className="font-medium">{car.year}</p>
                  </div>
                )}
                {car.odometerKm && (
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground">Mileage</p>
                    <p className="font-medium font-mono">{car.odometerKm.toLocaleString()} km</p>
                  </div>
                )}
                {car.color && (
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground">Color</p>
                    <p className="font-medium">{car.color}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="features" className="pt-4">
              {car.features.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {car.features.map((f) => (
                    <Badge key={f} variant="secondary" className="rounded-lg text-sm py-1.5 px-3">{f}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No features listed</p>
              )}
            </TabsContent>

            <TabsContent value="rules" className="pt-4">
              {car.rules ? (
                <p className="text-muted-foreground whitespace-pre-line">{car.rules}</p>
              ) : (
                <p className="text-muted-foreground">-</p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="pt-4">
              {car.reviews.length > 0 ? (
                <div className="space-y-4">
                  {car.reviews.slice(0, 10).map((review) => (
                    <div key={review.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.authorPhotoUrl ?? undefined} />
                          <AvatarFallback>{review.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{review.authorName}</p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                              />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                      <Separator />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No reviews yet</p>
              )}
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Host */}
          {car.host && (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50">
              <Avatar className="h-14 w-14">
                <AvatarImage src={car.host.profilePhotoUrl ?? undefined} />
                <AvatarFallback>{getInitials(car.host.firstName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading font-semibold">Hosted by {car.host.firstName}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {car.host.averageRatingAsHost > 0 ? car.host.averageRatingAsHost.toFixed(1) : 'New'}
                  </span>
                  <span>{car.host.hostTripCount} trips</span>
                  <span>Joined {formatDate(car.host.createdAt)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Booking Card */}
        <div>
          <Card className="sticky top-20 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2">
                <span className="text-3xl font-mono">{formatUzs(car.dailyPriceUsd, false)}</span>
                <span className="text-base text-muted-foreground font-normal">so'm/day</span>
              </CardTitle>
              {car.weeklyDiscountPercent > 0 && (
                <p className="text-sm text-green-600">{car.weeklyDiscountPercent}% weekly discount</p>
              )}
              {car.monthlyDiscountPercent > 0 && (
                <p className="text-sm text-green-600">{car.monthlyDiscountPercent}% monthly discount</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Pick-up</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Drop-off</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="rounded-lg"
                  />
                </div>
              </div>

              {quoteLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              )}

              {quote && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{formatUzs(quote.dailyRateUsd, false)} x {quote.days} days</span>
                    <span className="font-mono">{formatUzs(quote.subtotalUsd)}</span>
                  </div>
                  {quote.discountAmount && quote.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-mono">-{formatUzs(quote.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span className="font-mono">{formatUzs(quote.cleaningFeeUsd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service fee</span>
                    <span className="font-mono">{formatUzs(quote.serviceFeeUsd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="font-mono">{formatUzs(quote.taxesUsd)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span className="font-mono">{formatUzs(quote.totalChargedUsd)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {formatUzs(quote.securityDepositHoldUsd)} refundable deposit
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <Label>Message to host (optional)</Label>
                <Input
                  placeholder="Introduce yourself..."
                  value={guestMessage}
                  onChange={(e) => setGuestMessage(e.target.value)}
                  className="rounded-lg"
                />
              </div>

              <Button
                className="w-full rounded-xl"
                size="lg"
                disabled={!startDate || !endDate || !quote || bookingMutation.isPending}
                onClick={handleBook}
              >
                {bookingMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : car.isInstantBook ? (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Book now
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Book now
                  </span>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Min {car.minTripDays} days / Max {car.maxTripDays} days
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
