'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { CheckCircle2, AlertCircle, Cloud, Wifi, WifiOff, Shield } from 'lucide-react'
import Link from 'next/link'

export function DataHealthCard() {
  const supabase = createClient()
  const { profile } = useBusinessProfile()

  const { data } = useQuery({
    queryKey: ['data-health', profile?.id],
    queryFn: async () => {
      // Last audit log activity = last data write to cloud
      const { data: auditLog } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('business_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Pending sync queue — check via internal API (non-fatal)
      let pending = 0
      try {
        const res = await fetch('/api/internal/sync')
        if (res.ok) {
          const json = await res.json()
          pending = json?.pending ?? 0
        }
      } catch {
        // Offline or unavailable — non-fatal
      }

      return {
        lastActivity: auditLog?.created_at || null,
        pendingSync: pending,
        cloudConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
      }
    },
    enabled: !!profile?.id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  if (!data) return null

  const isHealthy  = data.cloudConnected && data.pendingSync === 0
  const isPending  = data.pendingSync > 0
  const isOffline  = !data.cloudConnected

  const statusColor = isHealthy  ? '#10B981'
                    : isPending  ? '#F59E0B'
                    :              '#6B7280'

  const timeSince = (iso: string | null) => {
    if (!iso) return null
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
    if (mins < 2)   return 'just now'
    if (mins < 60)  return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)   return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <Link href="/settings/backup" className="block group">
      <div
        className="p-5 bg-[#0F1113] border rounded-sm transition-all hover:border-white/20"
        style={{ borderColor: statusColor + '30' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 flex items-center justify-center rounded-sm"
              style={{ backgroundColor: statusColor + '15' }}
            >
              {isOffline
                ? <WifiOff size={13} style={{ color: statusColor }} />
                : <Cloud size={13} style={{ color: statusColor }} />}
            </div>
            <p
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: statusColor }}
            >
              Data Safety
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isHealthy && (
              <span className="text-[9px] uppercase font-black tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-sm">
                Protected
              </span>
            )}
            {isHealthy
              ? <CheckCircle2 size={14} className="text-emerald-500" />
              : <AlertCircle size={14} style={{ color: statusColor }} />
            }
          </div>
        </div>

        {/* Status message */}
        {isHealthy && (
          <p className="text-xs text-gray-500 leading-relaxed">
            ✓ Your data is securely backed up to the cloud.
            Safe even if this PC is lost, stolen, or replaced.
          </p>
        )}
        {isPending && (
          <p className="text-xs text-amber-400 leading-relaxed">
            <span className="font-bold">{data.pendingSync}</span> records waiting to sync.
            Connect to the internet to complete backup.
          </p>
        )}
        {isOffline && !isPending && (
          <p className="text-xs text-gray-600 leading-relaxed">
            Offline — all data is saved locally. Connect to internet to sync to the cloud.
          </p>
        )}

        {/* Last activity + link */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
          {data.lastActivity ? (
            <p className="text-[10px] text-gray-700 font-mono">
              Last write: {timeSince(data.lastActivity)}
            </p>
          ) : (
            <p className="text-[10px] text-gray-700">No activity found</p>
          )}
          <div className="flex items-center gap-1 text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">
            <Shield size={10} />
            <span className="font-bold uppercase tracking-wider">Backup Settings</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
