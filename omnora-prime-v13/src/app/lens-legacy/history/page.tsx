'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { cn } from '@/lib/utils'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  RefreshCw, 
  Calendar,
  FileText,
  Clock,
  ChevronLeft,
  MoreVertical,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

/**
 * Noxis v13.0 — Lens Scan History
 * Audit trail for all document intelligence activities.
 */
export default function LensHistoryPage() {
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const [scans, setScans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    if (profile?.id) {
      fetchHistory()
    }
  }, [profile])

  async function fetchHistory() {
    setLoading(true)
    try {
      let query = supabase
        .from('lens_scans_incoming')
        .select('*')
        .order('received_at', { ascending: false })

      if (filterType !== 'all') {
        query = query.eq('extracted_data->>type', filterType)
      }

      const { data, error } = await query

      if (error) throw error
      setScans(data || [])
    } catch (err) {
      console.error('[LENS_HISTORY] Fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredScans = scans.filter(s => 
    s.source_node_id.toLowerCase().includes(search.toLowerCase()) ||
    (s.extracted_data?.partyName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.extracted_data?.invoiceNumber || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-electric-blue text-xs font-black uppercase tracking-widest">
            <Link href="/lens" className="hover:underline flex items-center gap-1">
              <ChevronLeft className="w-3 h-3" />
              Noxis Lens
            </Link>
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Scan History</h1>
          <p className="text-gray-500 text-sm">Audit trail of all processed document intelligence</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search by node, party or ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm w-80 focus:border-electric-blue/50 outline-none transition-all"
            />
          </div>
          <button onClick={fetchHistory} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
            <RefreshCw className={cn("w-5 h-5 text-gray-400", loading && "animate-spin")} />
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {['all', 'invoice', 'purchase_bill', 'payslip'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={cn(
              "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
              filterType === t 
                ? "bg-electric-blue border-electric-blue text-black" 
                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
            )}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main Grid/Table */}
      <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.02] border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <tr>
              <th className="px-6 py-4">Received</th>
              <th className="px-6 py-4">Node / Source</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Extracted Entity</th>
              <th className="px-6 py-4">Ref / Amount</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredScans.map((scan) => (
              <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold">{format(new Date(scan.received_at), 'dd MMM yyyy')}</span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(scan.received_at), 'HH:mm')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono">{scan.source_node_id}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                    scan.extracted_data?.type === 'invoice' ? "bg-electric-blue/10 text-electric-blue" :
                    scan.extracted_data?.type === 'purchase_bill' ? "bg-amber-500/10 text-amber-500" :
                    scan.extracted_data?.type === 'payslip' ? "bg-emerald-500/10 text-emerald-500" :
                    "bg-gray-500/10 text-gray-500"
                  )}>
                    {scan.extracted_data?.type || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-white">{scan.extracted_data?.partyName || '---'}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">#{scan.extracted_data?.invoiceNumber || 'N/A'}</span>
                    <span className="font-mono font-black text-white">
                      {profile?.currency} {scan.extracted_data?.totalAmount || '0.00'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-critical-red/10 rounded-lg text-gray-400 hover:text-critical-red transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredScans.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 text-gray-500">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Calendar className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm font-bold">No scans found in history</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
