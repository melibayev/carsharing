import { Link } from 'react-router-dom';
import { Star, Zap, Fuel, Cog, Users, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUzs } from '@/lib/utils';
import type { CarListDto } from '@/types';
import { BodyType, Transmission, FuelType } from '@/types';
import { useIsFavorite, useToggleFavorite } from '@/hooks/use-favorites';
import { useAuthStore } from '@/stores/auth-store';

const bodyTypeLabels: Record<string, string> = {
  [BodyType.Sedan]: 'Sedan',
  [BodyType.SUV]: 'SUV',
  [BodyType.Truck]: 'Truck',
  [BodyType.Coupe]: 'Coupe',
  [BodyType.Convertible]: 'Convertible',
  [BodyType.Van]: 'Van',
  [BodyType.Wagon]: 'Wagon',
  [BodyType.Hatchback]: 'Hatchback',
  [BodyType.Minivan]: 'Minivan',
  [BodyType.SportsCar]: 'Sports Car',
};

const fuelTypeLabels: Record<string, string> = {
  [FuelType.Gasoline]: 'Gasoline',
  [FuelType.Diesel]: 'Diesel',
  [FuelType.Electric]: 'Electric',
  [FuelType.Hybrid]: 'Hybrid',
  [FuelType.PlugInHybrid]: 'Plug-in',
};

interface CarCardProps {
  car: CarListDto;
}

export function CarCard({ car }: CarCardProps) {
  const photoUrl = car.coverPhotoUrl || car.photoUrls[0] || null;
  const { isAuthenticated } = useAuthStore();
  const { data: isFavorite } = useIsFavorite(car.id);
  const toggleFavorite = useToggleFavorite();

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated()) return;
    toggleFavorite.mutate({ carId: car.id, isFavorite: !!isFavorite });
  };

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
            {isAuthenticated() && (
              <button
                onClick={handleFavorite}
                className="absolute top-2 left-2 h-8 w-8 rounded-full bg-white/80 dark:bg-black/50 flex items-center justify-center hover:scale-110 transition-transform"
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}`}
                />
              </button>
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
                <p className="text-xs text-muted-foreground">/day</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {car.averageRating > 0 ? car.averageRating.toFixed(1) : 'New'}
              </span>
              <span>{car.tripCount} trips</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-xs gap-1">
                {bodyTypeLabels[car.bodyType] ?? 'Sedan'}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Users className="h-3 w-3" />
                {car.seats}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                {car.transmission === Transmission.Automatic ? 'Automatic' : 'Manual'}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Fuel className="h-3 w-3" />
                {fuelTypeLabels[car.fuelType] ?? 'Gasoline'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
