import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

  const cityFromRegion = regionCode && regionCode !== 'all'
    ? getRegionByCode(regionCode)?.capital
    : undefined;

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
          Filters
          {hasFilters && <Badge variant="secondary" className="ml-1">Active</Badge>}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold">Filters</h3>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Clear all
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Min price</label>
              <Input
                type="number"
                placeholder="100 000"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Max price</label>
              <Input
                type="number"
                placeholder="2 000 000"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Body type</label>
              <Select value={bodyType} onValueChange={(v) => { setBodyType(v); setPage(1); }}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sedan">Sedan</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Truck">Truck</SelectItem>
                  <SelectItem value="Coupe">Coupe</SelectItem>
                  <SelectItem value="Convertible">Convertible</SelectItem>
                  <SelectItem value="Van">Van</SelectItem>
                  <SelectItem value="Hatchback">Hatchback</SelectItem>
                  <SelectItem value="Minivan">Minivan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Transmission</label>
              <Select value={transmission} onValueChange={(v) => { setTransmission(v); setPage(1); }}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Fuel type</label>
              <Select value={fuelType} onValueChange={(v) => { setFuelType(v); setPage(1); }}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gasoline">Gasoline</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Sort by</label>
              <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Top rated</SelectItem>
                  <SelectItem value="price_asc">Cheapest first</SelectItem>
                  <SelectItem value="price_desc">Most expensive</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
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
          {data ? `${data.totalCount} cars found` : 'Loading...'}
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
          <h3 className="text-lg font-heading font-semibold">No cars found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search in a different region</p>
          <Button variant="outline" onClick={clearFilters} className="rounded-xl">Clear filters</Button>
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
            Previous
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
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
