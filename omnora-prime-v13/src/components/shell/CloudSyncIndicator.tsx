'use client'
import { useEffect, useState } from 'react'
import { getQueuedCount } from '@/lib/sync/offlineQueue'

export function CloudSyncIndicator() {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const check = () => {
      setPendingCount(getQueuedCount())
    }
    check()

    // Listen to storage events (if modified in other tabs)
    window.addEventListener('storage', check)
    // Check local queue count every 15 seconds
    const interval = setInterval(check, 15000)

    return () => {
      window.removeEventListener('storage', check)
      clearInterval(interval)
    }
  }, [])

  if (pendingCount === 0)
    return null

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-bold uppercase tracking-wider">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      {pendingCount} syncing to cloud
    </div>
  )
}
