'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { Can } from '@/components/rbac/Can'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Search, Download, 
  Filter, Check, AlertTriangle, 
  Info, Eye, ChevronDown, ChevronUp, FileSpreadsheet
} from 'lucide-react'

// Action labeling maps with premium severity coloring
const ACTION_METADATA: Record<string, {
  label: string
  color: string
  bg: string
  severity: 'positive' | 'warning' | 'critical' | 'info'
}> = {
  'invoice.created': {
    label: 'Invoice Created',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.08)',
    severity: 'info'
  },
  'invoice.posted': {
    label: 'Invoice Posted',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.08)',
    severity: 'positive'
  },
  'invoice.deleted': {
    label: 'Invoice Deleted',
    color: '#F87171',
    bg: 'rgba(248, 113, 113, 0.08)',
    severity: 'critical'
  },
  'invoice.payment_recorded': {
    label: 'Payment Recorded',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.08)',
    severity: 'positive'
  },
  'karigar.peshgi_given': {
    label: 'Peshgi Given',
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.08)',
    severity: 'warning'
  },
  'karigar.attendance_marked': {
    label: 'Attendance Marked',
    color: '#A78BFA',
    bg: 'rgba(167, 139, 250, 0.08)',
    severity: 'info'
  },
  'karigar.production_logged': {
    label: 'Production Logged',
    color: '#60A5FA',
    bg: 'rgba(96, 165, 250, 0.08)',
    severity: 'info'
  },
  'user.added': {
    label: 'User Added',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.08)',
    severity: 'positive'
  },
  'user.removed': {
    label: 'User Removed',
    color: '#F87171',
    bg: 'rgba(248, 113, 113, 0.08)',
    severity: 'critical'
  },
  'settings.changed': {
    label: 'Settings Changed',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.08)',
    severity: 'warning'
  },
  'license.activated': {
    label: 'License Activated',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.08)',
    severity: 'positive'
  },
}

export default function AuditPage() {
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  
  // States
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  // Load audit logs (or view details if accessible)
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs-detailed', profile?.id],
    queryFn: async () => {
      // Fetch using view audit_log_details if present, otherwise fallback to table
      const { data: viewData, error: viewErr } = await supabase
        .from('audit_log_details')
        .select('*')
        .eq('business_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!viewErr && viewData) {
        return viewData
      }

      // Fallback
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('business_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
    staleTime: 30 * 1000,
  })

  // Filter computations
  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      // 1. Text Search
      const searchMatch = !searchTerm
        ? true
        : log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.entity_label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())

      // 2. Category Toggle
      let categoryMatch = true
      if (categoryFilter !== 'all') {
        const actionPrefix = log.action?.split('.')[0] || ''
        categoryMatch = actionPrefix === categoryFilter
      }

      // 3. Date Range
      let dateMatch = true
      if (startDate) {
        dateMatch = dateMatch && new Date(log.created_at) >= new Date(startDate + 'T00:00:00')
      }
      if (endDate) {
        dateMatch = dateMatch && new Date(log.created_at) <= new Date(endDate + 'T23:59:59')
      }

      return searchMatch && categoryMatch && dateMatch
    })
  }, [logs, searchTerm, categoryFilter, startDate, endDate])

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return

    const headers = ['Timestamp', 'Action', 'Operator', 'Role', 'Entity', 'Entity ID', 'Session ID', 'Branch']
    const rows = filteredLogs.map((log: any) => [
      new Date(log.created_at).toISOString(),
      log.action,
      log.user_name || 'System',
      log.user_role || '',
      `${log.entity_type} (${log.entity_label || ''})`,
      log.entity_id || '',
      log.session_id || '',
      log.branch_name || log.branch_id || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((e: any[]) => e.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `audit_log_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Can
      permission="view:audit_log"
      fallback={
        <div className="p-6 max-w-lg mx-auto">
          <div className="p-8 text-center bg-[#0F1114] border border-white/5 rounded-sm shadow-2xl">
            <AlertTriangle className="mx-auto text-amber-500 mb-4" size={32} />
            <p className="text-sm text-gray-400 font-medium">
              Access Restricted. Audit log reviews require Administrator context.
            </p>
          </div>
        </div>
      }
    >
      <div className="p-6 max-w-[1200px] mx-auto space-y-6">
        {/* Header section with CSV Export */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight uppercase italic flex items-center gap-2">
              Compliance Audit Trail
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Immutably track who did what, when, and from where.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-[#0F1114] border border-white/5 rounded-sm">
          {/* Text Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter actions or users..."
              className="w-full bg-[#16181D]/60 border border-white/8 text-white text-xs pl-9 pr-3 py-2.5 outline-none focus:border-electric-blue/40"
            />
          </div>

          {/* Category Toggle Tabs */}
          <div className="flex space-x-1 border border-white/8 p-0.5 bg-[#16181D]/60">
            {['all', 'invoice', 'karigar', 'inventory'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex-1 py-1.5 text-[9px] uppercase font-bold tracking-widest transition-all ${
                  categoryFilter === cat
                    ? 'bg-electric-blue text-onyx shadow'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase font-black">From</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="flex-1 bg-[#16181D]/60 border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-electric-blue/40 font-mono"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase font-black">To</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="flex-1 bg-[#16181D]/60 border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-electric-blue/40 font-mono"
            />
          </div>
        </div>

        {/* Audit List Container */}
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-white/[0.02] border border-white/5 rounded-sm" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center border border-white/5 bg-[#0F1114] rounded-sm">
            <Info className="mx-auto text-gray-500 mb-3" size={24} />
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              No matching audit logs found.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log: any) => {
              const meta = ACTION_METADATA[log.action] || {
                label: log.action,
                color: '#9CA3AF',
                bg: 'rgba(156, 163, 175, 0.08)',
                severity: 'info'
              }
              const isExpanded = expandedLogId === log.id
              const hasDiff = log.old_values || log.new_values

              return (
                <div
                  key={log.id}
                  className="bg-[#0F1114] border border-white/5 rounded-sm overflow-hidden transition-all hover:border-white/10"
                >
                  {/* Row Header */}
                  <div
                    onClick={() => hasDiff && setExpandedLogId(isExpanded ? null : log.id)}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 gap-3 cursor-pointer ${
                      hasDiff ? 'hover:bg-white/[0.01]' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Status indicator */}
                      <span
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border"
                        style={{
                          color: meta.color,
                          backgroundColor: meta.bg,
                          borderColor: `${meta.color}20`
                        }}
                      >
                        {meta.label}
                      </span>

                      {/* User & Role */}
                      <span className="text-xs text-white font-medium">
                        {log.user_name || 'System'}
                        {log.user_role && (
                          <span className="text-gray-500 text-[9px] uppercase font-mono tracking-widest ml-1.5">
                            ({log.user_role})
                          </span>
                        )}
                      </span>

                      {/* Entity badge */}
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        → {log.entity_label || log.entity_type}
                      </span>
                    </div>

                    {/* Meta info & expander */}
                    <div className="flex items-center gap-4 justify-between md:justify-end">
                      {log.branch_name && (
                        <span className="text-[9px] uppercase tracking-widest font-black text-gray-600 bg-white/5 px-1.5 py-0.5">
                          {log.branch_name}
                        </span>
                      )}
                      
                      <span className="text-[10px] text-gray-600 font-mono">
                        {new Date(log.created_at).toLocaleString('en-PK', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>

                      {hasDiff && (
                        <div>
                          {isExpanded ? (
                            <ChevronUp className="text-gray-500" size={14} />
                          ) : (
                            <ChevronDown className="text-gray-500" size={14} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expandable Diff view */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="border-t border-white/5 bg-[#0A0B0D] overflow-hidden"
                      >
                        <div className="p-4 space-y-4">
                          {/* Diff visualizer grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Before container */}
                            <div className="space-y-2 border border-white/5 bg-[#0F1114]/40 p-3 rounded-sm">
                              <h4 className="text-[10px] uppercase font-black text-red-400 tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                                Before Change
                              </h4>
                              {log.old_values ? (
                                <pre className="text-[10px] font-mono text-gray-400 overflow-auto max-h-48 p-2 bg-[#050608]">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              ) : (
                                <p className="text-[10px] italic text-gray-600 p-2">None (Record Created)</p>
                              )}
                            </div>

                            {/* After container */}
                            <div className="space-y-2 border border-white/5 bg-[#0F1114]/40 p-3 rounded-sm">
                              <h4 className="text-[10px] uppercase font-black text-emerald-400 tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                After Change
                              </h4>
                              {log.new_values ? (
                                <pre className="text-[10px] font-mono text-gray-400 overflow-auto max-h-48 p-2 bg-[#050608]">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              ) : (
                                <p className="text-[10px] italic text-gray-600 p-2">None (Record Deleted)</p>
                              )}
                            </div>
                          </div>

                          {/* IP, User Agent, Session metadata details */}
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-gray-600 font-mono bg-white/[0.01] p-2 border border-white/5 rounded-sm">
                            {log.session_id && (
                              <div>
                                <span className="text-gray-500 uppercase tracking-widest font-black mr-1">Session:</span>
                                <span className="text-gray-400 select-all truncate max-w-[200px] inline-block align-bottom">{log.session_id}</span>
                              </div>
                            )}
                            {log.branch_id && (
                              <div>
                                <span className="text-gray-500 uppercase tracking-widest font-black mr-1">Branch ID:</span>
                                <span className="text-gray-400 select-all">{log.branch_id}</span>
                              </div>
                            )}
                            {log.entity_id && (
                              <div>
                                <span className="text-gray-500 uppercase tracking-widest font-black mr-1">Entity ID:</span>
                                <span className="text-gray-400 select-all">{log.entity_id}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Can>
  )
}
