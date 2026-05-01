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
  /** Called after reverse-geocoding; provides street address and city strings */
  onGeocode?: (address: string, city: string) => void;
}

async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    const road = a.road ?? a.pedestrian ?? a.footway ?? a.path ?? '';
    const houseNumber = a.house_number ? ` ${a.house_number}` : '';
    const address = road ? `${road}${houseNumber}` : (data.display_name?.split(',')[0] ?? '');
    const city = a.city ?? a.town ?? a.village ?? a.county ?? a.state ?? '';
    return { address, city };
  } catch {
    return null;
  }
}

export default function MapPicker({ lat, lng, onChange, onGeocode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat != null && lng != null ? { lat, lng } : null,
  );

  const placePin = async (latC: number, lngC: number) => {
    setCoords({ lat: latC, lng: lngC });
    onChange(latC, lngC);
    if (markerRef.current) {
      markerRef.current.setLatLng([latC, lngC]);
    } else if (mapRef.current) {
      markerRef.current = L.marker([latC, lngC]).addTo(mapRef.current);
    }
    if (onGeocode) {
      const result = await reverseGeocode(latC, lngC);
      if (result) onGeocode(result.address, result.city);
    }
  };

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
      placePin(e.latlng.lat, e.latlng.lng);
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
      async ({ coords: c }) => {
        const { latitude: latC, longitude: lngC } = c;
        mapRef.current!.setView([latC, lngC], 15, { animate: true });
        await placePin(latC, lngC);
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
