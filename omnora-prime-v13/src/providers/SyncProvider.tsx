'use client'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { bootDeltaSync } from '@/lib/sync/deltaSyncEngine'
import { startRealtimeCDC } from '@/lib/sync/realtimeCDC'

interface SyncState {
  lastSyncAt: number
  isSyncing: boolean
  lastSyncResult: {
    rowsPulled: number
    durationMs: number
  } | null
  mobileEvents: any[]
}

const SyncContext = createContext<SyncState>({
  lastSyncAt: 0,
  isSyncing: false,
  lastSyncResult: null,
  mobileEvents: [],
})

export function SyncProvider({
  children,
}: { children: ReactNode }) {
  const { profile } = useBusinessProfile()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState(0)
  const [lastSyncResult, setLastSyncResult] = useState<any>(null)
  const [mobileEvents, setMobileEvents] = useState<Array<{
    id: string
    table: string
    data: any
    receivedAt: number
  }>>([])

  useEffect(() => {
    if (!profile?.id) return

    // Run delta sync once on mount
    const runSync = async () => {
      setIsSyncing(true)
      try {
        const result = await bootDeltaSync(profile.id)
        if (result) {
          setLastSyncAt(Date.now())
          setLastSyncResult({
            rowsPulled: result.rowsPulled,
            durationMs: result.durationMs,
          })

          if (result.rowsPulled > 0) {
            // Emit event for toast system
            window.dispatchEvent(
              new CustomEvent('noxis:sync-complete', { detail: result })
            )
          }
        }
      } finally {
        setIsSyncing(false)
      }
    }

    // Small delay — let UI render first, then sync in background
    const timer = setTimeout(runSync, 800)
    return () => clearTimeout(timer)
  }, [profile?.id])

  // Start CDC after profile loads
  useEffect(() => {
    if (!profile?.id) return

    const stopCDC = startRealtimeCDC({
      businessId: profile.id,

      onAttendance: (data) => {
        setMobileEvents(prev => [...prev, {
          id: crypto.randomUUID(),
          table: 'attendance_logs',
          data,
          receivedAt: Date.now(),
        }])

        // Emit for toast system
        window.dispatchEvent(
          new CustomEvent('noxis:mobile-event', {
            detail: {
              type: 'ATTENDANCE_LOGGED',
              data,
            },
          })
        )
      },

      onProduction: (data) => {
        window.dispatchEvent(
          new CustomEvent('noxis:mobile-event', {
            detail: {
              type: 'PRODUCTION_LOGGED',
              data,
            },
          })
        )
      },

      onAdvance: (data) => {
        window.dispatchEvent(
          new CustomEvent('noxis:mobile-event', {
            detail: {
              type: 'ADVANCE_GIVEN',
              data,
            },
          })
        )
      },

      onInvoice: (data) => {
        window.dispatchEvent(
          new CustomEvent('noxis:mobile-event', {
            detail: {
              type: 'INVOICE_CREATED',
              data,
            },
          })
        )
      },

      onPayment: (data) => {
        window.dispatchEvent(
          new CustomEvent('noxis:mobile-event', {
            detail: {
              type: 'PAYMENT_RECEIVED',
              data,
            },
          })
        )
      },
    })

    return () => {
      stopCDC()
    }
  }, [profile?.id])

  return (
    <SyncContext.Provider value={{
      lastSyncAt,
      isSyncing,
      lastSyncResult,
      mobileEvents,
    }}>
      {children}
    </SyncContext.Provider>
  )
}

export const useSync = () => useContext(SyncContext)
