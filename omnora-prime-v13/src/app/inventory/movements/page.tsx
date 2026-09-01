'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Download,
  Calendar,
  Filter,
  Package,
  X,
  FileText,
  TrendingUp,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

interface StockMovement {
  id: string
  adjustment_date: string
  created_at: string
  adjustment_type: string
  quantity: number
  sku_id: string
  sku_name: string
  unit: string
  qty_on_hand: number
  reason: string | null
  reference: string | null
  adjusted_by: string | null
}

const MOVEMENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'sale', label: 'Sales' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'return', label: 'Returns' },
  { value: 'adjustment', label: 'Adjustments' },
  { value: 'opening', label: 'Opening' },
]

export default function StockMovementsPage() {
  const supabase = createClient()
  const { profile } = useBusinessProfile()

  // Filters state - default 30 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [searchSku, setSearchSku] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  // Per-SKU Modal state
  const [selectedSku, setSelectedSku] = useState<{
    id: string
    name: string
    unit: string
    currentStock: number
  } | null>(null)
  const [skuMovements, setSkuMovements] = useState<StockMovement[]>([])
  const [skuLoading, setSkuLoading] = useState(false)

  // Fetch movements
  const fetchMovements = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)

    try {
      let query = supabase
        .from('stock_adjustments')
        .select(`
          id,
          adjustment_date,
          created_at,
          adjustment_type,
          quantity,
          sku_id,
          reason,
          reference,
          adjusted_by,
          skus!inner (
            name,
            unit,
            qty_on_hand
          )
        `)
        .eq('business_id', profile.id)
        .gte('adjustment_date', startDate)
        .lte('adjustment_date', endDate)
        .order('created_at', { ascending: false })
        .limit(200)

      const { data, error } = await query

      if (error) throw error

      const formatted: StockMovement[] = (data || []).map((row: any) => ({
        id: row.id,
        adjustment_date: row.adjustment_date,
        created_at: row.created_at,
        adjustment_type: row.adjustment_type || 'adjustment',
        quantity: row.quantity,
        sku_id: row.sku_id,
        sku_name: row.skus?.name || 'Unknown SKU',
        unit: row.skus?.unit || 'Pcs',
        qty_on_hand: row.skus?.qty_on_hand || 0,
        reason: row.reason,
        reference: row.reference,
        adjusted_by: row.adjusted_by || 'System',
      }))

      setMovements(formatted)
    } catch (err) {
      console.error('Failed to load stock movements:', err)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, startDate, endDate])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  // Filtered movements based on search + type
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesSearch =
        !searchSku ||
        m.sku_name.toLowerCase().includes(searchSku.toLowerCase()) ||
        (m.reference && m.reference.toLowerCase().includes(searchSku.toLowerCase()))

      const matchesType =
        typeFilter === 'all' ||
        m.adjustment_type.toLowerCase() === typeFilter.toLowerCase() ||
        (typeFilter === 'sale' && (m.adjustment_type === 'decrease' || m.reason === 'sale')) ||
        (typeFilter === 'purchase' && (m.adjustment_type === 'increase' || m.reason === 'purchase'))

      return matchesSearch && matchesType
    })
  }, [movements, searchSku, typeFilter])

  // Open SKU History Modal
  const openSkuHistory = async (sku: { id: string; name: string; unit: string; currentStock: number }) => {
    setSelectedSku(sku)
    setSkuLoading(true)
    try {
      const { data } = await supabase
        .from('stock_adjustments')
        .select(`
          id,
          adjustment_date,
          created_at,
          adjustment_type,
          quantity,
          sku_id,
          reason,
          reference,
          adjusted_by,
          skus ( name, unit, qty_on_hand )
        `)
        .eq('business_id', profile!.id)
        .eq('sku_id', sku.id)
        .order('created_at', { ascending: true })
        .limit(100)

      const formatted: StockMovement[] = (data || []).map((row: any) => ({
        id: row.id,
        adjustment_date: row.adjustment_date,
        created_at: row.created_at,
        adjustment_type: row.adjustment_type || 'adjustment',
        quantity: row.quantity,
        sku_id: row.sku_id,
        sku_name: row.skus?.name || sku.name,
        unit: row.skus?.unit || sku.unit,
        qty_on_hand: row.skus?.qty_on_hand || sku.currentStock,
        reason: row.reason,
        reference: row.reference,
        adjusted_by: row.adjusted_by || 'System',
      }))
      setSkuMovements(formatted)
    } finally {
      setSkuLoading(false)
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredMovements.map(m => ({
      Date: m.adjustment_date,
      Time: new Date(m.created_at).toLocaleTimeString('en-PK'),
      Type: m.adjustment_type.toUpperCase(),
      Item: m.sku_name,
      'Qty Change': m.quantity,
      Unit: m.unit,
      Reason: m.reason || 'N/A',
      Reference: m.reference || 'N/A',
      User: m.adjusted_by || 'System',
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Movements')
    XLSX.writeFile(workbook, `Stock_Movements_${startDate}_to_${endDate}.xlsx`)
  }

  // Chart data calculation for SKU history modal
  const chartData = useMemo(() => {
    if (!skuMovements.length) return []
    let runningTotal = 0
    return skuMovements.map(m => {
      runningTotal += m.quantity
      return {
        date: new Date(m.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
        stock: runningTotal,
      }
    })
  }, [skuMovements])

  const getBadgeStyle = (type: string, qty: number) => {
    const isPositive = qty > 0
    const lower = type.toLowerCase()
    if (lower.includes('sale') || qty < 0) {
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    }
    if (lower.includes('purchase') || (isPositive && lower.includes('increase'))) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    }
    if (lower.includes('return')) {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }
    if (lower.includes('opening')) {
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  }

  return (
    <div className="flex flex-col h-full bg-[#060708] text-white p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp size={22} className="text-[#60A5FA]" />
            Stock Movements Audit Log
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete history of inventory changes, sales deductions, and stock adjustments
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={filteredMovements.length === 0}
          className="flex items-center gap-2 bg-[#161A1F] hover:bg-white/10 border border-white/10 text-xs font-semibold px-4 py-2.5 rounded-sm text-emerald-400 transition-colors disabled:opacity-40"
        >
          <Download size={14} />
          Export to Excel
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0A0C0F] border border-white/6 p-4 rounded-sm">
        {/* Date Start */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
            <Calendar size={10} /> From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="bg-[#0F1114] border border-white/8 text-xs text-white px-3 py-2 rounded-sm outline-none focus:border-[#60A5FA]/40"
          />
        </div>

        {/* Date End */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
            <Calendar size={10} /> To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="bg-[#0F1114] border border-white/8 text-xs text-white px-3 py-2 rounded-sm outline-none focus:border-[#60A5FA]/40"
          />
        </div>

        {/* Search SKU */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
            <Search size={10} /> Search SKU / Ref
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchSku}
              onChange={e => setSearchSku(e.target.value)}
              placeholder="Search by SKU name or INV..."
              className="w-full bg-[#0F1114] border border-white/8 text-xs text-white px-3 py-2 rounded-sm outline-none focus:border-[#60A5FA]/40"
            />
            {searchSku && (
              <button
                onClick={() => setSearchSku('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Movement Type Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
            <Filter size={10} /> Movement Type
          </label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-[#0F1114] border border-white/8 text-xs text-white px-3 py-2 rounded-sm outline-none focus:border-[#60A5FA]/40"
          >
            {MOVEMENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="flex-1 bg-[#0A0C0F] border border-white/6 rounded-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F1114] border-b border-white/6 text-gray-500 uppercase text-[10px] font-bold tracking-wider sticky top-0">
              <tr>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Item (SKU)</th>
                <th className="px-4 py-3 text-right">Qty Change</th>
                <th className="px-4 py-3 text-right">Current Stock</th>
                <th className="px-4 py-3">Reference / Reason</th>
                <th className="px-4 py-3">Adjusted By</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/4">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <div className="w-5 h-5 border-2 border-[#60A5FA]/30 border-t-[#60A5FA] rounded-full animate-spin mx-auto mb-2" />
                    Loading stock movements...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-600">
                    <Package size={28} className="mx-auto mb-2 text-gray-700" />
                    No stock movement logs found for this filter
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => {
                  const isPositive = m.quantity > 0
                  const timeStr = new Date(m.created_at).toLocaleTimeString('en-PK', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <tr key={m.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-400">
                        {m.adjustment_date}{' '}
                        <span className="text-[10px] text-gray-600 ml-1">{timeStr}</span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-[10px] font-bold uppercase ${getBadgeStyle(
                            m.adjustment_type,
                            m.quantity
                          )}`}
                        >
                          {m.adjustment_type || 'adjustment'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            openSkuHistory({
                              id: m.sku_id,
                              name: m.sku_name,
                              unit: m.unit,
                              currentStock: m.qty_on_hand,
                            })
                          }
                          className="font-bold text-white hover:text-[#60A5FA] hover:underline text-left"
                        >
                          {m.sku_name}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 ${
                            isPositive ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight size={13} />
                          ) : (
                            <ArrowDownRight size={13} />
                          )}
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-gray-400">
                        {m.qty_on_hand} {m.unit}
                      </td>

                      <td className="px-4 py-3">
                        {m.reference ? (
                          <a
                            href={`/invoices?search=${encodeURIComponent(m.reference)}`}
                            className="text-[#60A5FA] hover:underline font-mono inline-flex items-center gap-1"
                          >
                            <FileText size={11} />
                            {m.reference}
                          </a>
                        ) : (
                          <span className="text-gray-600">{m.reason || '—'}</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-400">{m.adjusted_by}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-SKU Movement History Modal */}
      {selectedSku && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0F1114] border border-white/10 rounded-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package size={18} className="text-[#60A5FA]" />
                  {selectedSku.name} History
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Current Stock:{' '}
                  <span className="text-emerald-400 font-bold font-mono">
                    {selectedSku.currentStock} {selectedSku.unit}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setSelectedSku(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mini Chart */}
            <div className="h-44 bg-[#0A0C0F] border border-white/6 rounded-sm p-3">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">
                Stock Trajectory
              </p>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#4B5563" fontSize={10} />
                    <YAxis stroke="#4B5563" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F1114',
                        borderColor: 'rgba(255,255,255,0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="stock"
                      stroke="#60A5FA"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#stockGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-600">
                  No data to plot
                </div>
              )}
            </div>

            {/* Movements List for this SKU */}
            <div className="max-h-60 overflow-y-auto border border-white/6 rounded-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A0C0F] border-b border-white/6 text-gray-500 uppercase text-[9px] font-bold">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {skuLoading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    skuMovements.map(sm => (
                      <tr key={sm.id}>
                        <td className="px-3 py-2 font-mono text-gray-400">
                          {sm.adjustment_date}
                        </td>
                        <td className="px-3 py-2 capitalize text-gray-400">
                          {sm.adjustment_type}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold">
                          <span
                            className={sm.quantity > 0 ? 'text-emerald-400' : 'text-red-400'}
                          >
                            {sm.quantity > 0 ? `+${sm.quantity}` : sm.quantity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500 font-mono">
                          {sm.reference || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
