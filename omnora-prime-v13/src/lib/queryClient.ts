import { QueryClient } from '@tanstack/react-query';

export const queryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 15 * 60 * 1000,      // 15 minutes
      refetchOnWindowFocus: false,  // CRITICAL
      refetchOnMount: false,        // use cache
      refetchInterval: false as const,       // no polling
      refetchIntervalInBackground: false,
      retry: 1,
      retryDelay: 1000,
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    }
  }
};

export const queryClient = new QueryClient(queryClientOptions);
