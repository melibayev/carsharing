import { useState, useEffect } from 'react';

const API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY ?? '';
const SCRIPT_ID = 'yandex-maps-v3';

declare global {
  interface Window {
    ymaps3: any;
  }
}

let loadPromise: Promise<void> | null = null;

function load(): Promise<void> {
  if (loadPromise) return loadPromise;
  if (window.ymaps3?.ready && typeof window.ymaps3.ready.then === 'function') {
    return (loadPromise = window.ymaps3.ready);
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    if (!API_KEY) {
      reject(new Error('VITE_YANDEX_MAPS_API_KEY is not configured'));
      return;
    }

    const onReadyLoad = () => window.ymaps3.ready.then(resolve);
    const onError = () => reject(new Error('Yandex Maps failed to load'));

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', onReadyLoad);
      existing.addEventListener('error', onError);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(API_KEY)}&lang=ru_RU`;
    script.async = true;
    script.onload = onReadyLoad;
    script.onerror = onError;
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useYandexMaps() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    load()
      .then(() => { if (!cancelled) setReady(true); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  return { ready, error };
}
