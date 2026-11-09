'use client'
import React, { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMobileSyncToast } from '@/hooks/useMobileSyncToast'
import { notify } from '@/stores/notificationStore'

// This component lives in the layout and handles all mobile sync notifications and instant live UI data refresh
export function MobileSyncListener() {
  useMobileSyncToast()
  const queryClient = useQueryClient()

  const pendingKeysRef = useRef<Set<string>>(new Set())
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const flushInvalidations = useCallback(() => {
    const keys = Array.from(pendingKeysRef.current)
    pendingKeysRef.current.clear()
    for (const key of keys) {
      try {
        queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' })
        queryClient.refetchQueries({ queryKey: [key], type: 'active' }).catch(() => {})
      } catch {}
    }
  }, [queryClient])

  const queueInvalidation = useCallback((keys: string[]) => {
    keys.forEach(k => pendingKeysRef.current.add(k))
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(flushInvalidations, 150)
  }, [flushInvalidations])

  const invalidateForEvent = useCallback((eventType: string, data?: any) => {
    try {
      switch (eventType) {
        case 'INVOICE_CREATED':
        case 'INVOICE_UPDATED':
          queueInvalidation(['invoices', 'invoice', 'dashboard-summary', 'dashboard-kpis'])
          break
        case 'PARTY_CREATED':
        case 'PARTY_UPDATED':
          queueInvalidation(['parties_registry', 'parties', 'party', 'khata', 'ledger_entries', 'dashboard-summary', 'dashboard-kpis'])
          break
        case 'WORKER_CREATED':
        case 'WORKER_UPDATED':
        case 'KARIGAR_CREATED':
        case 'KARIGAR_UPDATED':
          queueInvalidation(['karigars', 'workers', 'karigar_grades', 'attendance_today', 'dashboard-summary', 'dashboard-kpis'])
          break
        case 'STOCK_UPDATED':
        case 'SKU_CREATED':
        case 'SKU_UPDATED':
          queueInvalidation(['inventory', 'skus', 'sku', 'dashboard-summary'])
          break
        case 'ATTENDANCE_LOGGED':
          queueInvalidation(['attendance', 'attendance_today', 'karigars'])
          break
        case 'ADVANCE_GIVEN':
          queueInvalidation(['peshgi', 'advances', 'karigars', 'ledger_entries'])
          break
        case 'PRODUCTION_LOGGED':
          queueInvalidation(['production', 'production_log', 'production-logs', 'karigars'])
          break
        case 'KHATA_ENTRY':
        case 'KHATA_ENTRY_CREATED':
        case 'KHATA_UPDATED':
        case 'PAYMENT_RECEIVED':
          queueInvalidation(['ledger_entries', 'parties_registry', 'parties', 'accounts', 'dashboard-summary', 'dashboard-kpis'])
          break
        case 'DEVICE_COUNT_CHANGED':
        case 'DEVICE_CONNECTED':
        case 'DEVICE_PAIRED':
        case 'DEVICE_UNPAIRED':
        case 'DEVICE_DISCONNECTED':
          queueInvalidation(['devices', 'hub_devices', 'connected-devices'])
          window.dispatchEvent(new CustomEvent('noxis:device_count_changed', { detail: data }))
          break
        case 'DATA_INVALIDATED':
          if (data?.resource) {
            const r = String(data.resource)
            if (r === 'parties' || r === 'party') {
              queueInvalidation(['parties_registry', 'parties', 'party', 'khata', 'ledger_entries'])
            } else if (r === 'inventory' || r === 'skus') {
              queueInvalidation(['inventory', 'skus', 'sku'])
            } else if (r === 'karigars' || r === 'workers') {
              queueInvalidation(['karigars', 'workers', 'karigar_grades'])
            } else if (r === 'invoices' || r === 'invoice') {
              queueInvalidation(['invoices', 'invoice'])
            } else if (r === 'khata' || r === 'ledger' || r === 'ledger_entries') {
              queueInvalidation(['ledger_entries', 'parties_registry', 'parties', 'accounts'])
            } else {
              queueInvalidation([r])
            }
          } else {
            queueInvalidation([
              'parties_registry', 'parties', 'party',
              'inventory', 'skus', 'sku',
              'karigars', 'workers', 'karigar_grades',
              'invoices', 'invoice',
              'ledger_entries', 'accounts',
              'dashboard-summary', 'dashboard-kpis'
            ])
          }
          break
        case 'WORKFLOW_ALERT':
          if (data) {
            const sev = (data.severity as 'info' | 'warning' | 'error' | 'success') || 'info'
            notify[sev](data.title || 'Workflow Alert', data.message || '', data.route)
            queueInvalidation(['workflow-runs', 'workflows'])
          }
          break
      }
    } catch (e) {
      console.warn('[SyncListener] Query invalidation warning:', e)
    }
  }, [queueInvalidation])

  useEffect(() => {
    const electronAPI = (window as any).electronAPI

    const handleBridgeEvent = (
      _: any,
      payload: { event: string; data: any }
    ) => {
      const eventType = payload?.event
      const data = payload?.data

      invalidateForEvent(eventType, data)

      window.dispatchEvent(
        new CustomEvent('noxis:mobile-event', {
          detail: {
            type: eventType,
            data,
          },
        })
      )
    }

    if (electronAPI?.onBridgeEvent) {
      electronAPI.onBridgeEvent(handleBridgeEvent)
    } else if (electronAPI?.on) {
      electronAPI.on('bridge-event', handleBridgeEvent)
    }

    let removeKhataListener: (() => void) | undefined
    if (electronAPI?.onKhataUpdated) {
      removeKhataListener = electronAPI.onKhataUpdated((data: any) => {
        invalidateForEvent('KHATA_UPDATED', data)
        window.dispatchEvent(
          new CustomEvent('noxis:mobile-event', {
            detail: {
              type: 'KHATA_UPDATED',
              data,
            },
          })
        )
      })
    }

    // Browser / Dev fallback via BroadcastChannel
    let bc: BroadcastChannel | null = null
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('noxis-mobile-bridge')
        bc.onmessage = (ev) => {
          if (ev.data && ev.data.event) {
            invalidateForEvent(ev.data.event, ev.data.data)
            window.dispatchEvent(
              new CustomEvent('noxis:mobile-event', {
                detail: {
                  type: ev.data.event,
                  data: ev.data.data,
                },
              })
            )
          }
        }
      } catch {}
    }

    return () => {
      electronAPI?.removeBridgeEventListener?.()
      if (removeKhataListener) removeKhataListener()
      if (bc) bc.close()
    }
  }, [invalidateForEvent])

  return null
}
