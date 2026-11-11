import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
  setResolvedTheme: (theme: 'light' | 'dark') => void;

  // Toasts
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
  }>;
  addToast: (toast: Omit<UIState['toasts'][0], 'id'>) => void;
  removeToast: (id: string) => void;

  // Modals
  modals: Record<string, boolean>;
  openModal: (key: string) => void;
  closeModal: (key: string) => void;

  // Global loading
  globalLoading: number;
  startGlobalLoading: () => void;
  stopGlobalLoading: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),

      // Theme
      theme: 'system',
      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme });
        // Apply to document
        if (theme === 'system') {
          const resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.classList.toggle('dark', resolved === 'dark');
        } else {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },
      resolvedTheme: 'light',
      setResolvedTheme: (resolvedTheme: 'light' | 'dark') => {
        set({ resolvedTheme });
        document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
      },

      // Toasts
      toasts: [],
      addToast: (toast) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
        // Auto-remove
        setTimeout(() => {
          get().removeToast(id);
        }, toast.duration ?? 5000);
      },
      removeToast: (id: string) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      // Modals
      modals: {},
      openModal: (key: string) => set((state) => ({ modals: { ...state.modals, [key]: true } })),
      closeModal: (key: string) => set((state) => ({ modals: { ...state.modals, [key]: false } })),

      // Global loading
      globalLoading: 0,
      startGlobalLoading: () => set((state) => ({ globalLoading: state.globalLoading + 1 })),
      stopGlobalLoading: () => set((state) => ({ globalLoading: Math.max(0, state.globalLoading - 1) })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

// Selector hooks
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
export const useTheme = () => useUIStore((state) => state.theme);
export const useToasts = () => useUIStore((state) => state.toasts);
export const useAddToast = () => useUIStore((state) => state.addToast);
export const useRemoveToast = () => useUIStore((state) => state.removeToast);
export const useModal = (key: string) => useUIStore((state) => state.modals[key] ?? false);
export const useOpenModal = () => useUIStore((state) => state.openModal);
export const useCloseModal = () => useUIStore((state) => state.closeModal);
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading > 0);