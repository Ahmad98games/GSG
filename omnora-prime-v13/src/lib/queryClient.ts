import { QueryClient } from '@tanstack/react-query';

export const queryClientOptions = {
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      
      // Keep in memory for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests 2 times
      retry: 2,
      
      // Wait 1s between retries
      retryDelay: 1000,
      
      // Don't refetch when window regains focus
      // (data is unlikely to change in seconds)
      refetchOnWindowFocus: false,
      
      // Do refetch when reconnecting to internet
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    }
  }
};

export const queryClient = new QueryClient(queryClientOptions);
