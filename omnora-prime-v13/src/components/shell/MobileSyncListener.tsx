'use client'
import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMobileSyncToast } from '@/hooks/useMobileSyncToast'

// This component lives in the layout and handles all mobile sync notifications and instant live UI data refresh
export function MobileSyncListener() {
  useMobileSyncToast()
  const queryClient = useQueryClient()

  const invalidateForEvent = useCallback((eventType: string, data?: any) => {
    try {
      switch (eventType) {
        case 'INVOICE_CREATED':
          queryClient.invalidateQueries({ queryKey: ['invoices'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
          break
        case 'PARTY_CREATED':
          queryClient.invalidateQueries({ queryKey: ['parties'] })
          queryClient.invalidateQueries({ queryKey: ['khata'] })
          queryClient.invalidateQueries({ queryKey: ['ledger_entries'] })
          break
        case 'WORKER_CREATED':
          queryClient.invalidateQueries({ queryKey: ['karigars'] })
          queryClient.invalidateQueries({ queryKey: ['workers'] })
          break
        case 'ATTENDANCE_LOGGED':
          queryClient.invalidateQueries({ queryKey: ['attendance'] })
          queryClient.invalidateQueries({ queryKey: ['attendance_today'] })
          queryClient.invalidateQueries({ queryKey: ['karigars'] })
          break
        case 'ADVANCE_GIVEN':
          queryClient.invalidateQueries({ queryKey: ['peshgi'] })
          queryClient.invalidateQueries({ queryKey: ['advances'] })
          queryClient.invalidateQueries({ queryKey: ['ledger_entries'] })
          break
        case 'PRODUCTION_LOGGED':
          queryClient.invalidateQueries({ queryKey: ['production'] })
          queryClient.invalidateQueries({ queryKey: ['production_log'] })
          break
        case 'KHATA_ENTRY':
        case 'KHATA_UPDATED':
        case 'PAYMENT_RECEIVED':
          queryClient.invalidateQueries({ queryKey: ['ledger_entries'] })
          queryClient.invalidateQueries({ queryKey: ['parties'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
          break
        case 'DEVICE_COUNT_CHANGED':
        case 'DEVICE_CONNECTED':
          queryClient.invalidateQueries({ queryKey: ['devices'] })
          queryClient.invalidateQueries({ queryKey: ['hub_devices'] })
          break
        case 'DATA_INVALIDATED':
          if (data?.resource) {
            queryClient.invalidateQueries({ queryKey: [data.resource] })
          } else {
            queryClient.invalidateQueries()
          }
          break
      }
    } catch (e) {
      console.warn('[SyncListener] Query invalidation warning:', e)
    }
  }, [queryClient])

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
