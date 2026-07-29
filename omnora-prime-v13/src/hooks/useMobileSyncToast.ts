'use client'
import { useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/useToast'

// Map event type to premium title and message
function buildToastMessage(
  type: string,
  data: any
): { title: string; message: string } | null {
  switch (type) {
    case 'ATTENDANCE_LOGGED': {
      const status = data?.status
      const statusLabel =
        status === 'present' ? 'Present ✓'
        : status === 'absent' ? 'Absent'
        : status === 'half' ? 'Half Day'
        : status

      return {
        title: '📱 Attendance Logged',
        message: `Attendance marked via Mobile — ${statusLabel}`,
      }
    }

    case 'PRODUCTION_LOGGED': {
      const units = data?.units_produced
      const grade = data?.grade
      return {
        title: '⚡ Production Logged',
        message: `Production logged via Mobile — ${units} units` + (grade ? ` (Grade ${grade})` : ''),
      }
    }

    case 'ADVANCE_GIVEN': {
      const amt = data?.amount
        ? `PKR ${Number(data.amount).toLocaleString('en-PK')}`
        : 'Advance'
      return {
        title: '💰 Peshgi Advance Given',
        message: `${amt} given via Mobile`,
      }
    }

    case 'INVOICE_CREATED': {
      const num = data?.invoice_number
      return {
        title: '🧾 Invoice Created',
        message: `Invoice ${num || ''} created via Mobile`,
      }
    }

    case 'PAYMENT_RECEIVED': {
      const amt = data?.amount
        ? `PKR ${Number(data.amount).toLocaleString('en-PK')}`
        : 'Payment'
      return {
        title: '✅ Payment Received',
        message: `${amt} payment received via Mobile`,
      }
    }

    default:
      return null
  }
}

// Rate limiter — max 1 toast per 2 seconds to avoid flooding when bulk sync comes in
const lastToastTime: Record<string, number> = {}
const TOAST_MIN_INTERVAL_MS = 2000

function shouldShowToast(type: string): boolean {
  const last = lastToastTime[type] || 0
  if (Date.now() - last < TOAST_MIN_INTERVAL_MS) {
    return false
  }
  lastToastTime[type] = Date.now()
  return true
}

export function useMobileSyncToast() {
  const { success, info } = useToast()

  const handleMobileEvent = useCallback(
    (event: CustomEvent) => {
      const { type, data } = event.detail

      if (!shouldShowToast(type)) return

      const toastData = buildToastMessage(type, data)
      if (!toastData) return

      info(toastData.title, toastData.message)
    },
    [info]
  )

  const handleSyncComplete = useCallback(
    (event: CustomEvent) => {
      const { rowsPulled, durationMs } = event.detail

      if (rowsPulled === 0) return

      success(
        'Sync Complete',
        `✓ ${rowsPulled} mobile entr${rowsPulled === 1 ? 'y' : 'ies'} synced in ${durationMs}ms`
      )
    },
    [success]
  )

  useEffect(() => {
    window.addEventListener(
      'noxis:mobile-event',
      handleMobileEvent as EventListener
    )
    window.addEventListener(
      'noxis:sync-complete',
      handleSyncComplete as EventListener
    )

    return () => {
      window.removeEventListener(
        'noxis:mobile-event',
        handleMobileEvent as EventListener
      )
      window.removeEventListener(
        'noxis:sync-complete',
        handleSyncComplete as EventListener
      )
    }
  }, [handleMobileEvent, handleSyncComplete])
}
