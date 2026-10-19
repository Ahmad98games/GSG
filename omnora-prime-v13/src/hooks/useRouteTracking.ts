'use client'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function useRouteTracking() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isElectron =
    typeof window !== 'undefined' &&
    !!(window as any).electronAPI?.store

  useEffect(() => {
    if (!pathname) return

    const excluded = [
      '/',
      '/index.html',
      '/login',
      '/lock',
      '/setup',
      '/signup',
      '/download',
      '/pricing',
      '/docs',
      '/portal',
      '/admin',
    ]
    if (pathname === '/' || excluded.some(e => e !== '/' && pathname.startsWith(e))) return

    // Save the current operational route to Electron store
    if (isElectron) {
      try {
        (window as any).electronAPI.store.saveLastRoute(pathname)
      } catch {}
    }

    // Always mirror to localStorage for resilient dual-layer recovery
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('noxis_last_route', pathname)
        localStorage.setItem('noxis_last_active_at', Date.now().toString())
      } catch {}
    }
  }, [pathname, isElectron])
}
