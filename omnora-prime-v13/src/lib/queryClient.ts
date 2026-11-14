import { QueryClient } from '@tanstack/react-query';

export const queryClientOptions = {
  defaultOptions: {
    queries: {
      // Data considered fresh for 30s
      staleTime: 30_000,
      // Aggressive garbage collection: remove from heap 2 minutes after unmount
      gcTime: 2 * 60_000,
      // Never refetch on window focus to avoid Electron focus thrashing
      refetchOnWindowFocus: false,
      refetchInterval: false as const,
      refetchIntervalInBackground: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      // Only retry once on failure
      retry: 1,
      retryDelay: 1000,
      retryOnMount: false,
      placeholderData: (prev: any) => prev,
    },
    mutations: {
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

// Periodic cache cleanup: Every 10 minutes, clear old unaccessed queries
if (typeof window !== 'undefined') {
  setInterval(() => {
    queryClient.removeQueries({
      predicate: (query) => {
        const lastUpdated = query.state.dataUpdatedAt;
        return Date.now() - lastUpdated > 5 * 60_000;
        // Remove queries not accessed in 5 minutes
      },
    });
  }, 10 * 60_000);
}
