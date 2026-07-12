'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { Can } from '@/components/rbac/Can'

const ACTION_LABELS: Record<string, {
  label: string
  color: string
}> = {
  'invoice.created': {
    label: 'Invoice Created',
    color: '#60A5FA'
  },
  'invoice.posted': {
    label: 'Invoice Posted',
    color: '#10B981'
  },
  'invoice.deleted': {
    label: 'Invoice Deleted',
    color: '#EF4444'
  },
  'invoice.payment_recorded': {
    label: 'Payment Recorded',
    color: '#10B981'
  },
  'karigar.peshgi_given': {
    label: 'Peshgi Given',
    color: '#C5A059'
  },
  'karigar.attendance_marked': {
    label: 'Attendance Marked',
    color: '#8B5CF6'
  },
  'karigar.production_logged': {
    label: 'Production Logged',
    color: '#60A5FA'
  },
  'user.added': {
    label: 'User Added',
    color: '#10B981'
  },
  'user.removed': {
    label: 'User Removed',
    color: '#EF4444'
  },
  'settings.changed': {
    label: 'Settings Changed',
    color: '#F59E0B'
  },
  'license.activated': {
    label: 'License Activated',
    color: '#10B981'
  },
}

export default function AuditPage() {
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const [filter, setFilter] = useState('')

  const { data: logs = [], isLoading } =
    useQuery({
      queryKey: ['audit-logs', profile?.id],
      queryFn: async () => {
        const { data } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('business_id', profile!.id)
          .order('created_at', {
            ascending: false
          })
          .limit(200)
        return data || []
      },
      enabled: !!profile?.id,
      staleTime: 60 * 1000,
    })

  const filtered = filter
    ? logs.filter((l: any) =>
        l.action.includes(filter) ||
        l.user_name?.toLowerCase()
          .includes(filter.toLowerCase()) ||
        l.entity_label?.toLowerCase()
          .includes(filter.toLowerCase())
      )
    : logs

  return (
    <Can
      permission="view:audit_log"
      fallback={
        <div className="p-6 max-w-lg">
          <div className="p-8 text-center
            bg-[#0F1114] border border-white/8
            rounded-sm">
            <p className="text-sm text-gray-500">
              Audit log requires Owner or
              Accountant access.
            </p>
          </div>
        </div>
      }
    >
      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="flex items-center
          justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold
              text-white tracking-tight uppercase italic">
              Audit Log
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Every action taken in Noxis Hub,
              by whom, and when.
            </p>
          </div>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search actions..."
            className="bg-[#0F1114] border
              border-white/8 text-white text-sm
              px-3 py-2 w-48 outline-none
              focus:border-[#60A5FA]/40 text-xs"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1,2,3,4,5].map(i => (
              <div key={i}
                className="h-14 bg-white/4 rounded-sm" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center
            bg-[#0F1114] border border-white/8
            rounded-sm">
            <p className="text-sm text-gray-500">
              No audit events found.
            </p>
          </div>
        ) : (
          <div className="bg-[#0F1114]
            border border-white/8 rounded-sm
            overflow-hidden">
            {filtered.map((log: any,
              index: number) => {
              const actionMeta =
                ACTION_LABELS[log.action] || {
                  label: log.action,
                  color: '#6B7280',
                }
              return (
                <div
                  key={log.id}
                  className={`flex items-center
                    gap-4 px-5 py-3 text-sm
                    ${index < filtered.length - 1
                      ? 'border-b border-white/4'
                      : ''}`}
                >
                  {/* Color dot */}
                  <div
                    className="w-2 h-2 rounded-full
                      flex-shrink-0"
                    style={{
                      backgroundColor:
                        actionMeta.color
                    }}
                  />

                  {/* Action */}
                  <span
                    className="text-xs font-semibold
                      flex-shrink-0 w-44"
                    style={{ color: actionMeta.color }}
                  >
                    {actionMeta.label}
                  </span>

                  {/* Who */}
                  <span className="text-xs
                    text-gray-400 w-32 flex-shrink-0">
                    {log.user_name || 'System'}
                    {log.user_role && (
                      <span className="text-gray-700
                        ml-1 text-[9px] uppercase tracking-widest font-black">
                        ({log.user_role})
                      </span>
                    )}
                  </span>

                  {/* Entity */}
                  <span className="text-xs
                    text-gray-500 flex-1 truncate">
                    {log.entity_label ||
                      log.entity_type}
                  </span>

                  {/* Time */}
                  <span className="text-[10px]
                    text-gray-700 flex-shrink-0
                    font-mono">
                    {new Date(log.created_at)
                      .toLocaleString('en-PK', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Can>
  )
}
