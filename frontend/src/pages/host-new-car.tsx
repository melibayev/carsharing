import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateCar } from '@/hooks/use-cars';
import { useToast } from '@/hooks/use-toast';
import { BodyType, Transmission, FuelType } from '@/types';

const carSchema = z.object({
  make: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  year: z.number().min(1990).max(2030),
  bodyType: z.nativeEnum(BodyType),
  transmission: z.nativeEnum(Transmission),
  fuelType: z.nativeEnum(FuelType),
  seats: z.number().min(1).max(12),
  doors: z.number().min(1).max(6),
  color: z.string().optional(),
  dailyPriceUsd: z.number().min(10),
  weeklyDiscountPercent: z.number().min(0).max(50),
  monthlyDiscountPercent: z.number().min(0).max(70),
  cleaningFeeUsd: z.number().min(0),
  securityDepositUsd: z.number().min(0),
  minTripDays: z.number().min(1),
  maxTripDays: z.number().min(1),
  advanceNoticeHours: z.number().min(0),
  city: z.string().min(1, 'Required'),
  country: z.string().min(1, 'Required'),
  description: z.string().optional(),
  rules: z.string().optional(),
  isInstantBook: z.boolean(),
});

type CarForm = z.infer<typeof carSchema>;

export default function HostNewCarPage() {
  const navigate = useNavigate();
  const createMutation = useCreateCar();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CarForm>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      bodyType: BodyType.Sedan,
      transmission: Transmission.Automatic,
      fuelType: FuelType.Gasoline,
      seats: 5,
      doors: 4,
      dailyPriceUsd: 300000,
      weeklyDiscountPercent: 10,
      monthlyDiscountPercent: 20,
      cleaningFeeUsd: 50000,
      securityDepositUsd: 1000000,
      minTripDays: 1,
      maxTripDays: 30,
      advanceNoticeHours: 4,
      country: 'UZ',
      isInstantBook: true,
    },
  });

  const onSubmit = (data: CarForm) => {
    createMutation.mutate(data as any, {
      onSuccess: (car) => {
        toast({ title: 'Car listed!', description: `${car.make} ${car.model} is now live.` });
        navigate(`/cars/${car.id}`);
      },
      onError: () => {
        toast({ title: 'Failed to create listing', variant: 'destructive' });
      },
    });
  };

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-2xl font-heading font-bold mb-6">List your car</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Car details</CardTitle>
            <CardDescription>Tell us about your car</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Make</Label>
                <Input {...register('make')} placeholder="Chevrolet" />
                {errors.make && <p className="text-sm text-destructive">{errors.make.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input {...register('model')} placeholder="Cobalt" />
                {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" {...register('year', { valueAsNumber: true })} placeholder="2023" />
                {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Body type</Label>
                <Select value={watch('bodyType')} onValueChange={(v) => setValue('bodyType', v as BodyType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sedan">Sedan</SelectItem>
                    <SelectItem value="SUV">SUV</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Coupe">Coupe</SelectItem>
                    <SelectItem value="Convertible">Convertible</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Hatchback">Hatchback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transmission</Label>
                <Select value={watch('transmission')} onValueChange={(v) => setValue('transmission', v as Transmission)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Automatic">Automatic</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuel type</Label>
                <Select value={watch('fuelType')} onValueChange={(v) => setValue('fuelType', v as FuelType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gasoline">Gasoline</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Electric">Electric</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Seats</Label>
                <Input type="number" {...register('seats', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Doors</Label>
                <Input type="number" {...register('doors', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input {...register('color')} placeholder="White" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Daily price (USD)</Label>
                <Input type="number" {...register('dailyPriceUsd', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Cleaning fee</Label>
                <Input type="number" {...register('cleaningFeeUsd', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Weekly discount (%)</Label>
                <Input type="number" {...register('weeklyDiscountPercent', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Monthly discount (%)</Label>
                <Input type="number" {...register('monthlyDiscountPercent', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Security deposit</Label>
              <Input type="number" {...register('securityDepositUsd', { valueAsNumber: true })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location and Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...register('city')} placeholder="Tashkent" />
                {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input {...register('country')} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Min Trip Days</Label>
                <Input type="number" {...register('minTripDays', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Max Trip Days</Label>
                <Input type="number" {...register('maxTripDays', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Advance Notice (hrs)</Label>
                <Input type="number" {...register('advanceNoticeHours', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register('description')} placeholder="Describe your car..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Rules</Label>
              <Textarea {...register('rules')} placeholder="Rules for renters..." rows={3} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Instant Book</Label>
                <p className="text-sm text-muted-foreground">Allow guests to book without approval</p>
              </div>
              <Switch
                checked={watch('isInstantBook')}
                onCheckedChange={(v) => setValue('isInstantBook', v)}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full rounded-xl" disabled={createMutation.isPending}>
          {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          List your car
        </Button>
      </form>
    </div>
  );
}
