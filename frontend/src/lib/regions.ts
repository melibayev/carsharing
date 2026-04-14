export interface Region {
  code: string;
  latin: string;
  cyrillic: string;
  capital: string;
  lat: number;
  lng: number;
}

export const REGIONS: Region[] = [
  { code: 'TSH', latin: "Toshkent shahri", cyrillic: "Тошкент шаҳри", capital: "Tashkent", lat: 41.2995, lng: 69.2401 },
  { code: 'TAS', latin: "Toshkent", cyrillic: "Тошкент", capital: "Nurafshon", lat: 41.0058, lng: 69.2163 },
  { code: 'AND', latin: "Andijon", cyrillic: "Андижон", capital: "Andijan", lat: 40.7821, lng: 72.3442 },
  { code: 'BUX', latin: "Buxoro", cyrillic: "Бухоро", capital: "Bukhara", lat: 39.7747, lng: 64.4286 },
  { code: 'FAR', latin: "Farg'ona", cyrillic: "Фарғона", capital: "Fergana", lat: 40.3894, lng: 71.7833 },
  { code: 'JIZ', latin: "Jizzax", cyrillic: "Жиззах", capital: "Jizzakh", lat: 40.1158, lng: 67.8422 },
  { code: 'XOR', latin: "Xorazm", cyrillic: "Хоразм", capital: "Urgench", lat: 41.5500, lng: 60.6316 },
  { code: 'NAM', latin: "Namangan", cyrillic: "Наманган", capital: "Namangan", lat: 40.9983, lng: 71.6726 },
  { code: 'NAV', latin: "Navoiy", cyrillic: "Навоий", capital: "Navoi", lat: 40.0844, lng: 65.3792 },
  { code: 'QAS', latin: "Qashqadaryo", cyrillic: "Қашқадарё", capital: "Qarshi", lat: 38.8606, lng: 65.7892 },
  { code: 'QOR', latin: "Qoraqalpog'iston", cyrillic: "Қорақалпоғистон", capital: "Nukus", lat: 42.4611, lng: 59.6103 },
  { code: 'SAM', latin: "Samarqand", cyrillic: "Самарқанд", capital: "Samarkand", lat: 39.6542, lng: 66.9597 },
  { code: 'SIR', latin: "Sirdaryo", cyrillic: "Сирдарё", capital: "Gulistan", lat: 40.4897, lng: 68.7842 },
  { code: 'SUR', latin: "Surxondaryo", cyrillic: "Сурхондарё", capital: "Termez", lat: 37.2242, lng: 67.2783 },
];

export function getRegionDisplay(region: Region, locale: string): string {
  if (locale === 'ru') return region.cyrillic;
  return region.latin;
}

export function getRegionByCode(code: string): Region | undefined {
  return REGIONS.find((r) => r.code === code);
}

export function getRegionByCity(city: string): Region | undefined {
  return REGIONS.find(
    (r) =>
      r.capital.toLowerCase() === city.toLowerCase() ||
      r.latin.toLowerCase() === city.toLowerCase() ||
      r.cyrillic === city,
  );
}
