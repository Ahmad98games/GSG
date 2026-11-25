'use client'

import { useEffect, useRef } from 'react'
import { useLockStore } from '@/stores/lockStore'

export function useLockTimer() {
  const {
    isLocked,
    lastActivityAt,
    autoLockMinutes,
    hasPinConfigured,
    lock,
    recordActivity,
    setAutoLockMinutes,
    setHasPinConfigured,
  } = useLockStore()

  const lastWriteRef = useRef<number>(0)

  // Hydrate initial PIN & timeout configuration from Electron store
  useEffect(() => {
    if (typeof window === 'undefined') return
    const api = (window as any).electronAPI
    if (!api?.store) return

    let cancelled = false
    ;(async () => {
      try {
        const [pinEnabled, timeout, storeLocked] = await Promise.all([
          api.store.isAppLockEnabled?.().catch(() => false),
          api.store.getLockTimeout?.().catch(() => 5),
          api.store.isLocked?.().catch(() => false),
        ])
        if (cancelled) return
        setHasPinConfigured(Boolean(pinEnabled))
        if (typeof timeout === 'number' && !isNaN(timeout)) {
          setAutoLockMinutes(timeout)
        }
        if (storeLocked && pinEnabled) {
          lock()
        }
      } catch {}
    })()

    return () => {
      cancelled = true
    }
  }, [setHasPinConfigured, setAutoLockMinutes, lock])

  // Idle timer check (every 10 seconds)
  useEffect(() => {
    if (autoLockMinutes <= 0 || !hasPinConfigured) return

    const checkInterval = setInterval(() => {
      const state = useLockStore.getState()
      if (state.isLocked || !state.hasPinConfigured || state.autoLockMinutes <= 0) return

      const idleMs = Date.now() - state.lastActivityAt
      const limitMs = state.autoLockMinutes * 60 * 1000

      if (idleMs >= limitMs) {
        state.lock()
        try {
          ;(window as any).electronAPI?.store?.setLocked?.(true)
        } catch {}
      }
    }, 10_000)

    return () => clearInterval(checkInterval)
  }, [autoLockMinutes, hasPinConfigured])

  // Track mouse & keyboard activity + Ctrl+L shortcut
  useEffect(() => {
    if (typeof window === 'undefined') return

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']

    const handleActivity = () => {
      const now = Date.now()
      if (now - lastWriteRef.current > 1000) {
        lastWriteRef.current = now
        recordActivity()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        const state = useLockStore.getState()
        if (state.hasPinConfigured) {
          e.preventDefault()
          state.lock()
          try {
            ;(window as any).electronAPI?.store?.setLocked?.(true)
          } catch {}
        }
      }
    }

    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }))
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity))
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [recordActivity, isLocked, lastActivityAt])
}
