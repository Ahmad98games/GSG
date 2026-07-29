'use client'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  Suspense,
  type ReactNode,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppLock } from '@/hooks/useAppLock'
import { useRouteTracking } from '@/hooks/useRouteTracking'

interface AuthState {
  user: any | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isAuthenticated: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
})

function RouteTracker() {
  useRouteTracking()
  return null
}

export function AuthProvider({
  children,
}: { children: ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useAppLock()

  const isElectron =
    typeof window !== 'undefined' &&
    !!(window as any).electronAPI?.store

  // ── BOOT: Check persisted session ──
  useEffect(() => {
    const boot = async () => {
      const isPublicRoute = (path: string | null) => {
        if (!path) return true
        if (path === '/' || path === '/index.html') return true
        const publicPrefixes = [
          '/login',
          '/signup',
          '/pricing',
          '/docs',
          '/about',
          '/reviews',
          '/blog',
          '/download',
          '/privacy',
          '/terms',
          '/refund',
          '/file-morph',
          '/admin'
        ]
        return publicPrefixes.some(prefix => path.toLowerCase().startsWith(prefix))
      }

      const publicPage = isPublicRoute(pathname)

      if (isElectron) {
        const stored = await (window as any).electronAPI.store.getSession()

        if (stored && !stored.isExpired) {
          const { data, error } = await supabase.auth.setSession({
            access_token: stored.accessToken,
            refresh_token: stored.refreshToken,
          })

          if (!error && data.user) {
            setUser(data.user)
            setLoading(false)
            return
          }
        }

        if (stored?.isExpired && stored.refreshToken) {
          const { data, error } = await supabase.auth.refreshSession({
            refresh_token: stored.refreshToken,
          })

          if (!error && data.session) {
            await (window as any).electronAPI.store.saveSession({
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresAt: data.session.expires_at || 0,
              email: data.user?.email || '',
              userId: data.user?.id || '',
            })

            setUser(data.user)
            setLoading(false)
            return
          }
        }
      } else {
        const { data } = await supabase.auth.getSession()
        if (data.session?.user) {
          setUser(data.session.user)
          setLoading(false)
          return
        }
      }

      setLoading(false)
      if (!publicPage) {
        router.replace('/login')
      }
    }

    boot()
  }, [pathname, isElectron, router, supabase])

  // ── SIGN IN ──
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      if (data.session && isElectron) {
        await (window as any).electronAPI.store.saveSession({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at || 0,
          email: data.user?.email || '',
          userId: data.user?.id || '',
        })
      }

      setUser(data.user)

      const lockEnabled = isElectron
        ? await (window as any).electronAPI.store.isAppLockEnabled()
        : false

      if (lockEnabled) {
        router.replace('/lock')
      } else {
        const lastRoute = isElectron
          ? await (window as any).electronAPI.store.getLastRoute()
          : '/dashboard'
        router.replace(lastRoute)
      }

      return { error: null }
    },
    [isElectron, supabase, router]
  )

  // ── SIGN OUT ──
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    if (isElectron) {
      await (window as any).electronAPI.store.clearSession()
    }
    setUser(null)
    router.replace('/login')
  }, [isElectron, supabase, router])

  // ── LISTEN for auth changes ──
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (event === 'TOKEN_REFRESHED' && session && isElectron) {
          await (window as any).electronAPI.store.saveSession({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            expiresAt: session.expires_at || 0,
            email: session.user?.email || '',
            userId: session.user?.id || '',
          })
        }
        if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [isElectron, supabase])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#060708] flex items-center justify-center z-50">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-loading {
            animation: loading-bar 1.2s ease-in-out infinite;
          }
        `}} />
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl font-black text-white tracking-tight">
            N
          </div>
          <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-[#60A5FA] rounded-full animate-loading" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      signIn,
      signOut,
    }}>
      <Suspense fallback={null}>
        <RouteTracker />
      </Suspense>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
