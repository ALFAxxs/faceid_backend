import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  access: string | null;
  refresh: string | null;
  username: string | null;
  isAuthenticated: () => boolean;
  setTokens: (access: string, refresh: string) => void;
  setAccess: (access: string) => void;
  setUsername: (username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      access: null,
      refresh: null,
      username: null,
      isAuthenticated: () => !!get().access,
      setTokens: (access, refresh) => set({ access, refresh }),
      setAccess: (access) => set({ access }),
      setUsername: (username) => set({ username }),
      logout: () => set({ access: null, refresh: null, username: null }),
    }),
    { name: 'faceid-auth' }
  )
);
