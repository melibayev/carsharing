export interface Region {
  code: string;
  name: string;
  capital: string;
  lat: number;
  lng: number;
}

export const REGIONS: Region[] = [
  { code: 'TSH', name: "Tashkent City", capital: "Tashkent", lat: 41.2995, lng: 69.2401 },
  { code: 'TAS', name: "Tashkent Region", capital: "Nurafshon", lat: 41.0058, lng: 69.2163 },
  { code: 'AND', name: "Andijan", capital: "Andijan", lat: 40.7821, lng: 72.3442 },
  { code: 'BUX', name: "Bukhara", capital: "Bukhara", lat: 39.7747, lng: 64.4286 },
  { code: 'FAR', name: "Fergana", capital: "Fergana", lat: 40.3894, lng: 71.7833 },
  { code: 'JIZ', name: "Jizzakh", capital: "Jizzakh", lat: 40.1158, lng: 67.8422 },
  { code: 'XOR', name: "Khorezm", capital: "Urgench", lat: 41.5500, lng: 60.6316 },
  { code: 'NAM', name: "Namangan", capital: "Namangan", lat: 40.9983, lng: 71.6726 },
  { code: 'NAV', name: "Navoi", capital: "Navoi", lat: 40.0844, lng: 65.3792 },
  { code: 'QAS', name: "Kashkadarya", capital: "Qarshi", lat: 38.8606, lng: 65.7892 },
  { code: 'QOR', name: "Karakalpakstan", capital: "Nukus", lat: 42.4611, lng: 59.6103 },
  { code: 'SAM', name: "Samarkand", capital: "Samarkand", lat: 39.6542, lng: 66.9597 },
  { code: 'SIR', name: "Sirdarya", capital: "Gulistan", lat: 40.4897, lng: 68.7842 },
  { code: 'SUR', name: "Surkhandarya", capital: "Termez", lat: 37.2242, lng: 67.2783 },
];

export function getRegionDisplay(region: Region): string {
  return region.name;
}

export function getRegionByCode(code: string): Region | undefined {
  return REGIONS.find((r) => r.code === code);
}

export function getRegionByCity(city: string): Region | undefined {
  return REGIONS.find(
    (r) =>
      r.capital.toLowerCase() === city.toLowerCase() ||
      r.name.toLowerCase() === city.toLowerCase(),
  );
}
