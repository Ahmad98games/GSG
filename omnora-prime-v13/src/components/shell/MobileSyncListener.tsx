'use client'
import { useEffect } from 'react'
import { useMobileSyncToast } from '@/hooks/useMobileSyncToast'

// This component lives in the layout and handles all mobile sync notifications
export function MobileSyncListener() {
  useMobileSyncToast()

  useEffect(() => {
    if (!(window as any).electronAPI) return

    const handleBridgeEvent = (
      _: any,
      payload: { event: string; data: any }
    ) => {
      window.dispatchEvent(
        new CustomEvent('noxis:mobile-event', {
          detail: {
            type: payload.event,
            data: payload.data,
          },
        })
      )
    }

    if ((window as any).electronAPI.onBridgeEvent) {
      ;(window as any).electronAPI.onBridgeEvent(handleBridgeEvent)
    }

    return () => {
      ;(window as any).electronAPI?.removeBridgeEventListener?.()
    }
  }, [])

  return null
}
