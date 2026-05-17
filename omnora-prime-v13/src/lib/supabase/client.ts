// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import { resetAllStores } from '@/stores';

let supabaseClient: any = null;

export const createClient = () => {
  if (supabaseClient) return supabaseClient;

  const customStorage = {
    getItem: (key: string) => typeof window !== 'undefined' ? localStorage.getItem(key) : null,
    setItem: (key: string, value: string) => { if (typeof window !== 'undefined') localStorage.setItem(key, value) },
    removeItem: (key: string) => { if (typeof window !== 'undefined') localStorage.removeItem(key) },
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

  supabaseClient = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: customStorage,
      }
    }
  );

  // 2. Add a session expiry listener
  supabaseClient.auth.onAuthStateChange(async (event: string, session: any) => {
    if (event === 'SIGNED_OUT') {
      console.warn('[Security] Session expired or user signed out.');
      
      // Clear all Zustand stores
      resetAllStores();
      
      // Redirect to /login
      window.location.href = '/login';
      
      // Log to Pino (Simulated via console for now, assuming window.pino exists)
      // window.pino?.info({ event: 'session_expired', userId: session?.user?.id });
    }
    
    if (event === 'TOKEN_REFRESHED') {
      console.log('[Security] JWT Token refreshed successfully.');
    }
  });

  // Wrap supabaseClient.from to block database write mutations if trial has expired
  const originalFrom = supabaseClient.from.bind(supabaseClient);
  supabaseClient.from = (table: string) => {
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

  return supabaseClient;
};

