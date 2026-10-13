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

    case 'STOCK_UPDATED': {
      const sku = data?.sku_name || data?.sku || data?.name || 'Inventory item'
      const qty = data?.quantity ?? data?.qty ?? data?.units ?? ''
      return {
        title: '📦 Warehouse Stock Updated',
        message: `${sku} updated via Handheld${qty !== '' ? ` (${qty} units)` : ''}`,
      }
    }

    case 'SCAN_COMPLETED': {
      const code = data?.barcode || data?.code || data?.sku || ''
      return {
        title: '🔍 Barcode Scanned',
        message: `Scanned ${code || 'item'} at warehouse floor`,
      }
    }

    case 'KHATA_ENTRY':
    case 'KHATA_UPDATED': {
      const amt = data?.amount
        ? `PKR ${Number(data.amount).toLocaleString('en-PK')}`
        : ''
      const note = data?.note ? ` (${data.note})` : ''
      return {
        title: '📒 Khata Ledger Updated',
        message: `Field collection recorded${amt ? ` — ${amt}` : ''}${note}`,
      }
    }

    case 'PARTY_CREATED': {
      const name = data?.name || data?.party_name || 'New Party'
      return {
        title: '👥 Party Registered',
        message: `${name} enrolled from Mobile`,
      }
    }

    case 'WORKER_CREATED': {
      const name = data?.name || data?.worker_name || 'New Worker'
      return {
        title: '👷 Karigar Added',
        message: `${name} registered on shop floor`,
      }
    }

    case 'DISPATCH_UPDATED': {
      const order = data?.order_number || data?.id || 'Dispatch order'
      return {
        title: '🚚 Dispatch Updated',
        message: `${order} updated via Handheld`,
      }
    }

    case 'DEVICE_CONNECTED': {
      const label = data?.deviceLabel || 'Mobile device'
      return {
        title: '📱 Handheld Connected',
        message: `${label} paired with local mesh`,
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
