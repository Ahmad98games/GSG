import { createBrowserClient } from '@supabase/ssr'
import { resetAllStores } from '@/stores'

let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

  if (typeof window === 'undefined') {
    return createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
        },
        realtime: {
          // DISABLE realtime on server
          params: { eventsPerSecond: 0 }
        },
      }
    )
  }

  if (!_client) {
    const customStorage = {
      getItem: (key: string) => typeof window !== 'undefined' ? localStorage.getItem(key) : null,
      setItem: (key: string, value: string) => { if (typeof window !== 'undefined') localStorage.setItem(key, value) },
      removeItem: (key: string) => { if (typeof window !== 'undefined') localStorage.removeItem(key) },
    };

    const fetchWithTimeout = (url: any, options: any = {}) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return Promise.reject(new TypeError('Failed to fetch (Offline)'));
      }
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), 8000) // 8 second timeout
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(id))
    };

    _client = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: false, // Don't auto-refresh on boot
          detectSessionInUrl: false,
          storage: customStorage,
        },
        realtime: {
          // Don't open WebSocket immediately
          params: { eventsPerSecond: 10 },
        },
        global: {
          fetch: fetchWithTimeout,
        },
      }
    )

    // Add session expiry listener
    _client.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_OUT') {
        console.warn('[Security] Session expired or user signed out.');
        resetAllStores();
        window.location.href = window.location.pathname.startsWith('/dashboard')
          ? '/dashboard/login'
          : '/login';
      }
      if (event === 'TOKEN_REFRESHED') {
        console.log('[Security] JWT Token refreshed successfully.');
      }
    });

    // Wrap from to block database write mutations if trial has expired
    const originalFrom = _client.from.bind(_client);
    _client.from = (table: string) => {
      const builder = originalFrom(table);

      const isReadOnly = () => {
        if (typeof window === 'undefined') return false;
        try {
          const tierDataStr = localStorage.getItem('noxis-tier');
          if (!tierDataStr) return false;
          const tierData = JSON.parse(tierDataStr);
          if (tierData.state?.isTrial && tierData.state?.expiresAt) {
            return new Date(tierData.state.expiresAt) < new Date();
          }
        } catch (e) {
          console.error('Error reading tier store from localStorage:', e);
        }
        return false;
      };

      if (isReadOnly()) {
        const createMockErrorBuilder = (methodName: string) => {
          const mockResult: any = {
            then: (onfulfilled: any) => {
              return Promise.resolve(
                onfulfilled({
                  data: null,
                  error: {
                    message: 'Trial expired. App is in Read-Only Mode. Purchase a license to restore full write capabilities.',
                    details: `The 3-day trial period has ended. Database write mutations (${methodName}) on table "${table}" are blocked.`,
                    hint: 'Go to Settings or Activation to upgrade your license.',
                    code: '42501'
                  },
                  count: null,
                  status: 403,
                  statusText: 'Forbidden'
                })
              );
            },
            select: () => mockResult,
            single: () => mockResult,
            eq: () => mockResult,
            neq: () => mockResult,
            match: () => mockResult,
            csv: () => mockResult,
            maybeSingle: () => mockResult,
            throwOnError: () => mockResult,
          };
          return mockResult;
        };

        builder.insert = () => createMockErrorBuilder('insert');
        builder.update = () => createMockErrorBuilder('update');
        builder.upsert = () => createMockErrorBuilder('upsert');
        builder.delete = () => createMockErrorBuilder('delete');
      }

      return builder;
    };
  }

  return _client
}

// Enable auto-refresh AFTER app is ready
// (called from dashboard on first load)
export function enableAutoRefresh() {
  if (_client) {
    _client.auth.startAutoRefresh()
  }
}

export function shouldSync(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('noxis_cloud_sync') !== 'false';
}
