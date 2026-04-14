import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCarSearch } from '@/hooks/use-cars';
import { CarCard } from '@/components/cars/car-card';
import { RegionPicker } from '@/components/shared/RegionPicker';
import { getRegionByCode, getRegionByCity } from '@/lib/regions';
import { BodyType, Transmission, FuelType } from '@/types';
import type { CarSearchParams } from '@/types';

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [regionCode, setRegionCode] = useState(searchParams.get('region') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState('recommended');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [instantBook, setInstantBook] = useState(false);
  const [page, setPage] = useState(1);

  // Map region code → capital city name for API
  const cityFromRegion = regionCode && regionCode !== 'all'
    ? getRegionByCode(regionCode)?.capital
    : undefined;

  // Also support legacy ?city= param
  const legacyCity = searchParams.get('city') || '';

  const params: CarSearchParams = {
    city: cityFromRegion || legacyCity || undefined,
    sort: sort !== 'recommended' ? sort : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    bodyType: (bodyType as BodyType) || undefined,
    transmission: (transmission as Transmission) || undefined,
    fuelType: (fuelType as FuelType) || undefined,
    instantBook: instantBook || undefined,
    page,
    pageSize: 12,
  };

  const { data, isLoading } = useCarSearch(params);

  useEffect(() => {
    const c = searchParams.get('city');
    if (c) {
      const region = getRegionByCity(c);
      if (region) setRegionCode(region.code);
    }
    const r = searchParams.get('region');
    if (r) setRegionCode(r);
  }, [searchParams]);

  const handleRegionChange = (code: string) => {
    setRegionCode(code);
    setPage(1);
    if (code && code !== 'all') {
      const region = getRegionByCode(code);
      setSearchParams(region ? { city: region.capital } : {});
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setBodyType('');
    setTransmission('');
    setFuelType('');
    setInstantBook(false);
    setSort('recommended');
    setPage(1);
  };

  const hasFilters = minPrice || maxPrice || bodyType || transmission || fuelType || instantBook;
  const totalPages = data ? Math.ceil(data.totalCount / 12) : 0;

  return (
    <div className="container py-6 space-y-6">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1">
          <RegionPicker value={regionCode} onChange={handleRegionChange} showAll />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2 rounded-xl"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t('search.filters')}
          {hasFilters && <Badge variant="secondary" className="ml-1">{t('search.filters')}</Badge>}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold">{t('search.filters')}</h3>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> {t('search.clearFilters')}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('search.priceMin')}</label>
              <Input
                type="number"
                placeholder="100 000"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('search.priceMax')}</label>
              <Input
                type="number"
                placeholder="2 000 000"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('search.bodyType')}</label>
              <Select value={bodyType} onValueChange={(v) => { setBodyType(v); setPage(1); }}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder={t('search.allRegions')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sedan">{t('categories.sedan')}</SelectItem>
                  <SelectItem value="SUV">{t('categories.suv')}</SelectItem>
                  <SelectItem value="Truck">{t('categories.truck')}</SelectItem>
                  <SelectItem value="Coupe">{t('categories.coupe')}</SelectItem>
                  <SelectItem value="Convertible">{t('categories.convertible')}</SelectItem>
                  <SelectItem value="Van">{t('categories.van')}</SelectItem>
                  <SelectItem value="Hatchback">{t('categories.hatchback')}</SelectItem>
                  <SelectItem value="Minivan">{t('categories.minivan')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('search.transmission')}</label>
              <Select value={transmission} onValueChange={(v) => { setTransmission(v); setPage(1); }}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder={t('search.allRegions')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatic">{t('search.automatic')}</SelectItem>
                  <SelectItem value="Manual">{t('search.manual')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('search.fuelType')}</label>
              <Select value={fuelType} onValueChange={(v) => { setFuelType(v); setPage(1); }}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder={t('search.allRegions')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gasoline">{t('search.petrol')}</SelectItem>
                  <SelectItem value="Diesel">{t('search.diesel')}</SelectItem>
                  <SelectItem value="Electric">{t('search.electric')}</SelectItem>
                  <SelectItem value="Hybrid">{t('search.hybrid')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('search.sortBy')}</label>
              <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">{t('search.sortRating')}</SelectItem>
                  <SelectItem value="price_asc">{t('search.sortCheap')}</SelectItem>
                  <SelectItem value="price_desc">{t('search.sortExpensive')}</SelectItem>
                  <SelectItem value="newest">{t('search.sortNewest')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="instant"
              checked={instantBook}
              onChange={(e) => { setInstantBook(e.target.checked); setPage(1); }}
              className="rounded border-input"
            />
            <label htmlFor="instant" className="text-sm flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" /> Instant Book
            </label>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? t('search.results', { count: data.totalCount }) : t('common.loading')}
          {cityFromRegion && <> — <span className="font-medium text-foreground">{cityFromRegion}</span></>}
        </p>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.items.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <Search className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-heading font-semibold">{t('search.noResults')}</h3>
          <p className="text-muted-foreground">{t('search.noResultsDesc')}</p>
          <Button variant="outline" onClick={clearFilters} className="rounded-xl">{t('search.clearFilters')}</Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg"
          >
            {t('common.previous')}
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(p)}
                  className="rounded-lg"
                >
                  {p}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-lg"
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
