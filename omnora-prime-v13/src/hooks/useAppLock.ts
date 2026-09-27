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

  const triggerLock = useCallback(async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('noxis_locked', 'true')
      localStorage.setItem('noxis_locked', 'true')
    }
    if ((window as any).electronAPI?.store?.setLocked) {
      try {
        await (window as any).electronAPI.store.setLocked(true)
      } catch {}
    }
    if (pathname !== '/lock' && !pathname?.includes('/login')) {
      router.replace('/lock')
    }
  }, [pathname, router])

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
      triggerLock()
    }, timeout * 60 * 1000)
  }, [pathname, isElectron, triggerLock])

  useEffect(() => {
    if (!isElectron) return

    // Immediate cold-boot security check
    const checkInitialLock = async () => {
      try {
        const api = (window as any).electronAPI
        const lockEnabled = await api.store.isAppLockEnabled()
        if (!lockEnabled) return

        const locked = await api.store.isLocked?.()
        const lastActive = (await api.store.getLastActive?.()) || 0
        const timeout = (await api.store.getLockTimeout?.()) || 5
        const isPastTimeout = lastActive > 0 && (Date.now() - lastActive > timeout * 60 * 1000)
        const isLocalLocked = typeof window !== 'undefined' && localStorage.getItem('noxis_locked') === 'true'

        if (locked || isPastTimeout || isLocalLocked) {
          triggerLock()
        }
      } catch (err) {
        console.error('Failed to verify initial lock state:', err)
      }
    }

    checkInitialLock()

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
  }, [pathname, isElectron, resetTimer, triggerLock])
}
