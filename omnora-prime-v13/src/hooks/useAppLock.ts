'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function useAppLock() {
  const router = useRouter()
  const pathname = usePathname()
  const timerRef = useRef<any>(null)
  const isElectron =
    typeof window !== 'undefined' &&
    !!(window as any).electronAPI?.store

  const resetTimer = useCallback(async () => {
    if (!isElectron) return
    if (pathname === '/lock') return
    if (pathname?.includes('/login')) return

    // Save activity timestamp
    await (window as any).electronAPI.store.saveLastActive()

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    const lockEnabled = await (window as any).electronAPI.store.isAppLockEnabled()
    if (!lockEnabled) return

    const timeout = await (window as any).electronAPI.store.getLockTimeout()

    timerRef.current = setTimeout(() => {
      router.replace('/lock')
    }, timeout * 60 * 1000)
  }, [pathname, isElectron, router])

  useEffect(() => {
    if (!isElectron) return

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    const handleEvent = () => {
      resetTimer()
    }

    events.forEach(e =>
      window.addEventListener(e, handleEvent, { passive: true })
    )

    resetTimer()

    return () => {
      events.forEach(e =>
        window.removeEventListener(e, handleEvent)
      )
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [pathname, isElectron, resetTimer])
}
