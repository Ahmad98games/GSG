'use client'
import { useEffect } from 'react'
import { useMobileSyncToast } from '@/hooks/useMobileSyncToast'

// This component lives in the layout and handles all mobile sync notifications
export function MobileSyncListener() {
  useMobileSyncToast()

  useEffect(() => {
    const electronAPI = (window as any).electronAPI

    const handleBridgeEvent = (
      _: any,
      payload: { event: string; data: any }
    ) => {
      window.dispatchEvent(
        new CustomEvent('noxis:mobile-event', {
          detail: {
            type: payload?.event,
            data: payload?.data,
          },
        })
      )
    }

    if (electronAPI?.onBridgeEvent) {
      electronAPI.onBridgeEvent(handleBridgeEvent)
    }

    let removeKhataListener: (() => void) | undefined
    if (electronAPI?.onKhataUpdated) {
      removeKhataListener = electronAPI.onKhataUpdated((data: any) => {
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
  }, [])

  return null
}
