import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, Zap, Fuel, Cog, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUzs } from '@/lib/utils';
import type { CarListDto } from '@/types';
import { BodyType, Transmission, FuelType } from '@/types';

const bodyTypeKeys: Record<string, string> = {
  [BodyType.Sedan]: 'categories.sedan',
  [BodyType.SUV]: 'categories.suv',
  [BodyType.Truck]: 'categories.truck',
  [BodyType.Coupe]: 'categories.coupe',
  [BodyType.Convertible]: 'categories.convertible',
  [BodyType.Van]: 'categories.van',
  [BodyType.Wagon]: 'categories.sedan',
  [BodyType.Hatchback]: 'categories.hatchback',
  [BodyType.Minivan]: 'categories.minivan',
  [BodyType.SportsCar]: 'categories.coupe',
};

const fuelTypeIcons: Record<string, string> = {
  [FuelType.Gasoline]: '⛽',
  [FuelType.Diesel]: '⛽',
  [FuelType.Electric]: '⚡',
  [FuelType.Hybrid]: '🔋',
  [FuelType.PlugInHybrid]: '🔌',
};

interface CarCardProps {
  car: CarListDto;
}

export function CarCard({ car }: CarCardProps) {
  const { t } = useTranslation();
  const photoUrl = car.coverPhotoUrl || car.photoUrls[0] || null;

  return (
    <Link to={`/cars/${car.id}`}>
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full rounded-2xl">
          <div className="relative aspect-[4/3] bg-muted">
            {photoUrl ? (
              <img src={photoUrl} alt={`${car.year} ${car.make} ${car.model}`} className="object-cover w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Cog className="h-12 w-12" />
              </div>
            )}
            {car.isInstantBook && (
              <Badge className="absolute top-2 right-2 bg-primary gap-1">
                <Zap className="h-3 w-3" />
                Instant
              </Badge>
            )}
          </div>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading font-semibold">
                  {car.year} {car.make} {car.model}
                </h3>
                <p className="text-sm text-muted-foreground">{car.city}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-lg">{formatUzs(car.dailyPriceUsd, false)}</p>
                <p className="text-xs text-muted-foreground">so'm/{t('common.perDay')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {car.averageRating > 0 ? car.averageRating.toFixed(1) : 'New'}
              </span>
              <span>{car.tripCount} {t('car.trips').toLowerCase()}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-xs gap-1">
                {t(bodyTypeKeys[car.bodyType] ?? 'categories.sedan')}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Users className="h-3 w-3" />
                {car.seats}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                {car.transmission === Transmission.Automatic ? t('search.automatic') : t('search.manual')}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Fuel className="h-3 w-3" />
                {fuelTypeIcons[car.fuelType]}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
