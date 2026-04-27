import { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon paths broken by Vite/webpack bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const carIcon = L.divIcon({
  html: `<svg width="32" height="40" viewBox="0 0 24 30" fill="#3b82f6"
    xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 8px rgba(59,130,246,0.55))">
    <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 21 9 21s9-14.25 9-21c0-4.97-4.03-9-9-9z"/>
    <circle cx="12" cy="9" r="3.5" fill="white"/>
  </svg>`,
  className: '',
  iconAnchor: [16, 40],
  iconSize: [32, 40],
});

const userIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;
    border:3px solid white;box-shadow:0 0 0 4px rgba(34,197,94,0.3),0 2px 8px rgba(0,0,0,0.25);"></div>`,
  className: '',
  iconAnchor: [8, 8],
  iconSize: [16, 16],
});

export default function MapView({ lat, lng, city }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [geoBlocked, setGeoBlocked] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { center: [lat, lng], zoom: 13 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Car marker
    L.marker([lat, lng], { icon: carIcon }).addTo(map);
    mapRef.current = map;

    // User geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: c }) => {
          const { latitude: uLat, longitude: uLng } = c;
          L.marker([uLat, uLng], { icon: userIcon }).addTo(map);
          const km = haversineKm(uLat, uLng, lat, lng);
          setDistance(km);
          // Fit both markers in view
          map.fitBounds(
            L.latLngBounds([[uLat, uLng], [lat, lng]]),
            { padding: [48, 48], maxZoom: 15, animate: true },
          );
        },
        () => setGeoBlocked(true),
        { timeout: 6000 },
      );
    } else {
      setGeoBlocked(true);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div
        ref={containerRef}
        className="rounded-2xl overflow-hidden border"
        style={{ height: '280px', width: '100%' }}
      />

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          Car · {city}
        </span>
        {!geoBlocked && (
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
