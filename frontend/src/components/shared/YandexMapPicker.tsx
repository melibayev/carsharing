import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crosshair, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon paths broken by Vite/webpack bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Tashkent default
const DEFAULT: L.LatLngTuple = [41.2995, 69.2401];

interface Props {
  lat?: number | null;
  lng?: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat != null && lng != null ? { lat, lng } : null,
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: L.LatLngTuple = lat != null && lng != null ? [lat, lng] : DEFAULT;
    const zoom = lat != null ? 14 : 11;

    const map = L.map(containerRef.current, { center, zoom });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    if (lat != null && lng != null) {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: latC, lng: lngC } = e.latlng;
      setCoords({ lat: latC, lng: lngC });
      onChange(latC, lngC);
      if (markerRef.current) {
        markerRef.current.setLatLng([latC, lngC]);
      } else {
        markerRef.current = L.marker([latC, lngC]).addTo(map);
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        const { latitude: latC, longitude: lngC } = c;
        setCoords({ lat: latC, lng: lngC });
        onChange(latC, lngC);
        const map = mapRef.current!;
        if (markerRef.current) {
          markerRef.current.setLatLng([latC, lngC]);
        } else {
          markerRef.current = L.marker([latC, lngC]).addTo(map);
        }
        map.setView([latC, lngC], 15, { animate: true });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 8000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {coords
            ? `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
            : 'Click the map to pin your car location'}
        </p>
        <Button type="button" size="sm" variant="outline" onClick={useMyLocation} disabled={geoLoading}>
          {geoLoading
            ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            : <Crosshair className="h-3.5 w-3.5 mr-1.5" />}
          My location
        </Button>
      </div>
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border"
        style={{ height: '300px', width: '100%' }}
      />
    </div>
  );
}
