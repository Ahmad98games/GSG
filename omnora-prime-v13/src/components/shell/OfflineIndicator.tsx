'use client'
import { useState, useEffect } from 'react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const updateStatus = () => {
      const online = navigator.onLine
      if (!online) setWasOffline(true)
      if (online && wasOffline) {
        setShowReconnected(true)
        setTimeout(() => {
          setShowReconnected(false)
        }, 3000)
      }
      setIsOnline(online)
    }

    // Check immediately
    updateStatus()

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [wasOffline])

  // Online and never been offline — show nothing
  if (isOnline && !showReconnected) return null

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[99] flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl transition-all duration-300 ${
      showReconnected
        ? 'bg-emerald-500 text-black'
        : 'bg-[#1a0a00] border border-amber-500/40 text-amber-400'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        showReconnected
          ? 'bg-black'
          : 'bg-amber-500 animate-pulse'
      }`} />
      {showReconnected
        ? '✓ Back online — syncing data'
        : 'Offline — all changes saved locally'}
    </div>
  )
}
