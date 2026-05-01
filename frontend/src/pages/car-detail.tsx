import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin, Calendar, Shield, Fuel, Cog, Users, Zap,
  ChevronLeft, ChevronRight, Car, Grid2x2, X, ArrowLeft, ShieldCheck,
  CheckCircle2, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useCarDetail } from '@/hooks/use-cars';
import { useQuote, useCreateBooking } from '@/hooks/use-bookings';
import { useAuthStore } from '@/stores/auth-store';
import { useProfile } from '@/hooks/use-auth';
import { formatUsd, formatDate, getInitials } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Transmission, FuelType } from '@/types';
import YandexMapView from '@/components/shared/YandexMapView';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const { data: profile } = useProfile();
  const identityVerified = profile?.isIdentityVerified ?? user?.isIdentityVerified ?? false;
  const { data: car, isLoading } = useCarDetail(id!);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Minimum selectable start date: local date of (now + advanceNoticeHours)
  // We use local date components (not UTC) so Tashkent users can always book "tomorrow".
  const minStartDate = (() => {
    const d = new Date(Date.now() + ((car?.advanceNoticeHours ?? 24) * 3600000));
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dy}`;
  })();

  // Convert a date-picker value ("YYYY-MM-DD") to a UTC ISO string.
  // Use end-of-local-day (T23:59:00) so the 24h advance-notice window is
  // maximised for users in UTC+ timezones (e.g. Tashkent UTC+5).
  const toUtc = (dateStr: string) => new Date(dateStr + 'T23:59:00').toISOString();

  // Minimum end date = 1 day after the chosen start (so at least 1 trip day)
  const minEndDate = (() => {
    const base = startDate || minStartDate;
    const parts = base.split('-').map(Number);
    const next = new Date(parts[0]!, parts[1]! - 1, parts[2]! + 1);
    return [next.getFullYear(), String(next.getMonth() + 1).padStart(2, '0'), String(next.getDate()).padStart(2, '0')].join('-');
  })();
  const [guestMessage, setGuestMessage] = useState('');
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);

  const quoteParams = car && startDate && endDate
    ? { carId: car.id, startUtc: toUtc(startDate), endUtc: toUtc(endDate) }
    : null;
  const { data: quote, isLoading: quoteLoading } = useQuote(quoteParams);
  const bookingMutation = useCreateBooking();

  const handleBook = () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: `/cars/${id}` } } });
      return;
    }
    if (!identityVerified) {
      setShowVerifyBanner(true);
      return;
    }
    if (!car || !startDate || !endDate) return;
    bookingMutation.mutate(
      {
        carId: car.id,
        startUtc: toUtc(startDate),
        endUtc: toUtc(endDate),
        guestMessage: guestMessage || undefined,
      },
      {
        onSuccess: (booking) => {
          toast({
            title: car.isInstantBook ? 'Booking confirmed!' : 'Request sent!',
            description: car.isInstantBook
              ? 'Your booking is confirmed. Check your messages to chat with the host.'
              : 'Request sent. The host will reply in your messages.',
          });
          navigate(`/messages/${booking.id}`);
        },
        onError: () => {
          toast({ title: 'Error', description: 'Please choose different dates.', variant: 'destructive' });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[70vh] w-full rounded-none" />
        <div className="container max-w-6xl pt-8 space-y-5">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <div className="grid lg:grid-cols-[1fr_360px] gap-12 pt-2">
            <div className="space-y-4">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-[480px] w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="container py-20 text-center space-y-4">
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

  const specs = [
    { icon: Car, label: 'Body', value: car.bodyType },
    { icon: Users, label: 'Seats', value: `${car.seats} seats` },
    { icon: Cog, label: 'Gearbox', value: transmissionLabel },
    { icon: Fuel, label: 'Fuel', value: fuelLabel },
  ];

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* ── GALLERY ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Floating back button */}
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-black/60 backdrop-blur-md text-sm font-semibold px-3.5 py-2 rounded-full shadow-md hover:bg-white dark:hover:bg-black/80 transition-colors border border-black/5 dark:border-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </motion.button>

        {photos.length === 0 ? (
          <div className="h-[65vh] bg-muted flex items-center justify-center">
            <Car className="h-24 w-24 text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Desktop 5-photo Airbnb grid */}
            <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-0.5 h-[75vh]">
              <button
                className="col-span-2 row-span-2 relative overflow-hidden group"
                onClick={() => { setPhotoIndex(0); setLightboxOpen(true); }}
              >
                <img
                  src={photos[0]}
                  alt="Main"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </button>

              {photos.slice(1, 5).map((url, i) => (
                <button
                  key={i}
                  className="relative overflow-hidden group"
                  onClick={() => { setPhotoIndex(i + 1); setLightboxOpen(true); }}
                >
                  <img
                    src={url}
                    alt={`Photo ${i + 2}`}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  {i === 3 && photos.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">+{photos.length - 5}</span>
                    </div>
                  )}
                </button>
              ))}

              {Array.from({ length: Math.max(0, 4 - (photos.length - 1)) }).map((_, i) => (
                <div key={`e-${i}`} className="bg-muted" />
              ))}
            </div>

            {/* Show all photos button — floating bottom-right */}
            {photos.length > 1 && (
              <button
                className="hidden md:flex absolute bottom-5 right-5 z-10 items-center gap-2 bg-white/95 dark:bg-black/70 backdrop-blur-sm text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl border border-black/8 dark:border-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                onClick={() => { setPhotoIndex(0); setLightboxOpen(true); }}
              >
                <Grid2x2 className="h-4 w-4" />
                Show all {photos.length} photos
              </button>
            )}

            {/* Mobile carousel */}
            <div className="md:hidden relative aspect-[4/3] overflow-hidden bg-muted">
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={photoIndex}
                  src={photos[photoIndex]}
                  alt={`Photo ${photoIndex + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>
              {photos.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm text-white rounded-full p-2 hover:bg-black/60 transition-colors z-10"
                    onClick={() => setPhotoIndex((photoIndex - 1 + photos.length) % photos.length)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm text-white rounded-full p-2 hover:bg-black/60 transition-colors z-10"
                    onClick={() => setPhotoIndex((photoIndex + 1) % photos.length)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {photos.slice(0, 8).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className={`rounded-full transition-all ${i === photoIndex ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60'}`}
                      />
                    ))}
                  </div>
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full z-10 tabular-nums">
                    {photoIndex + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── PAGE BODY ────────────────────────────────────────────────── */}
      <div className="container max-w-6xl">
        {/* Title + meta */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="pt-8 pb-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold leading-tight tracking-tight">
                {car.year} {car.make} {car.model}
                {car.trim && (
                  <span className="text-muted-foreground font-normal text-2xl"> · {car.trim}</span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {car.city}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {car.averageRating > 0 ? car.averageRating.toFixed(1) : 'New'}
                  </span>
                  {car.tripCount > 0 && (
                    <span className="text-muted-foreground">· {car.tripCount} trip{car.tripCount !== 1 ? 's' : ''}</span>
                  )}
                </span>
              </div>
            </div>
            {car.isInstantBook && (
              <Badge className="gap-1.5 px-3.5 py-1.5 text-sm rounded-full">
                <Zap className="h-3.5 w-3.5" />
                Instant Book
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Specs bar */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="mt-6">
          <div className="inline-flex flex-wrap items-stretch divide-x divide-border border rounded-2xl overflow-hidden bg-muted/20">
            {specs.map((spec, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <spec.icon className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{spec.label}</p>
                  <p className="text-sm font-semibold leading-tight mt-0.5">{spec.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <Separator className="my-8" />

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-12 items-start">

          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2} className="space-y-8 min-w-0">
            <Tabs defaultValue="description">
              {/* Underline-style tab list */}
              <TabsList className="border-b w-full rounded-none bg-transparent p-0 justify-start h-auto gap-6">
                {[
                  { value: 'description', label: 'Description' },
                  { value: 'features', label: 'Features' },
                  { value: 'rules', label: 'Rules' },
                  { value: 'reviews', label: `Reviews${car.reviews.length > 0 ? ` (${car.reviews.length})` : ''}` },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none px-0 pb-3 text-muted-foreground font-medium hover:text-foreground transition-colors"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="description" className="mt-6 space-y-6">
                {car.description ? (
                  <div className="relative">
                    <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-primary/30 rounded-full" />
                    <p className="pl-5 text-[15px] leading-[1.85] text-foreground/80 whitespace-pre-line">
                      {car.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No description provided.</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {car.year && (
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Year</p>
                      <p className="font-semibold mt-1">{car.year}</p>
                    </div>
                  )}
                  {car.odometerKm != null && (
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Mileage</p>
                      <p className="font-semibold mt-1 font-mono">{car.odometerKm.toLocaleString()} km</p>
                    </div>
                  )}
                  {car.color && (
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Color</p>
                      <p className="font-semibold mt-1">{car.color}</p>
                    </div>
                  )}
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Doors</p>
                    <p className="font-semibold mt-1">{car.doors}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Seats</p>
                    <p className="font-semibold mt-1">{car.seats}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Fuel</p>
                    <p className="font-semibold mt-1">{fuelLabel}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="mt-6 space-y-6">
                {/* Technical specs grid */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Technical Specifications</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Body type', value: car.bodyType },
                      { label: 'Transmission', value: transmissionLabel },
                      { label: 'Fuel type', value: fuelLabel },
                      { label: 'Seats', value: `${car.seats}` },
                      { label: 'Doors', value: `${car.doors}` },
                      ...(car.odometerKm != null ? [{ label: 'Mileage', value: `${car.odometerKm.toLocaleString()} km` }] : []),
                      ...(car.color ? [{ label: 'Color', value: car.color }] : []),
                      ...(car.dailyMileageLimitKm ? [{ label: 'Daily limit', value: `${car.dailyMileageLimitKm} km/day` }] : []),
                    ].map((s) => (
                      <div key={s.label} className="p-3.5 rounded-xl bg-muted/40 border border-border/50">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{s.label}</p>
                        <p className="font-semibold mt-1 text-sm">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Feature checklist */}
                {car.features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Included Features</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {car.features.map((f) => (
                        <div key={f} className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg bg-muted/30 border border-border/40">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {car.features.length === 0 && (
                  <p className="text-muted-foreground italic text-sm">No additional features listed.</p>
                )}
              </TabsContent>

              <TabsContent value="rules" className="mt-6">
                {car.rules ? (
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{car.rules}</p>
                ) : (
                  <p className="text-muted-foreground italic">No rules specified.</p>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                {car.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {car.reviews.slice(0, 10).map((review, i) => (
                      <motion.div
                        key={review.id}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={i * 0.4}
                        className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={review.authorPhotoUrl ?? undefined} />
                            <AvatarFallback className="text-xs">{review.authorName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold truncate">{review.authorName}</p>
                              <span className="text-xs text-muted-foreground shrink-0">{formatDate(review.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-0.5 mt-1">
                              {Array.from({ length: 5 }, (_, j) => (
                                <Star
                                  key={j}
                                  className={`h-3 w-3 ${j < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No reviews yet — be the first to book!</p>
                )}
              </TabsContent>
            </Tabs>

            <Separator />

            {/* ── Minimum Requirements ─────────────────────────── */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3.5}>
              <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/40 bg-muted/30">
                  <Info className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="font-semibold text-sm">Minimum Requirements</h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {[
                    {
                      label: 'Security deposit',
                      value: car.securityDepositUsd > 0
                        ? `${Math.round(car.securityDepositUsd * 12800).toLocaleString('ru-RU')} UZS`
                        : 'No deposit required',
                    },
                    { label: 'Driving experience', value: '5 years minimum' },
                    { label: 'Required documents', value: 'Passport and valid driver\'s license' },
                    { label: 'Minimum age', value: '25 years' },
                  ].map((r) => (
                    <div key={r.label} className="flex items-start justify-between gap-4 text-sm">
                      <span className="text-muted-foreground shrink-0">{r.label}</span>
                      <span className="font-medium text-right">{r.value}</span>
                    </div>
                  ))}
                  {car.securityDepositUsd > 0 && (
                    <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
                      * The deposit is refunded within 7 business days after the vehicle is returned.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            <Separator />

            {/* Host card */}
            {car.host && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={3}
                className="flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/10 border border-border/40"
              >
                <Avatar className="h-16 w-16 ring-2 ring-primary/20 shrink-0">
                  <AvatarImage src={car.host.profilePhotoUrl ?? undefined} />
                  <AvatarFallback className="text-lg font-semibold">{getInitials(car.host.firstName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-0.5">Hosted by</p>
                  <p className="font-heading font-bold text-xl leading-tight">{car.host.firstName}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1.5">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-foreground">
                        {car.host.averageRatingAsHost > 0 ? car.host.averageRatingAsHost.toFixed(1) : 'New host'}
                      </span>
                    </span>
                    {car.host.hostTripCount > 0 && <span>{car.host.hostTripCount} trips hosted</span>}
                    <span>Joined {formatDate(car.host.createdAt)}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {car.latitude && car.longitude && (
              <>
                <Separator />
                <YandexMapView lat={car.latitude} lng={car.longitude} city={car.city} />
              </>
            )}
          </motion.div>

          {/* ── RIGHT COLUMN: Booking card ─────────────────────────── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1.5}
            className="sticky top-20"
          >
            <div className="rounded-3xl border bg-card shadow-2xl shadow-black/[0.07] overflow-hidden">
              {/* Price header */}
              <div className="px-6 pt-6 pb-5 border-b bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-baseline gap-2">
                  <span className="text-[2.4rem] font-bold font-mono leading-none tracking-tight">
                    {formatUsd(car.dailyPriceUsd)}
                  </span>
                  <span className="text-muted-foreground font-normal">/ day</span>
                </div>
                {(car.weeklyDiscountPercent > 0 || car.monthlyDiscountPercent > 0) && (
                  <div className="mt-2 space-y-0.5">
                    {car.weeklyDiscountPercent > 0 && (
                      <p className="text-xs text-green-600 font-medium">🏷 {car.weeklyDiscountPercent}% weekly discount</p>
                    )}
                    {car.monthlyDiscountPercent > 0 && (
                      <p className="text-xs text-green-600 font-medium">🏷 {car.monthlyDiscountPercent}% monthly discount</p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                {/* Date pickers — Airbnb inline style */}
                <div className="grid grid-cols-2 divide-x divide-border rounded-xl border overflow-hidden">
                  <div className="p-3 hover:bg-muted/30 transition-colors focus-within:bg-muted/30">
                    <Label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground block mb-1.5 cursor-pointer">
                      Pick-up
                    </Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={minStartDate}
                      className="border-0 p-0 h-auto text-sm font-semibold focus-visible:ring-0 bg-transparent shadow-none"
                    />
                  </div>
                  <div className="p-3 hover:bg-muted/30 transition-colors focus-within:bg-muted/30">
                    <Label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground block mb-1.5 cursor-pointer">
                      Drop-off
                    </Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={minEndDate}
                      className="border-0 p-0 h-auto text-sm font-semibold focus-visible:ring-0 bg-transparent shadow-none"
                    />
                  </div>
                </div>

                {/* Quote loading */}
                {quoteLoading && (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                )}

                {/* Animated price breakdown */}
                <AnimatePresence>
                  {quote && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl bg-muted/40 px-4 py-3.5 space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>{formatUsd(quote.dailyRateUsd)} × {quote.days} day{quote.days !== 1 ? 's' : ''}</span>
                          <span className="font-mono tabular-nums">{formatUsd(quote.subtotalUsd)}</span>
                        </div>
                        {quote.discountAmount != null && quote.discountAmount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span className="font-mono tabular-nums">−{formatUsd(quote.discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-muted-foreground">
                          <span>Cleaning fee</span>
                          <span className="font-mono tabular-nums">{formatUsd(quote.cleaningFeeUsd)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Service fee</span>
                          <span className="font-mono tabular-nums">{formatUsd(quote.serviceFeeUsd)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Tax</span>
                          <span className="font-mono tabular-nums">{formatUsd(quote.taxesUsd)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                          <span>Total</span>
                          <span className="font-mono tabular-nums">{formatUsd(quote.totalChargedUsd)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                          <Shield className="h-3.5 w-3.5 shrink-0" />
                          {formatUsd(quote.securityDepositHoldUsd)} refundable deposit
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Message to host (optional)</Label>
                  <Input
                    placeholder="Introduce yourself…"
                    value={guestMessage}
                    onChange={(e) => setGuestMessage(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                {/* Book button */}
                <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}>
                  <Button
                    className="w-full rounded-xl h-12 text-base font-semibold gap-2 shadow-lg shadow-primary/20"
                    size="lg"
                    disabled={!startDate || !endDate || !quote || bookingMutation.isPending}
                    onClick={handleBook}
                  >
                    {bookingMutation.isPending ? (
                      <>
                        <Calendar className="h-4 w-4 animate-spin" />
                        Confirming…
                      </>
                    ) : car.isInstantBook ? (
                      <>
                        <Zap className="h-4 w-4" />
                        Book now
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        Request to book
                      </>
                    )}
                  </Button>
                </motion.div>

                <p className="text-xs text-center text-muted-foreground">
                  Min {car.minTripDays} day{car.minTripDays !== 1 ? 's' : ''} · Max {car.maxTripDays} days
                </p>

                {/* Identity verification banner */}
                <AnimatePresence>
                  {showVerifyBanner && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Identity verification required</p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                            You need to verify your identity before booking a car. It only takes a few minutes.
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full rounded-xl"
                        size="sm"
                        onClick={() => navigate('/onboarding?step=3')}
                      >
                        <ShieldCheck className="h-4 w-4 mr-1.5" />
                        Verify my identity
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── LIGHTBOX ─────────────────────────────────────────────────── */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-screen-xl w-full h-[90vh] p-0 bg-black border-0 flex flex-col gap-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3.5 shrink-0">
            <span className="text-white/50 text-sm tabular-nums font-medium">
              {photoIndex + 1} / {photos.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Main image with animated transitions */}
          <div className="flex-1 flex items-center justify-center relative px-14 min-h-0">
            <button
              className="absolute left-3 text-white/80 hover:text-white hover:bg-white/15 rounded-full h-11 w-11 flex items-center justify-center transition-colors"
              onClick={() => setPhotoIndex((photoIndex - 1 + photos.length) % photos.length)}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={photoIndex}
                src={photos[photoIndex]}
                alt={`Photo ${photoIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-xl select-none"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              />
            </AnimatePresence>

            <button
              className="absolute right-3 text-white/80 hover:text-white hover:bg-white/15 rounded-full h-11 w-11 flex items-center justify-center transition-colors"
              onClick={() => setPhotoIndex((photoIndex + 1) % photos.length)}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="shrink-0 flex gap-2 overflow-x-auto px-5 py-3.5 scrollbar-none">
            {photos.map((url, i) => (
              <button
                key={i}
                onClick={() => setPhotoIndex(i)}
                className={`shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  i === photoIndex
                    ? 'border-white opacity-100 scale-100'
                    : 'border-transparent opacity-40 hover:opacity-75 hover:scale-[1.02]'
                }`}
              >
                <img src={url} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
