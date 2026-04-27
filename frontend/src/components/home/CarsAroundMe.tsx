import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, X, Car, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCarSearch } from '@/hooks/use-cars';
import { CarCard } from '@/components/cars/car-card';
import { Link } from 'react-router-dom';
import type { CarListDto } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons that get broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const carIcon = L.divIcon({
  html: `<div class="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold">🚗</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const userIcon = L.divIcon({
  html: `<div class="bg-blue-500 rounded-full w-5 h-5 border-4 border-white shadow-lg ring-4 ring-blue-500/30"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function formatDistance(km: number | null): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

interface MapViewProps {
  userLat: number;
  userLng: number;
  cars: CarListDto[];
  activeCar: string | null;
  onCarClick: (id: string) => void;
}

function MapView({ userLat, userLng, cars, activeCar, onCarClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [userLat, userLng],
      zoom: 12,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    L.marker([userLat, userLng], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>You are here</b>');
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [userLat, userLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Remove and re-add markers whenever the cars list changes.
    // Use actual car coordinates from the backend (CarListDto.latitude/longitude).
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    cars.forEach((car) => {
      // Only place a marker if the car has real coordinates
      const lat = car.latitude;
      const lng = car.longitude;
      if (lat == null || lng == null) return;

      const marker = L.marker([lat, lng], { icon: carIcon })
        .addTo(map)
        .bindPopup(
          `<div class="font-semibold">${car.year} ${car.make} ${car.model}</div>
           <div class="text-sm text-gray-500">${car.city}${car.distanceKm != null ? ` · ${formatDistance(car.distanceKm)}` : ''}</div>`,
        );
      marker.on('click', () => onCarClick(car.id));
      markersRef.current.push(marker);
    });

    if (activeCar) {
      const activeCarData = cars.find((c) => c.id === activeCar);
      if (activeCarData?.latitude != null && activeCarData?.longitude != null) {
        const idx = cars.filter((c) => c.latitude != null).findIndex((c) => c.id === activeCar);
        if (idx >= 0 && markersRef.current[idx]) {
          markersRef.current[idx].openPopup();
          map.panTo([activeCarData.latitude, activeCarData.longitude]);
        }
      }
    }
  }, [cars, activeCar, onCarClick]);

  return <div ref={containerRef} className="w-full h-full" />;
}

interface CarsAroundMeProps {}

type GeoState = 'idle' | 'loading' | 'granted' | 'denied';

export function CarsAroundMe(_props: CarsAroundMeProps) {
  const [geoState, setGeoState] = useState<GeoState>('idle');
  const [open, setOpen] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [activeCar, setActiveCar] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data, isLoading: carsLoading } = useCarSearch(
    userPos
      ? { lat: userPos.lat, lng: userPos.lng, radiusKm: 50, sort: 'distance', pageSize: 20 }
      : {},
  );

  const cars = data?.items ?? [];

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeoState('denied');
      return;
    }
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('granted');
        setOpen(true);
      },
      () => {
        setGeoState('denied');
      },
      { timeout: 10000 },
    );
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Scroll list to active car
  useEffect(() => {
    if (!activeCar || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-car-id="${activeCar}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeCar]);

  return (
    <>
      {/* ── Trigger section ── */}
      <section className="container py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          </div>

          <div className="relative z-10 space-y-3 text-center md:text-left">
            <Badge variant="secondary" className="mb-2">
              <Navigation className="h-3.5 w-3.5 mr-1.5" />
              New feature
            </Badge>
            <h2 className="text-2xl md:text-4xl font-heading font-bold text-white">
              Cars near you
            </h2>
            <p className="text-white/80 max-w-md">
              Find available cars close to your current location — on a map, with real distances.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3">
            {geoState === 'denied' && (
              <p className="text-white/70 text-xs flex items-center gap-1.5 max-w-48 text-center">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Location access was denied. Enable it in browser settings and try again.
              </p>
            )}
            <Button
              size="lg"
              variant="secondary"
              onClick={handleLocate}
              disabled={geoState === 'loading'}
              className="rounded-xl font-semibold shadow-xl min-w-[200px]"
            >
              {geoState === 'loading' ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Locating…</>
              ) : (
                <><MapPin className="mr-2 h-5 w-5" /> Show cars near me</>
              )}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Full-screen modal overlay ── */}
      <AnimatePresence>
        {open && userPos && (
          <motion.div
            key="cars-around-me-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex flex-col bg-background"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b bg-card shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold">Cars near me</h2>
                  {carsLoading ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {cars.length} {cars.length === 1 ? 'car' : 'cars'} within 50 km
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Body: map + list */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Map */}
              <div className="flex-1 relative min-h-[300px]">
                {userPos && (
                  <MapView
                    userLat={userPos.lat}
                    userLng={userPos.lng}
                    cars={cars}
                    activeCar={activeCar}
                    onCarClick={(id) => setActiveCar(id === activeCar ? null : id)}
                  />
                )}
                {/* Distance legend */}
                <div className="absolute bottom-4 left-4 z-[999] bg-card/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow flex items-center gap-2 text-xs text-muted-foreground border">
                  <span className="h-3 w-3 rounded-full bg-blue-500 shrink-0 border-2 border-white" />
                  You
                  <span className="h-5 w-px bg-border" />
                  <span>🚗</span>
                  Available car
                </div>
              </div>

              {/* Car list sidebar */}
              <div
                ref={listRef}
                className="w-full md:w-[360px] border-l overflow-y-auto bg-card"
              >
                {carsLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm">Finding cars around you…</p>
                  </div>
                ) : cars.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground p-6 text-center">
                    <Car className="h-8 w-8" />
                    <p className="text-sm font-medium">No cars found within 50 km</p>
                    <Button variant="outline" size="sm" asChild className="rounded-xl">
                      <Link to="/search">Browse all cars <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    {cars.map((car) => (
                      <div
                        key={car.id}
                        data-car-id={car.id}
                        onClick={() => setActiveCar(car.id === activeCar ? null : car.id)}
                        className={`rounded-xl border cursor-pointer transition-all ${
                          activeCar === car.id ? 'ring-2 ring-primary border-primary' : 'hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="relative">
                          <CarCard car={car} />
                          {car.distanceKm != null && (
                            <Badge
                              variant="secondary"
                              className="absolute top-2 right-2 text-xs font-semibold bg-background/90 border"
                            >
                              <Navigation className="h-3 w-3 mr-1" />
                              {formatDistance(car.distanceKm)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {data && data.totalCount > cars.length && (
                      <Button variant="outline" className="w-full rounded-xl" asChild>
                        <Link
                          to={`/search?lat=${userPos?.lat}&lng=${userPos?.lng}&radiusKm=50&sort=distance`}
                          onClick={handleClose}
                        >
                          View all {data.totalCount} cars <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
