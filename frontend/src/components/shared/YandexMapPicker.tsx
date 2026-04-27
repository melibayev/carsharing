import { useEffect, useRef, useState, useCallback } from 'react';
import { useYandexMaps } from '@/hooks/use-yandex-maps';
import { Button } from '@/components/ui/button';
import { Crosshair, Loader2 } from 'lucide-react';

interface Props {
  lat?: number | null;
  lng?: number | null;
  onChange: (lat: number, lng: number) => void;
}

// Tashkent default center [lng, lat]
const DEFAULT_CENTER: [number, number] = [69.2401, 41.2995];

function makePinElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'transform:translate(-50%,-100%);cursor:pointer;';
  el.innerHTML = `
    <svg width="32" height="40" viewBox="0 0 24 30" fill="#ef4444" xmlns="http://www.w3.org/2000/svg"
      style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4))">
      <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 21 9 21s9-14.25 9-21c0-4.97-4.03-9-9-9z"/>
      <circle cx="12" cy="9" r="3.5" fill="white"/>
    </svg>`;
  return el;
}

export default function YandexMapPicker({ lat, lng, onChange }: Props) {
  const { ready, error } = useYandexMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [displayCoords, setDisplayCoords] = useState<{ lat: number; lng: number } | null>(
    lat != null && lng != null ? { lat, lng } : null,
  );

  const placeMarker = useCallback((lngLat: [number, number]) => {
    const map = mapRef.current;
    if (!map) return;
    const ymaps3 = window.ymaps3;
    if (markerRef.current) {
      map.removeChild(markerRef.current);
    }
    const marker = new ymaps3.YMapMarker({ coordinates: lngLat }, makePinElement());
    map.addChild(marker);
    markerRef.current = marker;
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const ymaps3 = window.ymaps3;
    const center: [number, number] =
      lat != null && lng != null ? [lng, lat] : DEFAULT_CENTER;

    const map = new ymaps3.YMap(containerRef.current, {
      location: { center, zoom: lat != null ? 14 : 11 },
    });
    map.addChild(new ymaps3.YMapDefaultSchemeLayer({}));
    map.addChild(new ymaps3.YMapDefaultFeaturesLayer({}));

    const listener = new ymaps3.YMapListener({
      layer: 'any',
      onClick: (_obj: any, event: any) => {
        const [lngC, latC] = event.coordinates as [number, number];
        setDisplayCoords({ lat: latC, lng: lngC });
        onChange(latC, lngC);
        placeMarker([lngC, latC]);
      },
    });
    map.addChild(listener);
    mapRef.current = map;

    if (lat != null && lng != null) {
      placeMarker([lng, lat]);
    }

    return () => {
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: latC, longitude: lngC } = pos.coords;
        setDisplayCoords({ lat: latC, lng: lngC });
        onChange(latC, lngC);
        const lngLat: [number, number] = [lngC, latC];
        placeMarker(lngLat);
        mapRef.current?.setLocation({ center: lngLat, zoom: 15, duration: 600 });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 8000 },
    );
  };

  if (error) {
    return (
      <div className="h-64 rounded-xl border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
        Map unavailable — add <code className="mx-1 font-mono text-xs bg-muted px-1 py-0.5 rounded">VITE_YANDEX_MAPS_API_KEY</code> to your .env file.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {displayCoords
            ? `📍 ${displayCoords.lat.toFixed(5)}, ${displayCoords.lng.toFixed(5)}`
            : 'Click on the map to pin your car location'}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={useMyLocation}
          disabled={geoLoading || !ready}
        >
          {geoLoading
            ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            : <Crosshair className="h-3.5 w-3.5 mr-1.5" />}
          My location
        </Button>
      </div>
      <div className="relative rounded-xl overflow-hidden border">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <div ref={containerRef} style={{ height: '300px', width: '100%' }} />
      </div>
    </div>
  );
}
