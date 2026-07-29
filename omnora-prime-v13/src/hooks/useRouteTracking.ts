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
    if (!isElectron) return
    if (!pathname) return

    const excluded = [
      '/login',
      '/lock',
      '/setup',
      '/signup',
    ]
    if (excluded.some(e => pathname.startsWith(e))) return

    // Save the current route
    ;(window as any).electronAPI.store.saveLastRoute(pathname)
  }, [pathname, isElectron])
}
