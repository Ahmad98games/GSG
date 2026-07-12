import { QueryClient } from '@tanstack/react-query';

export const queryClientOptions = {
  defaultOptions: {
    queries: {
      // NEVER poll in background — #1 freeze cause in Electron
      refetchInterval: false as const,
      refetchIntervalInBackground: false,
      // NEVER refetch when window regains focus
      // Electron fires focus events constantly — this causes freezes
      refetchOnWindowFocus: false,
      // Use cache — do not re-fetch on mount if data is fresh
      refetchOnMount: false,
      refetchOnReconnect: false,
      // Keep data for 10 minutes before it goes stale
      staleTime: 10 * 60 * 1000,
      // Keep in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Only retry once on failure, with a 2s delay
      retry: 1,
      retryDelay: 2000,
      retryOnMount: false,
    },
    mutations: {
      // Never auto-retry mutations
      retry: 0,
    },
  },
};

export const queryClient = new QueryClient(queryClientOptions);

queryClient.getQueryCache().subscribe((event) => {
  if (
    event.type === 'observerResultsUpdated' &&
    event.query.state.status === 'error'
  ) {
    const error = event.query.state.error as any;
    if (error?.message) {
      console.error('[Query]', event.query.queryKey, ':', error.message);
    }
  }
});
