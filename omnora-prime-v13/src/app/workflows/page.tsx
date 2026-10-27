'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { 
  Zap, Plus, Trash2, ChevronRight, 
  CheckCircle, Play, Pause, AlertCircle, Info,
  ShieldAlert, Clock, RefreshCw, Filter, ShieldCheck
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { motion, AnimatePresence } from 'framer-motion'
import { useTierStore } from '@/stores/tierStore'
import FeatureLock from '@/components/ui/FeatureLock'

const TRIGGER_OPTIONS = [
  {
    type: 'invoice.posted',
    label: 'Invoice is Posted',
    description: 'Fires when any invoice is finalized',
    icon: '📄',
    configFields: [],
  },
  {
    type: 'stock.below_threshold',
    label: 'Stock Falls Below Limit',
    description: 'Fires when any item hits its reorder level',
    icon: '📦',
    configFields: [
      { key: 'sku_id', label: 'Specific Item (optional)', type: 'sku_select' },
    ],
  },
  {
    type: 'invoice.overdue',
    label: 'Invoice Becomes Overdue',
    description: 'Fires when a payment due date passes',
    icon: '⏰',
    configFields: [
      { key: 'days_overdue', label: 'Days Overdue', type: 'number', default: 1 },
    ],
  },
  {
    type: 'karigar.peshgi_exceeds',
    label: 'Karigar Advance Exceeds Limit',
    description: 'Fires when a worker\'s advance balance is too high',
    icon: '💰',
    configFields: [
      { key: 'amount', label: 'Amount Threshold (PKR)', type: 'number', default: 10000 },
    ],
  },
  {
    type: 'schedule.daily',
    label: 'Every Day (Scheduled)',
    description: 'Runs once per day at startup',
    icon: '📅',
    configFields: [],
  },
]

const ACTION_OPTIONS = [
  {
    type: 'dashboard_notification',
    label: 'Show Dashboard Alert',
    description: 'Add a notification to the bell icon',
    icon: '🔔',
    fields: [
      { key: 'title', label: 'Alert Title', type: 'text' },
      { key: 'message', label: 'Message (use {variable})', type: 'text' },
      {
        key: 'severity',
        label: 'Severity',
        type: 'select',
        options: ['info', 'warning', 'error', 'success'],
      },
      { key: 'route', label: 'Link to (optional)', type: 'text' },
    ],
  },
  {
    type: 'whatsapp_notify',
    label: 'Send WhatsApp Message',
    description: 'Open WhatsApp with a pre-filled message',
    icon: '💬',
    fields: [
      { key: 'message_template', label: 'Message (use {variable})', type: 'textarea' },
    ],
  },
  {
    type: 'create_task',
    label: 'Create a Task',
    description: 'Add a to-do item to the task list',
    icon: '✅',
    fields: [
      { key: 'title', label: 'Task Title (use {variable})', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'due_in_days', label: 'Due in days', type: 'number', default: 1 },
    ],
  },
]

const VARIABLE_HINTS: Record<string, string[]> = {
  'invoice.posted': [
    '{invoice_number}', '{total_amount}',
    '{party_name}', '{phone}',
  ],
  'stock.below_threshold': [
    '{sku_name}', '{current_qty}',
    '{reorder_level}', '{unit}',
  ],
  'invoice.overdue': [
    '{invoice_number}', '{balance_due}',
    '{party_name}', '{days_overdue}', '{phone}',
  ],
  'karigar.peshgi_exceeds': [
    '{karigar_name}', '{peshgi_balance}',
    '{phone}',
  ],
}

const DEFAULT_PRESET_WORKFLOWS = [
  {
    id: 'wf_preset_low_stock',
    name: 'Low Stock Auto-Alert',
    trigger_type: 'stock.below_threshold',
    trigger_config: {},
    actions: [
      {
        type: 'dashboard_notification',
        title: 'Low Stock Warning',
        message: '[Inventory Warning] Stock fell below safe reorder threshold! Review inventory levels.',
        severity: 'warning',
        route: '/inventory',
      },
    ],
    is_active: true,
    trigger_count: 3,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'wf_preset_overdue_invoice',
    name: 'Overdue Customer Invoice Alert',
    trigger_type: 'invoice.overdue',
    trigger_config: { days_overdue: 1 },
    actions: [
      {
        type: 'dashboard_notification',
        title: 'Overdue Invoice Reminder',
        message: '[Receivables Alert] Customer invoice payment term has passed due date.',
        severity: 'error',
        route: '/sales',
      },
    ],
    is_active: true,
    trigger_count: 5,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'wf_preset_karigar_peshgi',
    name: 'Karigar Peshgi Advance Guard',
    trigger_type: 'karigar.peshgi_exceeds',
    trigger_config: { amount: 15000 },
    actions: [
      {
        type: 'dashboard_notification',
        title: 'Karigar Advance Threshold Exceeded',
        message: '[Advance Alert] Worker advance peshgi exceeds safe production threshold limit.',
        severity: 'warning',
        route: '/production',
      },
    ],
    is_active: true,
    trigger_count: 1,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'wf_preset_daily_summary',
    name: 'Daily Ledger & Production Reconciliation',
    trigger_type: 'schedule.daily',
    trigger_config: {},
    actions: [
      {
        type: 'create_task',
        title: 'Daily Ledger Reconciliation',
        description: 'Verify end-of-day register drawer, bank deposits, and karigar unit completions.',
        due_in_days: 1,
      },
    ],
    is_active: false,
    trigger_count: 0,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
]

export default function WorkflowsPage() {
  const { tier } = useTierStore()
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showBuilder, setShowBuilder] = useState(false)
  const [step, setStep] = useState<'trigger' | 'action' | 'name'>('trigger')

  const bizId = profile?.id || 'local_tenant'

  const [draft, setDraft] = useState<{
    name: string
    trigger_type: string
    trigger_config: Record<string, any>
    actions: any[]
  }>({
    name: '',
    trigger_type: '',
    trigger_config: {},
    actions: [],
  })

  const [currentAction, setCurrentAction] = useState<{
    type: string
    config: Record<string, any>
  } | null>(null)

  const [activeTab, setActiveTab] = useState<'rules' | 'audit'>('rules')
  const [auditFilter, setAuditFilter] = useState<'all' | 'completed' | 'throttled' | 'failed'>('all')
  const [isReconciling, setIsReconciling] = useState(false)

  const { data: auditData, isLoading: isLoadingAudit, refetch: refetchAudit } = useQuery({
    queryKey: ['workflow-runs', auditFilter],
    queryFn: async () => {
      const res = await fetch(`/api/workflows/runs?status=${auditFilter}&limit=100`)
      if (!res.ok) return { runs: [], stats: { total: 0, completed: 0, throttled: 0, failed: 0 } }
      return res.json()
    },
    refetchInterval: activeTab === 'audit' ? 4000 : false,
  })

  const handleManualReconcile = async () => {
    setIsReconciling(true)
    try {
      const res = await fetch('/api/workflows/reconcile', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Reconciliation & overdue scan complete!')
        refetchAudit()
      } else {
        toast.error(data.error || 'Reconciliation failed')
      }
    } catch (e: any) {
      toast.error('Failed to trigger reconciliation: ' + e.message)
    } finally {
      setIsReconciling(false)
    }
  }

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows', bizId],
    queryFn: async () => {
      let localList: any[] = []
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`noxis_cached_workflows_${bizId}`)
          if (cached) localList = JSON.parse(cached)
        } catch {}
      }

      // If local list is empty, seed with presets
      if (!localList || localList.length === 0) {
        localList = DEFAULT_PRESET_WORKFLOWS.map(w => ({ ...w, business_id: bizId }))
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`noxis_cached_workflows_${bizId}`, JSON.stringify(localList))
          } catch {}
        }
      }

      // Sync with cloud if authenticated
      if (profile?.id) {
        try {
          const { data, error } = await supabase
            .from('workflows')
            .select(`*, workflow_runs(count)`)
            .eq('business_id', profile.id)
            .order('created_at', { ascending: false })

          if (!error && data && data.length > 0) {
            const merged = [...data]
            for (const lw of localList) {
              if (!merged.some(m => m.id === lw.id)) {
                merged.push(lw)
              }
            }
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(`noxis_cached_workflows_${bizId}`, JSON.stringify(merged))
              } catch {}
            }
            return merged
          }
        } catch (err) {
          console.warn('[Workflows] Cloud query warning, using local:', err)
        }
      }

      return localList
    },
    staleTime: 1000 * 60,
  })

  const toggleWorkflow = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (typeof window !== 'undefined') {
        try {
          const cached = JSON.parse(localStorage.getItem(`noxis_cached_workflows_${bizId}`) || '[]')
          const updated = cached.map((w: any) => w.id === id ? { ...w, is_active: isActive } : w)
          localStorage.setItem(`noxis_cached_workflows_${bizId}`, JSON.stringify(updated))
        } catch {}
      }
      queryClient.setQueryData(['workflows', bizId], (old: any) => {
        if (!Array.isArray(old)) return []
        return old.map((w: any) => w.id === id ? { ...w, is_active: isActive } : w)
      })
      if (profile?.id) {
        try {
          await supabase.from('workflows').update({ is_active: isActive }).eq('id', id)
        } catch {}
      }
    },
    onSuccess: () => {
      toast.success('Workflow state updated')
    },
  })

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      if (typeof window !== 'undefined') {
        try {
          const cached = JSON.parse(localStorage.getItem(`noxis_cached_workflows_${bizId}`) || '[]')
          const updated = cached.filter((w: any) => w.id !== id)
          localStorage.setItem(`noxis_cached_workflows_${bizId}`, JSON.stringify(updated))
        } catch {}
      }
      queryClient.setQueryData(['workflows', bizId], (old: any) => {
        if (!Array.isArray(old)) return []
        return old.filter((w: any) => w.id !== id)
      })
      if (profile?.id) {
        try {
          await supabase.from('workflows').delete().eq('id', id)
        } catch {}
      }
    },
    onSuccess: () => {
      toast.success('Workflow removed')
    },
  })

  const saveWorkflow = useMutation({
    mutationFn: async () => {
      if (!draft.trigger_type || !draft.actions.length || !draft.name.trim()) return

      const newWf = {
        id: `wf_${Date.now()}`,
        business_id: bizId,
        name: draft.name.trim(),
        trigger_type: draft.trigger_type,
        trigger_config: draft.trigger_config,
        actions: draft.actions,
        is_active: true,
        trigger_count: 0,
        created_at: new Date().toISOString(),
      }

      // 1. Instant local persistence
      if (typeof window !== 'undefined') {
        try {
          const cached = JSON.parse(localStorage.getItem(`noxis_cached_workflows_${bizId}`) || '[]')
          const updated = [newWf, ...cached.filter((w: any) => w.id !== newWf.id)]
          localStorage.setItem(`noxis_cached_workflows_${bizId}`, JSON.stringify(updated))
        } catch {}
      }

      // 2. Optimistic UI update
      queryClient.setQueryData(['workflows', bizId], (old: any) => {
        const arr = Array.isArray(old) ? old : []
        return [newWf, ...arr.filter((w: any) => w.id !== newWf.id)]
      })

      // 3. Background cloud backup
      if (profile?.id) {
        try {
          await supabase.from('workflows').insert(newWf)
        } catch (err) {
          console.warn('[Workflows] Cloud sync deferred:', err)
        }
      }

      return newWf
    },
    onSuccess: () => {
      setShowBuilder(false)
      setStep('trigger')
      setDraft({
        name: '',
        trigger_type: '',
        trigger_config: {},
        actions: [],
      })
      toast.success('Workflow created and active!')
    },
    onError: () => {
      toast.error('Could not save workflow')
    },
  })

  const handleTestRun = (wf: any) => {
    const updatedCount = (wf.trigger_count || 0) + 1
    if (typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem(`noxis_cached_workflows_${bizId}`) || '[]')
        const updated = cached.map((w: any) => w.id === wf.id ? { ...w, trigger_count: updatedCount } : w)
        localStorage.setItem(`noxis_cached_workflows_${bizId}`, JSON.stringify(updated))
      } catch {}
    }
    queryClient.setQueryData(['workflows', bizId], (old: any) => {
      if (!Array.isArray(old)) return []
      return old.map((w: any) => w.id === wf.id ? { ...w, trigger_count: updatedCount } : w)
    })

    // Dispatch real notification into notification center
    for (const action of (wf.actions || [])) {
      if (action.type === 'dashboard_notification') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('noxis:notification', {
              detail: {
                id: Math.random().toString(36).substring(2, 9),
                type: action.severity || 'warning',
                title: action.title || wf.name,
                message: action.message || `Automated alert triggered by ${wf.name}`,
                timestamp: new Date().toISOString(),
                read: false,
              },
            })
          )
        }
      } else if (action.type === 'whatsapp_notify') {
        const msg = encodeURIComponent(action.message_template || `[Noxis Alert] ${wf.name} triggered.`)
        if (typeof window !== 'undefined') {
          window.open(`https://wa.me/?text=${msg}`, '_blank')
        }
      }
    }

    toast.success(`Workflow "${wf.name}" triggered! Actions dispatched.`)
  }

  const selectedTrigger = TRIGGER_OPTIONS.find(
    t => t.type === draft.trigger_type
  )

  const INPUT = 'w-full bg-[#161A1F] border border-white/8 text-white text-xs px-3 py-2.5 outline-none focus:border-[#60A5FA]/40'
  const LABEL = 'text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5'

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight uppercase italic flex items-center gap-2">
            <Zap className="text-electric-blue" size={20} />
            Workflow Automations
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Automate repetitive alerts, tasks, and notifications without any code.
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#60A5FA] text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-blue-400 transition-all rounded-sm"
        >
          <Plus size={14} />
          New Workflow
        </button>
      </div>

      {/* Tab Switcher & Action Toolbar */}
      <div className="flex items-center justify-between border-b border-white/8 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${
              activeTab === 'rules'
                ? 'bg-white/10 text-white border-b-2 border-[#60A5FA]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Active Automations ({workflows.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${
              activeTab === 'audit'
                ? 'bg-white/10 text-white border-b-2 border-[#60A5FA]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Outbox & Audit Logs {auditData?.stats?.total ? `(${auditData.stats.total})` : ''}
          </button>
        </div>

        {activeTab === 'audit' && (
          <button
            onClick={() => handleManualReconcile()}
            disabled={isReconciling}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#161A1F] border border-white/10 text-xs font-bold text-[#60A5FA] hover:bg-white/5 rounded-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={isReconciling ? 'animate-spin' : ''} />
            {isReconciling ? 'Reconciling...' : 'Run Overdue Scan Now'}
          </button>
        )}
      </div>

      {/* TAB 1: RULES VIEW */}
      {activeTab === 'rules' && (
        <>
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-white/[0.02] border border-white/5 rounded-sm" />
              ))}
            </div>
          ) : workflows.length === 0 && !showBuilder ? (
            <div className="p-12 text-center bg-[#0F1114] border border-white/5 rounded-sm max-w-xl mx-auto shadow-2xl">
              <Zap size={32} className="text-gray-700 mx-auto mb-3 animate-pulse" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                No automations configured
              </p>
              <p className="text-[11px] text-gray-600 mb-4">
                Build custom automated flows to flag dashboard warnings or open WhatsApp messages instantly.
              </p>
              <button
                onClick={() => setShowBuilder(true)}
                className="px-4 py-2.5 bg-[#60A5FA] text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-blue-400 transition-all rounded-sm"
              >
                Create First Workflow
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflows.map((wf: any) => {
                const triggerMeta = TRIGGER_OPTIONS.find(
                  t => t.type === wf.trigger_type
                )
                return (
                  <div
                    key={wf.id}
                    className={`p-5 bg-[#0F1114] border rounded-sm transition-all hover:border-white/10 ${
                      wf.is_active ? 'border-white/8 shadow-xl' : 'border-white/4 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl bg-white/5 p-2 rounded-sm">
                          {triggerMeta?.icon || '⚙'}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wider">
                            {wf.name}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1 font-medium">
                            Trigger:{' '}
                            <span className="text-gray-400">{triggerMeta?.label || wf.trigger_type}</span>
                            {' '}·{' '}
                            {wf.actions?.length || 0}{' '}
                            action{wf.actions?.length !== 1 ? 's' : ''}
                          </p>
                          {wf.trigger_count > 0 ? (
                            <p className="text-[9px] text-[#60A5FA]/80 font-mono mt-0.5">
                              Ran {wf.trigger_count} times
                            </p>
                          ) : (
                            <p className="text-[9px] text-gray-700 font-mono mt-0.5">Never triggered</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestRun(wf)}
                          title="Simulate / trigger this workflow now"
                          className="text-[9px] px-2.5 py-1 rounded-sm border border-[#60A5FA]/30 text-[#60A5FA] bg-[#60A5FA]/10 hover:bg-[#60A5FA]/20 font-bold uppercase tracking-widest transition-all flex items-center gap-1"
                        >
                          <Play size={10} className="fill-current" />
                          Test Run
                        </button>
                        <button
                          onClick={() =>
                            toggleWorkflow.mutate({
                              id: wf.id,
                              isActive: !wf.is_active,
                            })
                          }
                          className={`text-[9px] px-2.5 py-1 rounded-sm border font-black uppercase tracking-widest transition-all ${
                            wf.is_active
                              ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
                              : 'border-white/10 text-gray-600 hover:border-white/20'
                          }`}
                        >
                          {wf.is_active ? '● Active' : '○ Paused'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${wf.name}"?`)) {
                              deleteWorkflow.mutate(wf.id)
                            }
                          }}
                          className="text-gray-600 hover:text-red-400 p-1.5 transition-colors border border-white/5 hover:border-red-500/20 rounded-sm"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: AUDIT LOGS & OUTBOX VIEW */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-[#0F1114] border border-white/8 rounded-sm">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Runs</p>
              <p className="text-xl font-black text-white font-mono mt-0.5">{auditData?.stats?.total || 0}</p>
            </div>
            <div className="p-3 bg-[#0F1114] border border-emerald-500/20 rounded-sm">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Completed</p>
              <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">{auditData?.stats?.completed || 0}</p>
            </div>
            <div className="p-3 bg-[#0F1114] border border-amber-500/20 rounded-sm">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Throttled (Anti-Spam)</p>
              <p className="text-xl font-black text-amber-400 font-mono mt-0.5">{auditData?.stats?.throttled || 0}</p>
            </div>
            <div className="p-3 bg-[#0F1114] border border-red-500/20 rounded-sm">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Failed</p>
              <p className="text-xl font-black text-red-400 font-mono mt-0.5">{auditData?.stats?.failed || 0}</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {(['all', 'completed', 'throttled', 'failed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setAuditFilter(f)}
                className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-sm transition-all ${
                  auditFilter === f
                    ? 'bg-[#60A5FA] text-slate-950 font-black'
                    : 'bg-[#161A1F] text-gray-500 hover:text-white border border-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Audit Logs List */}
          {isLoadingAudit ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 bg-white/[0.02] border border-white/5 rounded-sm" />
              ))}
            </div>
          ) : !auditData?.runs || auditData.runs.length === 0 ? (
            <div className="p-12 text-center bg-[#0F1114] border border-white/5 rounded-sm">
              <Clock size={28} className="text-gray-700 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No audit records yet</p>
              <p className="text-[11px] text-gray-600 mt-1">
                Automations will log all trigger evaluations, deduplications, and alert dispatches here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {auditData.runs.map((run: any) => {
                const isCompleted = run.status === 'completed'
                const isThrottled = run.status === 'throttled'
                return (
                  <div
                    key={run.id}
                    className="p-3.5 bg-[#0F1114] border border-white/8 rounded-sm flex items-center justify-between gap-4 transition-all hover:border-white/15"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isCompleted ? 'bg-emerald-400' : isThrottled ? 'bg-amber-400' : 'bg-red-400'
                      }`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white truncate">{run.workflowName}</p>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-white/5 text-gray-400">
                            {run.eventType}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                          {run.recipient ? `Recipient: ${run.recipient} · ` : ''}
                          {run.error ? run.error : `${run.actionsExecuted?.length || 0} action(s) executed`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                        isCompleted
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : isThrottled
                          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          : 'text-red-400 bg-red-500/10 border border-red-500/20'
                      }`}>
                        {run.status}
                      </span>
                      <p className="text-[9px] text-gray-600 font-mono mt-1">
                        {new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Workflow Builder Modal */}
      <AnimatePresence>
        {showBuilder && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0F1114] border border-white/10 shadow-2xl rounded-sm overflow-hidden"
            >
              {/* Builder header */}
              <div className="flex items-center justify-between p-5 border-b border-white/8 bg-[#16181D]/40">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Zap size={14} className="text-electric-blue" />
                    New Automation Rule
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    {['trigger', 'action', 'name'].map((s, i) => (
                      <div key={s} className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                          step === s
                            ? 'bg-electric-blue text-onyx'
                            : ['action', 'name'].indexOf(step) > ['trigger', 'action', 'name'].indexOf(s)
                            ? 'bg-emerald-400 text-onyx'
                            : 'bg-white/5 text-gray-500 border border-white/5'
                        }`}>
                          {i + 1}
                        </div>
                        <span className={`text-[9px] uppercase tracking-wider font-bold ${
                          step === s ? 'text-white' : 'text-gray-600'
                        }`}>
                          {s}
                        </span>
                        {i < 2 && <ChevronRight size={10} className="text-gray-700" />}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBuilder(false)
                    setStep('trigger')
                  }}
                  className="text-gray-500 hover:text-white text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                {/* Step 1: Select trigger */}
                {step === 'trigger' && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      1. Select Trigger Event
                    </p>
                    <div className="space-y-2 overflow-auto max-h-[300px] pr-1">
                      {TRIGGER_OPTIONS.map(t => (
                        <button
                          key={t.type}
                          onClick={() => {
                            setDraft(p => ({
                              ...p,
                              trigger_type: t.type,
                              trigger_config: {},
                            }))
                            setStep('action')
                          }}
                          className="w-full flex items-center gap-3.5 p-3.5 border rounded-sm text-left transition-all border-white/8 hover:border-electric-blue/40 hover:bg-electric-blue/5"
                        >
                          <span className="text-2xl bg-white/5 p-1.5 rounded-sm">
                            {t.icon}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-white uppercase tracking-wider">
                              {t.label}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                              {t.description}
                            </p>
                          </div>
                          <ChevronRight size={14} className="text-gray-650 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Select + configure action */}
                {step === 'action' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-white/[0.02] border border-white/5 flex items-center gap-2">
                      <span className="text-xs">⚡</span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Trigger: {selectedTrigger?.icon} {selectedTrigger?.label}
                      </p>
                    </div>

                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      2. Add Action step
                    </p>

                    {!currentAction ? (
                      <div className="space-y-2 overflow-auto max-h-[300px]">
                        {ACTION_OPTIONS.map(a => (
                          <button
                            key={a.type}
                            onClick={() =>
                              setCurrentAction({
                                type: a.type,
                                config: {
                                  severity: 'info',
                                },
                              })
                            }
                            className="w-full flex items-center gap-3.5 p-3.5 border rounded-sm text-left transition-all border-white/8 hover:border-electric-blue/40 hover:bg-electric-blue/5"
                          >
                            <span className="text-2xl bg-white/5 p-1.5 rounded-sm">
                              {a.icon}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-white uppercase tracking-wider">
                                {a.label}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {a.description}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Action config form */}
                        <div className="space-y-3">
                          {ACTION_OPTIONS.find(
                            a => a.type === currentAction.type
                          )?.fields.map(field => (
                            <div key={field.key}>
                              <label className={LABEL}>{field.label}</label>
                              {field.type === 'select' ? (
                                <select
                                  value={currentAction.config[field.key] || ''}
                                  onChange={e =>
                                    setCurrentAction(p =>
                                      p ? {
                                        ...p,
                                        config: {
                                          ...p.config,
                                          [field.key]: e.target.value,
                                        },
                                      } : null
                                    )
                                  }
                                  className={INPUT}
                                >
                                  {(field as any).options?.map((o: string) => (
                                    <option key={o} value={o}>
                                      {o.toUpperCase()}
                                    </option>
                                  ))}
                                </select>
                              ) : field.type === 'textarea' ? (
                                <textarea
                                  value={currentAction.config[field.key] || ''}
                                  onChange={e =>
                                    setCurrentAction(p =>
                                      p ? {
                                        ...p,
                                        config: {
                                          ...p.config,
                                          [field.key]: e.target.value,
                                        },
                                      } : null
                                    )
                                  }
                                  rows={3}
                                  className={`${INPUT} resize-none`}
                                />
                              ) : (
                                <input
                                  type={field.type}
                                  value={currentAction.config[field.key] ?? (field as any).default ?? ''}
                                  onChange={e =>
                                    setCurrentAction(p =>
                                      p ? {
                                        ...p,
                                        config: {
                                          ...p.config,
                                          [field.key]:
                                            field.type === 'number'
                                              ? parseFloat(e.target.value)
                                              : e.target.value,
                                        },
                                      } : null
                                    )
                                  }
                                  className={INPUT}
                                />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Variable hints */}
                        {VARIABLE_HINTS[draft.trigger_type] && (
                          <div className="p-3 bg-[#0A0C0F] border border-white/5 space-y-2">
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                              Dynamic Token Helper (Click to Copy):
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {VARIABLE_HINTS[draft.trigger_type].map(v => (
                                <span
                                  key={v}
                                  className="text-[9px] font-mono bg-[#60A5FA]/10 text-electric-blue px-2 py-0.5 rounded-sm cursor-pointer hover:bg-[#60A5FA]/20 border border-[#60A5FA]/10"
                                  onClick={() => {
                                    navigator.clipboard.writeText(v)
                                    toast.success(`${v} copied`)
                                  }}
                                >
                                  {v}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 border-t border-white/5 pt-4">
                          <button
                            onClick={() => setCurrentAction(null)}
                            className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 border border-white/10"
                          >
                            ← Back
                          </button>
                          <button
                            onClick={() => {
                              setDraft(p => ({
                                ...p,
                                actions: [
                                  ...p.actions,
                                  {
                                    type: currentAction.type,
                                    ...currentAction.config,
                                  },
                                ],
                              }))
                              setCurrentAction(null)
                              setStep('name')
                            }}
                            className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-electric-blue text-onyx"
                          >
                            Add Action →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Name and save */}
                {step === 'name' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-sm">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">
                        Summary of Automation
                      </p>
                      <p className="text-[11px] text-gray-400">
                        When: <span className="text-white font-medium">{TRIGGER_OPTIONS.find(t => t.type === draft.trigger_type)?.label}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Do: <span className="text-white font-medium">{draft.actions.length} action{draft.actions.length !== 1 ? 's' : ''}</span>
                      </p>
                    </div>

                    <div>
                      <label className={LABEL}>Workflow Name *</label>
                      <input
                        value={draft.name}
                        onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Low Stock Alert"
                        autoFocus
                        className={INPUT}
                      />
                    </div>

                    <div className="flex gap-3 border-t border-white/5 pt-4">
                      <button
                        onClick={() => setStep('action')}
                        className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 border border-white/10"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => saveWorkflow.mutate()}
                        disabled={!draft.name.trim() || saveWorkflow.isPending}
                        className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-electric-blue text-onyx disabled:opacity-50"
                      >
                        {saveWorkflow.isPending ? 'Saving...' : '✓ Activate Workflow'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
