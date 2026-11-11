import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, RegisterResponse } from '../types';
import authService from '../services/auth.service';
import api from '../services/api';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionRestored: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionRestored: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);
          api.setAuthTokens(response.session.accessToken, response.session.refreshToken);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(name, email, password);
          if (response.session) {
            api.setAuthTokens(response.session.accessToken, response.session.refreshToken);
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            api.clearAuthTokens();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
          return response;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch {
          // Ignore logout errors
        } finally {
          api.clearAuthTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      restoreSession: async () => {
        const accessToken = localStorage.getItem('noticeradar_access_token');
        const refreshToken = localStorage.getItem('noticeradar_refresh_token');

        if (!accessToken || !refreshToken) {
          api.clearAuthTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          api.setAuthTokens(accessToken, refreshToken);
          const user = await authService.getMe();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          api.clearAuthTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setUser: (user: AuthUser | null) => {
        set({ user, isAuthenticated: !!user });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useUserRole = () => useAuthStore((state) => state.user?.role ?? null);
export const useIsStudent = () => useAuthStore((state) => state.user?.role === 'STUDENT');
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'ADMIN');