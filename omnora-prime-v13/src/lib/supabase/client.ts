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

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  return supabaseClient;
};

