import { QueryClient } from '@tanstack/react-query';

export const queryClientOptions = {
  defaultOptions: {
    queries: {
      // DISABLE automatic polling
      refetchInterval: false as const,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      
      // Keep data for 10 minutes
      staleTime: 10 * 60 * 1000,
      
      // Cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      
      // Retry failed requests 1 time
      retry: 1,
      
      // Wait 1s between retries
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
