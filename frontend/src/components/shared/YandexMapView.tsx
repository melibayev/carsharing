import { useEffect, useRef, useState } from 'react';
import { useYandexMaps } from '@/hooks/use-yandex-maps';
import { Loader2, MapPin, Navigation } from 'lucide-react';

interface Props {
  lat: number;
  lng: number;
  city: string;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function makeCarPin(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'transform:translate(-50%,-100%);';
  el.innerHTML = `
    <svg width="36" height="44" viewBox="0 0 24 30" fill="#3b82f6" xmlns="http://www.w3.org/2000/svg"
      style="filter:drop-shadow(0 2px 8px rgba(59,130,246,0.6))">
      <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 21 9 21s9-14.25 9-21c0-4.97-4.03-9-9-9z"/>
      <circle cx="12" cy="9" r="3.5" fill="white"/>
    </svg>`;
  return el;
}

function makeUserPin(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'transform:translate(-50%,-50%);';
  el.innerHTML = `
    <div style="width:18px;height:18px;border-radius:50%;background:#22c55e;border:3px solid white;
      box-shadow:0 0 0 4px rgba(34,197,94,0.3),0 2px 8px rgba(0,0,0,0.3);"></div>`;
  return el;
}

export default function YandexMapView({ lat, lng, city }: Props) {
  const { ready, error } = useYandexMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const ymaps3 = window.ymaps3;
    const carCoords: [number, number] = [lng, lat];

    const map = new ymaps3.YMap(containerRef.current, {
      location: { center: carCoords, zoom: 13 },
    });
    map.addChild(new ymaps3.YMapDefaultSchemeLayer({}));
    map.addChild(new ymaps3.YMapDefaultFeaturesLayer({}));

    // Car pin
    map.addChild(new ymaps3.YMapMarker({ coordinates: carCoords }, makeCarPin()));
    mapRef.current = map;

    // Try user geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: uLat, longitude: uLng } = pos.coords;
          const userCoords: [number, number] = [uLng, uLat];

          if (userMarkerRef.current) {
            map.removeChild(userMarkerRef.current);
          }
          const uMarker = new ymaps3.YMapMarker({ coordinates: userCoords }, makeUserPin());
          map.addChild(uMarker);
          userMarkerRef.current = uMarker;

          const km = haversineKm(uLat, uLng, lat, lng);
          setDistance(km);

          // Fit both pins: compute midpoint and rough zoom
          const midLng = (uLng + lng) / 2;
          const midLat = (uLat + lat) / 2;
          const roughKm = haversineKm(uLat, uLng, lat, lng);
          const zoom = roughKm < 1 ? 15 : roughKm < 5 ? 13 : roughKm < 20 ? 11 : roughKm < 100 ? 9 : 7;
          map.setLocation({ center: [midLng, midLat], zoom, duration: 600 });
        },
        () => setGeoError(true),
        { timeout: 6000 },
      );
    } else {
      setGeoError(true);
    }

    return () => {
      mapRef.current = null;
      userMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (error) return null;

  const formatDistance = (km: number) =>
    km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Location</h3>
        {distance !== null && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
            <Navigation className="h-4 w-4" />
            {formatDistance(distance)}
          </span>
        )}
      </div>

      <div className="relative rounded-2xl overflow-hidden border">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10" style={{ height: 280 }}>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <div ref={containerRef} style={{ height: '280px', width: '100%' }} />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          Car location · {city}
        </span>
        {!geoError && (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            Your location
          </span>
        )}
        <span className="flex items-center gap-1.5 ml-auto">
          <MapPin className="h-3.5 w-3.5" />
          Approximate area shown
        </span>
      </div>
    </div>
  );
}
