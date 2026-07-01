'use client'
import { useEffect, useState } from 'react'

export function CloudSyncIndicator() {
  const [stats, setStats] = useState({
    pending: 0, failed: 0
  })

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/internal/sync')
        const data = await res.json()
        setStats(data.stats || {
          pending: 0, failed: 0
        })
      } catch {}
    }
    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [])

  if (stats.pending === 0 && stats.failed === 0)
    return null

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-bold uppercase tracking-wider">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      {stats.pending} syncing to cloud
    </div>
  )
}
