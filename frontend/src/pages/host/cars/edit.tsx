import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ChevronLeft, Check, UploadCloud, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useHostCar, useUpdateCar, useAvailableFeatures,
  useUploadCarPhoto, useDeleteCarPhoto, useSetCarPhotoCover,
} from '@/hooks/use-host';
import { useToast } from '@/hooks/use-toast';
import YandexMapPicker from '@/components/shared/YandexMapPicker';

const BODY_TYPES = ['Sedan','SUV','Hatchback','Coupe','Convertible','Truck','Van','Minivan','Wagon','SportsCar'] as const;
const FUEL_TYPES = ['Gasoline','Diesel','Hybrid','Electric','PlugInHybrid','CNG'] as const;

const schema = z.object({
  // Vehicle identity
  make: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  year: z.coerce.number().min(2000).max(new Date().getFullYear() + 1),
  trim: z.string().optional(),
  transmission: z.enum(['Automatic', 'Manual']),
  bodyType: z.enum(BODY_TYPES),
  fuelType: z.enum(FUEL_TYPES),
  seats: z.coerce.number().min(2).max(12),
  doors: z.coerce.number().min(2).max(6),
  color: z.string().optional(),
  odometerKm: z.coerce.number().min(0).optional(),
  // Pricing
  dailyPriceUzs: z.coerce.number().min(50000, 'Minimum 50,000 UZS'),
  weeklyDiscountPercent: z.coerce.number().min(0).max(50),
  monthlyDiscountPercent: z.coerce.number().min(0).max(70),
  cleaningFeeUzs: z.coerce.number().min(0),
  securityDepositUzs: z.coerce.number().min(0),
  // Trip settings
  minTripDays: z.coerce.number().min(1).max(30),
  maxTripDays: z.coerce.number().min(1).max(90),
  advanceNoticeHours: z.coerce.number().min(0).max(168),
  dailyMileageLimitKm: z.coerce.number().min(0),
  extraKmFeeUzs: z.coerce.number().min(0),
  isInstantBook: z.boolean(),
  // Location
  addressLine: z.string().optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  privacyRadiusMeters: z.coerce.number().min(200).max(5000),
  canDeliverToAirports: z.boolean(),
  selfCheckInAvailable: z.boolean(),
  gpsTrackerInstalled: z.boolean(),
  // Details
  description: z.string().optional(),
  rules: z.string().optional(),
  features: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

export default function HostCarEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: car, isLoading } = useHostCar(id!);
  const update = useUpdateCar(id!);
  const { data: availableFeatures = [] } = useAvailableFeatures();
  const uploadPhoto = useUploadCarPhoto(id!);
  const deletePhoto = useDeleteCarPhoto(id!);
  const setCover = useSetCarPhotoCover(id!);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      trim: '',
      transmission: 'Automatic',
      bodyType: 'Sedan',
      fuelType: 'Gasoline',
      seats: 5,
      doors: 4,
      color: '',
      odometerKm: 0,
      dailyPriceUzs: 0,
      weeklyDiscountPercent: 0,
      monthlyDiscountPercent: 0,
      cleaningFeeUzs: 0,
      securityDepositUzs: 0,
      minTripDays: 1,
      maxTripDays: 30,
      advanceNoticeHours: 4,
      dailyMileageLimitKm: 0,
      extraKmFeeUzs: 0,
      isInstantBook: true,
      addressLine: '',
      city: '',
      lat: undefined,
      lng: undefined,
      privacyRadiusMeters: 300,
      canDeliverToAirports: false,
      selfCheckInAvailable: false,
      gpsTrackerInstalled: false,
      description: '',
      rules: '',
      features: [],
    },
  });

  useEffect(() => {
    if (!car) return;
    reset({
      make: car.make ?? '',
      model: car.model ?? '',
      year: car.year ?? new Date().getFullYear(),
      trim: car.trim ?? '',
      transmission: car.transmission ?? 'Automatic',
      bodyType: car.bodyType ?? 'Sedan',
      fuelType: car.fuelType ?? 'Gasoline',
      seats: car.seats ?? 5,
      doors: car.doors ?? 4,
      color: car.color ?? '',
      odometerKm: car.odometerKm ?? 0,
      dailyPriceUzs: car.dailyPriceUzs ?? 0,
      weeklyDiscountPercent: car.weeklyDiscountPercent ?? 0,
      monthlyDiscountPercent: car.monthlyDiscountPercent ?? 0,
      cleaningFeeUzs: car.cleaningFeeUzs ?? 0,
      securityDepositUzs: car.securityDepositUzs ?? 0,
      minTripDays: car.minTripDays ?? 1,
      maxTripDays: car.maxTripDays ?? 30,
      advanceNoticeHours: car.advanceNoticeHours ?? 4,
      dailyMileageLimitKm: car.dailyMileageLimitKm ?? 0,
      extraKmFeeUzs: car.extraKmFeeUzs ?? 0,
      isInstantBook: car.isInstantBook ?? true,
      addressLine: car.addressLine ?? '',
      city: car.city ?? '',
      lat: car.lat ?? undefined,
      lng: car.lng ?? undefined,
      privacyRadiusMeters: car.privacyRadiusMeters ?? 300,
      canDeliverToAirports: car.canDeliverToAirports ?? false,
      selfCheckInAvailable: car.selfCheckInAvailable ?? false,
      gpsTrackerInstalled: car.gpsTrackerInstalled ?? false,
      description: car.description ?? '',
      rules: car.rules ?? '',
      features: car.features ?? [],
    });
  }, [car, reset]);

  function toggleFeature(name: string) {
    const current = watch('features') ?? [];
    const next = current.includes(name)
      ? current.filter((f) => f !== name)
      : [...current, name];
    setValue('features', next, { shouldDirty: true });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      await uploadPhoto.mutateAsync(file);
    }
    e.target.value = '';
  }

  async function handleDeletePhoto(photoId: string) {
    await deletePhoto.mutateAsync(photoId);
  }

  async function handleSetCover(photoId: string) {
    await setCover.mutateAsync(photoId);
  }

  async function onSubmit(values: FormValues) {
    await update.mutateAsync({
      make: values.make,
      model: values.model,
      year: values.year,
      trim: values.trim,
      transmission: values.transmission,
      bodyType: values.bodyType,
      fuelType: values.fuelType,
      seats: values.seats,
      doors: values.doors,
      color: values.color,
      odometerKm: values.odometerKm,
      dailyPriceUzs: values.dailyPriceUzs,
      weeklyDiscountPercent: values.weeklyDiscountPercent,
      monthlyDiscountPercent: values.monthlyDiscountPercent,
      cleaningFeeUzs: values.cleaningFeeUzs,
      securityDepositUzs: values.securityDepositUzs,
      minTripDays: values.minTripDays,
      maxTripDays: values.maxTripDays,
      advanceNoticeHours: values.advanceNoticeHours,
      dailyMileageLimitKm: values.dailyMileageLimitKm,
      extraKmFeeUzs: values.extraKmFeeUzs,
      isInstantBook: values.isInstantBook,
      addressLine: values.addressLine,
      city: values.city,
      lat: values.lat,
      lng: values.lng,
      privacyRadiusMeters: values.privacyRadiusMeters,
      canDeliverToAirports: values.canDeliverToAirports,
      selfCheckInAvailable: values.selfCheckInAvailable,
      gpsTrackerInstalled: values.gpsTrackerInstalled,
      description: values.description,
      rules: values.rules,
      features: values.features,
    });
    toast({ title: 'Listing updated', description: 'Your changes have been saved.' });
    navigate('/host/cars');
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Car not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/host/cars')}>Back to My Cars</Button>
      </div>
    );
  }

  const lat = watch('lat');
  const lng = watch('lng');
  const selectedFeatures = watch('features') ?? [];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/host/cars')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Listing</h1>
          <p className="text-muted-foreground text-sm">{car.make} {car.model} {car.year}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Photos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Photos</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadPhoto.isPending}
                onClick={() => photoInputRef.current?.click()}
              >
                {uploadPhoto.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UploadCloud className="h-4 w-4 mr-1" />}
                Add Photos
              </Button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
          </CardHeader>
          <CardContent>
            {(!car?.photos || car.photos.length === 0) ? (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors"
              >
                <UploadCloud className="h-8 w-8" />
                <span className="text-sm">Click to upload photos</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {car.photos.map((photo: { id: string; url: string; isCover: boolean }) => (
                  <div key={photo.id} className="relative group aspect-[4/3] rounded-lg overflow-hidden border">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    {/* Cover badge */}
                    {photo.isCover && (
                      <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5" /> Cover
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!photo.isCover && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(photo.id)}
                          disabled={setCover.isPending}
                          className="text-[10px] font-semibold bg-white/20 hover:bg-white/40 text-white px-2 py-1 rounded-full transition-colors flex items-center gap-1"
                          title="Set as cover"
                        >
                          <Star className="h-3 w-3" /> Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        disabled={deletePhoto.isPending}
                        className="bg-white/20 hover:bg-destructive/80 text-white p-1.5 rounded-full transition-colors"
                        title="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Upload more tile */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadPhoto.isPending}
                  className="aspect-[4/3] rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors"
                >
                  {uploadPhoto.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                  <span className="text-xs">Add more</span>
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">Hover a photo to set cover or remove. First photo becomes the cover automatically.</p>
          </CardContent>
        </Card>

        {/* Vehicle Identity */}
        <Card>
          <CardHeader><CardTitle className="text-base">Vehicle Identity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Make</Label>
                <Input {...register('make')} placeholder="Toyota" />
                {errors.make && <p className="text-xs text-destructive">{errors.make.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Model</Label>
                <Input {...register('model')} placeholder="Camry" />
                {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Year</Label>
                <Input type="number" {...register('year')} />
              </div>
              <div className="space-y-1">
                <Label>Trim</Label>
                <Input {...register('trim')} placeholder="e.g. XLE" />
              </div>
              <div className="space-y-1">
                <Label>Seats</Label>
                <Input type="number" {...register('seats')} min={2} max={12} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Body Type</Label>
                <Select
                  value={watch('bodyType')}
                  onValueChange={(v) => setValue('bodyType', v as any, { shouldDirty: true })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BODY_TYPES.map((bt) => (
                      <SelectItem key={bt} value={bt}>{bt === 'SportsCar' ? 'Sports Car' : bt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Transmission</Label>
                <Select
                  value={watch('transmission')}
                  onValueChange={(v) => setValue('transmission', v as any, { shouldDirty: true })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Automatic">Automatic</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Fuel Type</Label>
                <Select
                  value={watch('fuelType')}
                  onValueChange={(v) => setValue('fuelType', v as any, { shouldDirty: true })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gasoline">Gasoline</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Electric">Electric</SelectItem>
                    <SelectItem value="PlugInHybrid">Plug-in Hybrid</SelectItem>
                    <SelectItem value="CNG">CNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Doors</Label>
                <Input type="number" {...register('doors')} min={2} max={6} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Daily Rate (UZS)</Label>
                <Input type="number" {...register('dailyPriceUzs')} />
                {errors.dailyPriceUzs && <p className="text-xs text-destructive">{errors.dailyPriceUzs.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Security Deposit (UZS)</Label>
                <Input type="number" {...register('securityDepositUzs')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Cleaning Fee (UZS)</Label>
                <Input type="number" {...register('cleaningFeeUzs')} />
              </div>
              <div className="space-y-1">
                <Label>Weekly Discount (%)</Label>
                <Input type="number" {...register('weeklyDiscountPercent')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Monthly Discount (%)</Label>
                <Input type="number" {...register('monthlyDiscountPercent')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip settings */}
        <Card>
          <CardHeader><CardTitle className="text-base">Trip Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Min Days</Label>
                <Input type="number" {...register('minTripDays')} />
              </div>
              <div className="space-y-1">
                <Label>Max Days</Label>
                <Input type="number" {...register('maxTripDays')} />
              </div>
              <div className="space-y-1">
                <Label>Advance Notice (hrs)</Label>
                <Input type="number" {...register('advanceNoticeHours')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Mileage Limit / Day (km)</Label>
                <Input type="number" {...register('dailyMileageLimitKm')} />
                <p className="text-xs text-muted-foreground">0 = unlimited</p>
              </div>
              <div className="space-y-1">
                <Label>Extra Mileage Fee (UZS/km)</Label>
                <Input type="number" {...register('extraKmFeeUzs')} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">Instant Book</p>
                <p className="text-xs text-muted-foreground">Guests book without waiting for approval</p>
              </div>
              <Switch
                checked={watch('isInstantBook')}
                onCheckedChange={(v) => setValue('isInstantBook', v, { shouldDirty: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location & Availability */}
        <Card>
          <CardHeader><CardTitle className="text-base">Location & Availability</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Street Address</Label>
                <Input {...register('addressLine')} placeholder="e.g. Amir Temur ko'chasi 1" />
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input {...register('city')} placeholder="e.g. Tashkent" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Pin Location on Map</Label>
              <p className="text-xs text-muted-foreground">Renters see an approximate zone only.</p>
              <YandexMapPicker
                lat={lat}
                lng={lng}
                onChange={(latV, lngV) => {
                  setValue('lat', latV, { shouldDirty: true });
                  setValue('lng', lngV, { shouldDirty: true });
                }}
                onGeocode={(address, city) => {
                  if (address) setValue('addressLine', address, { shouldDirty: true });
                  if (city) setValue('city', city, { shouldDirty: true });
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Privacy Radius (meters)</Label>
              <Input type="number" {...register('privacyRadiusMeters')} />
              <p className="text-xs text-muted-foreground">Exact address hidden within this radius.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Airport Delivery</p>
                  <p className="text-xs text-muted-foreground">Offer delivery to Tashkent airports</p>
                </div>
                <Switch
                  checked={watch('canDeliverToAirports')}
                  onCheckedChange={(v) => setValue('canDeliverToAirports', v, { shouldDirty: true })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Self Check-in</p>
                  <p className="text-xs text-muted-foreground">Renter picks up without meeting you</p>
                </div>
                <Switch
                  checked={watch('selfCheckInAvailable')}
                  onCheckedChange={(v) => setValue('selfCheckInAvailable', v, { shouldDirty: true })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">GPS Tracker Installed</p>
                  <p className="text-xs text-muted-foreground">Increases trust and may improve tier</p>
                </div>
                <Switch
                  checked={watch('gpsTrackerInstalled')}
                  onCheckedChange={(v) => setValue('gpsTrackerInstalled', v, { shouldDirty: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        {availableFeatures.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Features & Amenities</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {availableFeatures.map((name) => {
                  const checked = selectedFeatures.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleFeature(name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                        checked
                          ? 'bg-primary/10 border-primary text-primary font-medium'
                          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                      }`}
                    >
                      <span className={`flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center ${checked ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {checked && <Check className="h-3 w-3 text-white" />}
                      </span>
                      {name}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Condition */}
        <Card>
          <CardHeader><CardTitle className="text-base">Condition</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Color</Label>
                <Input {...register('color')} placeholder="e.g. Pearl White" />
              </div>
              <div className="space-y-1">
                <Label>Odometer (km)</Label>
                <Input type="number" {...register('odometerKm')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description & Rules */}
        <Card>
          <CardHeader><CardTitle className="text-base">Description & Rules</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                {...register('description')}
                rows={4}
                placeholder="Tell guests what makes your car special…"
              />
            </div>
            <div className="space-y-1">
              <Label>House Rules</Label>
              <Textarea
                {...register('rules')}
                rows={3}
                placeholder="No smoking, return with full tank…"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/host/cars')}>
            Cancel
          </Button>
          <Button type="submit" disabled={update.isPending || !isDirty}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
