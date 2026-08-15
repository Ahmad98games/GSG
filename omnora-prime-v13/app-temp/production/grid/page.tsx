'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useIndustryConfig } from '@/hooks/useIndustryConfig'
import { useToast } from '@/hooks/useToast'
import { Save, RefreshCw, Table, FileSpreadsheet, Keyboard, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Decimal } from 'decimal.js'

interface GridRow {
  karigarId: string
  karigarName: string
  karigarCode: string
  pieceRate: number
  peshgiBalance: number
  attendanceStatus: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday' | null
  attendanceLogId?: string
  unitsProduced: string
  productionLogId?: string
  grade: 'A' | 'B' | 'C' | 'rejected' | ''
  advanceToGive: string
  earnings: number
  dirty: boolean
}

export default function PieceRateGridPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { profile } = useBusinessProfile()
  const { t, fmt } = useIndustryConfig()
  const toast = useToast()

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  // 1. Query all active piece-rate karigars and today's logs
  const { data: initialData = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['karigars-grid', profile?.id, today],
    queryFn: async () => {
      if (!profile?.id) return []

      const [karigarRes, attendanceRes, productionRes] = await Promise.all([
        supabase
          .from('karigars')
          .select('*')
          .eq('business_id', profile.id)
          .eq('status', 'active')
          .eq('wage_type', 'piece_rate')
          .order('name'),

        supabase
          .from('attendance_logs')
          .select('id, karigar_id, status')
          .eq('business_id', profile.id)
          .eq('log_date', today),

        supabase
          .from('karigar_production_logs')
          .select('id, karigar_id, qty_produced, quality_grade, effective_earning')
          .eq('business_id', profile.id)
          .eq('log_date', today)
      ])

      if (karigarRes.error) throw karigarRes.error

      const attendanceMap = new Map<string, { id: string; status: string }>(
        (attendanceRes.data || []).map((a: any) => [a.karigar_id, { id: a.id, status: a.status }])
      )
      const productionMap = new Map<string, any>(
        (productionRes.data || []).map((p: any) => [p.karigar_id, p])
      )

      return (karigarRes.data || []).map((k: any) => {
        const att = attendanceMap.get(k.id)
        const prod = productionMap.get(k.id)

        return {
          karigarId: k.id,
          karigarName: k.name,
          karigarCode: k.karigar_code,
          pieceRate: k.piece_rate || 0,
          peshgiBalance: k.current_advance || 0,
          attendanceStatus: att ? (att.status as any) : null,
          attendanceLogId: att?.id,
          unitsProduced: prod ? String(prod.qty_produced) : '',
          productionLogId: prod?.id,
          grade: prod?.quality_grade || '',
          advanceToGive: '',
          earnings: prod?.effective_earning || 0,
          dirty: false,
        } as GridRow
      })
    },
    enabled: !!profile?.id
  })

  // 2. Local state for live grid edits
  const [gridData, setGridData] = useState<GridRow[]>([])

  useEffect(() => {
    // Only hydrate initial data when user hasn't made unsaved modifications
    if (initialData && !gridData.some(r => r.dirty)) {
      setGridData(initialData)
    }
  }, [initialData])

  // 3. Real-time Totals
  const totals = useMemo(() => {
    let totalPresent = 0
    let totalUnits = new Decimal(0)
    let totalEarnings = new Decimal(0)
    let totalAdvances = new Decimal(0)

    gridData.forEach(row => {
      if (row.attendanceStatus === 'present' || row.attendanceStatus === 'half_day') {
        totalPresent++
      }
      if (row.unitsProduced) {
        totalUnits = totalUnits.plus(new Decimal(row.unitsProduced || 0))
      }
      totalEarnings = totalEarnings.plus(new Decimal(row.earnings || 0))
      if (row.advanceToGive) {
        totalAdvances = totalAdvances.plus(new Decimal(row.advanceToGive || 0))
      }
    })

    return {
      totalPresent,
      totalUnits: totalUnits.toNumber(),
      totalEarnings: totalEarnings.toNumber(),
      totalAdvances: totalAdvances.toNumber(),
    }
  }, [gridData])

  // 4. Update helper
  const updateRow = (index: number, updates: Partial<GridRow>) => {
    setGridData(prev => prev.map((row, idx) => {
      if (idx !== index) return row
      const nextRow = { ...row, ...updates, dirty: true }

      // Live recalculation of earnings
      if ('unitsProduced' in updates || 'grade' in updates) {
        const units = parseFloat(nextRow.unitsProduced) || 0
        if (nextRow.grade === 'rejected') {
          nextRow.earnings = 0
        } else {
          nextRow.earnings = new Decimal(units).times(nextRow.pieceRate).toNumber()
        }
      }
      return nextRow
    }))
  }

  // 5. Excel Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, field: 'attendance' | 'units' | 'grade' | 'advance') => {
    const fields: ('attendance' | 'units' | 'grade' | 'advance')[] = ['attendance', 'units', 'grade', 'advance']
    const fieldIndex = fields.indexOf(field)
    
    let targetRow = rowIndex
    let targetField = field
    
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      targetRow = Math.max(0, rowIndex - 1)
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      targetRow = Math.min(gridData.length - 1, rowIndex + 1)
    } else if (e.key === 'ArrowLeft') {
      const input = e.target as HTMLInputElement | HTMLSelectElement
      const isInput = input.tagName === 'INPUT'
      const selectionStart = (input as HTMLInputElement).selectionStart
      if (!isInput || selectionStart === 0 || selectionStart === null) {
        e.preventDefault()
        const newFieldIndex = Math.max(0, fieldIndex - 1)
        targetField = fields[newFieldIndex]
      }
    } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
      const input = e.target as HTMLInputElement | HTMLSelectElement
      const isInput = input.tagName === 'INPUT'
      const valLength = input.value?.length || 0
      const selectionStart = (input as HTMLInputElement).selectionStart
      
      if (e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) {
          if (fieldIndex === 0 && rowIndex > 0) {
            targetRow = rowIndex - 1
            targetField = fields[fields.length - 1]
          } else {
            const newFieldIndex = Math.max(0, fieldIndex - 1)
            targetField = fields[newFieldIndex]
          }
        } else {
          if (fieldIndex === fields.length - 1 && rowIndex < gridData.length - 1) {
            targetRow = rowIndex + 1
            targetField = fields[0]
          } else {
            const newFieldIndex = Math.min(fields.length - 1, fieldIndex + 1)
            targetField = fields[newFieldIndex]
          }
        }
      } else {
        if (!isInput || selectionStart === valLength || selectionStart === null) {
          e.preventDefault()
          const newFieldIndex = Math.min(fields.length - 1, fieldIndex + 1)
          targetField = fields[newFieldIndex]
        }
      }
    } else {
      return
    }
    
    const targetId = `cell-${targetRow}-${targetField}`
    const targetEl = document.getElementById(targetId)
    if (targetEl) {
      targetEl.focus()
      if (targetEl.tagName === 'INPUT') {
        (targetEl as HTMLInputElement).select()
      }
    }
  }

  // 6. Optimized Batch Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const dirtyRows = gridData.filter(row => row.dirty)
      if (dirtyRows.length === 0) return

      const authUser = (await supabase.auth.getUser()).data.user
      if (!authUser) throw new Error('Unauthorized')

      // Prepare Batch Payload Arrays
      const attendanceUpserts: any[] = []
      const attendanceDeletes: string[] = []
      const productionUpserts: any[] = []
      const productionDeletes: string[] = []
      const advanceInserts: any[] = []

      for (const row of dirtyRows) {
        // Attendance logic
        if (row.attendanceStatus) {
          attendanceUpserts.push({
            id: row.attendanceLogId || undefined,
            business_id: profile!.id,
            karigar_id: row.karigarId,
            log_date: today,
            status: row.attendanceStatus,
            noted_by: authUser.id
          })
        } else if (row.attendanceLogId) {
          attendanceDeletes.push(row.attendanceLogId)
        }

        // Production logic
        const units = parseFloat(row.unitsProduced) || 0
        if (units > 0) {
          productionUpserts.push({
            id: row.productionLogId || undefined,
            business_id: profile!.id,
            karigar_id: row.karigarId,
            log_date: today,
            qty_produced: units,
            unit: 'pieces',
            piece_rate_used: row.pieceRate,
            effective_earning: row.earnings,
            quality_grade: row.grade || null,
            logged_by: authUser.id
          })
        } else if (row.productionLogId) {
          productionDeletes.push(row.productionLogId)
        }

        // Advances logic
        const advance = parseFloat(row.advanceToGive) || 0
        if (advance > 0) {
          advanceInserts.push({
            business_id: profile!.id,
            karigar_id: row.karigarId,
            amount: advance,
            reason: 'Logged via piece-rate spreadsheet grid',
            advance_date: today,
            status: 'approved',
            approved_by: authUser.id,
            approved_at: new Date().toISOString()
          })
        }
      }

      // Execute Queries in Parallel Batches
      const promises: Promise<any>[] = []

      if (attendanceUpserts.length > 0) {
        promises.push(supabase.from('attendance_logs').upsert(attendanceUpserts))
      }
      if (attendanceDeletes.length > 0) {
        promises.push(supabase.from('attendance_logs').delete().in('id', attendanceDeletes))
      }

      if (productionUpserts.length > 0) {
        promises.push(supabase.from('karigar_production_logs').upsert(productionUpserts))
      }
      if (productionDeletes.length > 0) {
        promises.push(supabase.from('karigar_production_logs').delete().in('id', productionDeletes))
      }

      if (advanceInserts.length > 0) {
        promises.push(supabase.from('karigar_advances').insert(advanceInserts))
        
        // Update Karigar Balances
        for (const row of dirtyRows) {
          const adv = parseFloat(row.advanceToGive) || 0
          if (adv > 0) {
            promises.push(
              supabase
                .from('karigars')
                .update({
                  current_advance: new Decimal(row.peshgiBalance).plus(adv).toNumber()
                })
                .eq('id', row.karigarId)
            )
          }
        }
      }

      const results = await Promise.all(promises)
      const firstError = results.find(r => r?.error)?.error
      if (firstError) throw firstError
    },
    onSuccess: () => {
      toast.success('Piece-rate grid changes saved successfully')
      queryClient.invalidateQueries({ queryKey: ['karigars-grid'] })
    },
    onError: (err: any) => {
      console.error('Grid save error:', err)
      toast.error(`Failed to save: ${err.message || 'Unknown error'}`)
    }
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-noxis-bg text-noxis-text">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-noxis-accent" />
          <p className="text-xs uppercase tracking-widest text-noxis-text-muted">Loading Piece Rate Grid...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-noxis-bg text-noxis-text">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between border-b border-noxis-border bg-noxis-surface/50 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2 text-noxis-text-muted hover:text-noxis-text transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-noxis-border" />
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-noxis-accent animate-pulse" />
              Express Piece Rate Grid
            </h1>
            <p className="text-[10px] text-noxis-text-muted uppercase tracking-widest">
              Supervisor Log for {today} &bull; {profile?.business_name || 'Noxis Factory'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center justify-center p-2.5 bg-noxis-overlay border border-noxis-border rounded-sm text-noxis-text hover:bg-noxis-overlay-hover disabled:opacity-40 transition-all"
            title="Reload Data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !gridData.some(r => r.dirty)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-noxis-accent text-noxis-bg font-bold uppercase tracking-wider text-xs rounded-sm hover:brightness-110 disabled:opacity-30 disabled:grayscale transition-all"
          >
            {saveMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Live KPI Bar */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-px bg-noxis-border border-b border-noxis-border">
        <KPICard title="Piece Rate Workers" value={gridData.length} />
        <KPICard title="Present Today" value={totals.totalPresent} sub={`Abs: ${gridData.length - totals.totalPresent}`} />
        <KPICard title="Total Output" value={totals.totalUnits.toLocaleString()} label={t.productionUnit} />
        <KPICard title="Total Earnings" value={fmt(totals.totalEarnings)} highlight />
        <KPICard title="Peshgi Advances to Issue" value={fmt(totals.totalAdvances)} />
      </section>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto p-6">
        {gridData.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center opacity-40">
            <Table size={48} strokeWidth={1} className="mb-4 text-noxis-accent" />
            <p className="text-sm font-bold uppercase tracking-widest">No Active Piece-Rate Workers Found</p>
            <p className="text-xs text-noxis-text-muted mt-1">Make sure you have registered workers with wage type set to Piece Rate.</p>
          </div>
        ) : (
          <div className="min-w-full overflow-hidden border border-noxis-border rounded-sm bg-noxis-surface/20">
            <table className="min-w-full divide-y divide-noxis-border text-left border-collapse">
              <thead>
                <tr className="bg-noxis-surface/90 text-[10px] font-black uppercase tracking-widest text-noxis-text-muted">
                  <th className="px-4 py-3">Karigar Code</th>
                  <th className="px-4 py-3">Karigar Name</th>
                  <th className="px-4 py-3 text-right">Piece Rate</th>
                  <th className="px-4 py-3 text-right">Peshgi Balance</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Units Produced</th>
                  <th className="px-4 py-3">Quality Grade</th>
                  <th className="px-4 py-3">Advance to Give</th>
                  <th className="px-4 py-3 text-right text-noxis-accent">Today Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-noxis-border/50 bg-[#0C0F12]/30">
                {gridData.map((row, index) => {
                  const isDirty = row.dirty
                  return (
                    <tr 
                      key={row.karigarId} 
                      className={`hover:bg-noxis-overlay transition-colors ${isDirty ? 'bg-noxis-accent/5' : ''}`}
                    >
                      <td className="px-4 py-3 text-xs font-mono text-noxis-text-muted select-none">
                        {row.karigarCode}
                      </td>

                      <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="flex h-5 w-5 items-center justify-center bg-noxis-overlay border border-noxis-border text-[9px] font-bold rounded-full">
                            {row.karigarName.charAt(0).toUpperCase()}
                          </span>
                          <span>{row.karigarName}</span>
                          {isDirty && (
                            <span className="h-1.5 w-1.5 bg-noxis-accent rounded-full animate-pulse" title="Unsaved changes" />
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs font-mono text-right text-noxis-text-muted select-none">
                        {fmt(row.pieceRate)}
                      </td>

                      <td className="px-4 py-3 text-xs font-mono text-right text-noxis-text-muted select-none">
                        {fmt(row.peshgiBalance)}
                      </td>

                      <td className="px-4 py-2">
                        <select
                          id={`cell-${index}-attendance`}
                          value={row.attendanceStatus || ''}
                          onChange={e => updateRow(index, { attendanceStatus: (e.target.value as any) || null })}
                          onKeyDown={e => handleKeyDown(e, index, 'attendance')}
                          className={`w-full bg-noxis-bg border border-noxis-border px-3 py-1.5 text-xs focus:border-noxis-accent focus:outline-none rounded-sm transition-colors ${
                            row.attendanceStatus === 'present' ? 'text-noxis-success border-noxis-success/30' :
                            row.attendanceStatus === 'absent' ? 'text-noxis-danger border-noxis-danger/30' :
                            row.attendanceStatus === 'half_day' ? 'text-[#F59E0B] border-[#F59E0B]/30' :
                            row.attendanceStatus ? 'text-[#3B82F6] border-[#3B82F6]/30' : 'text-noxis-text-muted'
                          }`}
                        >
                          <option value="">— Select —</option>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="half_day">Half Day</option>
                          <option value="leave">Leave</option>
                          <option value="holiday">Holiday</option>
                        </select>
                      </td>

                      <td className="px-4 py-2">
                        <input
                          id={`cell-${index}-units`}
                          type="text"
                          value={row.unitsProduced}
                          onChange={e => {
                            const val = e.target.value
                            if (/^\d*\.?\d*$/.test(val)) {
                              updateRow(index, { unitsProduced: val })
                            }
                          }}
                          onKeyDown={e => handleKeyDown(e, index, 'units')}
                          className="w-full bg-noxis-bg border border-noxis-border px-3 py-1.5 text-xs font-mono focus:border-noxis-accent focus:outline-none rounded-sm text-white"
                          placeholder="0.00"
                        />
                      </td>

                      <td className="px-4 py-2">
                        <select
                          id={`cell-${index}-grade`}
                          value={row.grade}
                          onChange={e => updateRow(index, { grade: (e.target.value as any) })}
                          onKeyDown={e => handleKeyDown(e, index, 'grade')}
                          className="w-full bg-noxis-bg border border-noxis-border px-3 py-1.5 text-xs focus:border-noxis-accent focus:outline-none rounded-sm text-white"
                        >
                          <option value="">— Grade —</option>
                          <option value="A">Grade A</option>
                          <option value="B">Grade B</option>
                          <option value="C">Grade C</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>

                      <td className="px-4 py-2">
                        <input
                          id={`cell-${index}-advance`}
                          type="text"
                          value={row.advanceToGive}
                          onChange={e => {
                            const val = e.target.value
                            if (/^\d*\.?\d*$/.test(val)) {
                              updateRow(index, { advanceToGive: val })
                            }
                          }}
                          onKeyDown={e => handleKeyDown(e, index, 'advance')}
                          className="w-full bg-noxis-bg border border-noxis-border px-3 py-1.5 text-xs font-mono focus:border-noxis-accent focus:outline-none rounded-sm text-white"
                          placeholder="0.00"
                        />
                      </td>

                      <td className="px-4 py-3 text-xs font-mono text-right text-noxis-accent font-black">
                        {fmt(row.earnings)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Helper Footer */}
      <footer className="flex items-center space-x-6 border-t border-noxis-border bg-noxis-surface/90 px-6 py-3 text-[10px] text-noxis-text-muted uppercase tracking-widest font-black">
        <span className="flex items-center gap-1.5">
          <Keyboard className="h-3.5 w-3.5 text-noxis-accent" />
          Keyboard Shortcuts:
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-noxis-overlay border border-noxis-border px-1.5 py-0.5 rounded-sm">Arrow Keys</kbd> Navigate Cell
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-noxis-overlay border border-noxis-border px-1.5 py-0.5 rounded-sm">Enter</kbd> / <kbd className="bg-noxis-overlay border border-noxis-border px-1.5 py-0.5 rounded-sm">Tab</kbd> Move Down / Right
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-noxis-overlay border border-noxis-border px-1.5 py-0.5 rounded-sm">Shift+Tab</kbd> Move Left / Prev Row
        </span>
      </footer>
    </div>
  )
}

function KPICard({ title, value, label, highlight, sub }: {
  title: string
  value: string | number
  label?: string
  highlight?: boolean
  sub?: string
}) {
  return (
    <div className="bg-noxis-surface/30 px-6 py-4 flex flex-col justify-center">
      <span className="text-[9px] font-black uppercase tracking-widest text-noxis-text-muted mb-1">{title}</span>
      <div className="flex items-baseline space-x-1.5">
        <span className={`text-xl font-mono font-bold ${highlight ? 'text-noxis-accent' : 'text-white'}`}>
          {value}
        </span>
        {label && (
          <span className="text-[10px] uppercase font-bold text-noxis-text-muted">
            {label}
          </span>
        )}
      </div>
      {sub && (
        <span className="text-[9px] font-mono text-noxis-text-muted mt-1">{sub}</span>
      )}
    </div>
  )
}