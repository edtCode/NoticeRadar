import { QueryClient } from '@tanstack/react-query';
import { parseApiError } from '../utils/helpers';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // Never retry 4xx errors
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
      onError: (error) => {
        // Global error surface is handled per-mutation; log unexpected failures
        const parsed = parseApiError(error);
        console.error(`[API error] ${parsed.message}`);
      },
    },
  },
});