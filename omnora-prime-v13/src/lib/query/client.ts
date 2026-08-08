import { QueryClient } from '@tanstack/react-query'

// Singleton — created once, reused always
let _queryClient: QueryClient | null = null

export function getQueryClient(): QueryClient {
  if (_queryClient) return _queryClient

  _queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // ── THE KEY SETTINGS ──

        // Data stays fresh for 10 minutes
        // No automatic refetch during this time
        staleTime: 10 * 60 * 1000,

        // Keep data in memory 30 minutes
        // after component unmounts
        // Back navigation = instant
        gcTime: 30 * 60 * 1000,

        // NEVER refetch automatically
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,

        // While new data loads, show old data
        // ZERO blank screens, ZERO spinners
        // for cached data
        placeholderData: (
          previousData: any
        ) => previousData,

        // Run queries even offline
        // Reads from cache, not network
        networkMode: 'always',

        // One retry, then stop
        retry: 1,
        retryDelay: 500,

        // Never throw on error —
        // show cached data instead
        throwOnError: false,
      },
      mutations: {
        networkMode: 'always',
        retry: 0,
      },
    },
  })

  return _queryClient
}

// For use in providers:
export const queryClient = getQueryClient()
