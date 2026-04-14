import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDto } from '@/types';

interface AuthState {
  token: string | null;
  user: UserDto | null;
  setToken: (token: string) => void;
  setAuth: (token: string, user: UserDto) => void;
  setUser: (user: UserDto) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token,
      isAdmin: () => get().user?.email === 'admin@CarSharing.dev',
    }),
    {
      name: 'CarSharing-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
