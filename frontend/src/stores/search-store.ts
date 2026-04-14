import { create } from 'zustand';

interface SearchState {
  city: string;
  startDate: string;
  endDate: string;
  minPrice: number;
  maxPrice: number;
  bodyType: string;
  transmission: string;
  fuelType: string;
  seats: number;
  instantBook: boolean;
  sort: string;
  page: number;
  setCity: (city: string) => void;
  setDates: (start: string, end: string) => void;
  setFilters: (filters: Partial<SearchState>) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

const defaultState = {
  city: '',
  startDate: '',
  endDate: '',
  minPrice: 0,
  maxPrice: 500,
  bodyType: '',
  transmission: '',
  fuelType: '',
  seats: 0,
  instantBook: false,
  sort: 'recommended',
  page: 1,
};

export const useSearchStore = create<SearchState>()((set) => ({
  ...defaultState,
  setCity: (city) => set({ city, page: 1 }),
  setDates: (startDate, endDate) => set({ startDate, endDate, page: 1 }),
  setFilters: (filters) => set({ ...filters, page: 1 }),
  setPage: (page) => set({ page }),
  resetFilters: () => set(defaultState),
}));
