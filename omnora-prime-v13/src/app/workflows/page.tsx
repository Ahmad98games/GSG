'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { 
  Zap, Plus, Trash2, ChevronRight, 
  CheckCircle, Play, Pause, AlertCircle, Info 
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

export default function WorkflowsPage() {
  const { tier } = useTierStore()
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showBuilder, setShowBuilder] = useState(false)

  if (tier === 'lite') {
    return (
      <div className="min-h-screen bg-onyx flex items-center justify-center p-8">
        <FeatureLock 
          title="Automated Workflows Builder" 
          description="Design custom, no-code workflow automations (e.g., auto-reminders for low stock or overdue invoices). Upgrade to Pro or Elite to unlock."
          requiredTier="pro"
        />
      </div>
    );
  }
  const [step, setStep] = useState<'trigger' | 'action' | 'name'>('trigger')

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

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('workflows')
        .select(`
          *,
          workflow_runs(count)
        `)
        .eq('business_id', profile!.id)
        .order('created_at', { ascending: false })
      return data || []
    },
    enabled: !!profile?.id,
  })

  const toggleWorkflow = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('workflows')
        .update({ is_active: isActive })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workflows', profile?.id]
      })
    },
  })

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workflows', profile?.id]
      })
      toast.success('Workflow deleted')
    },
  })

  const saveWorkflow = useMutation({
    mutationFn: async () => {
      if (!draft.trigger_type || !draft.actions.length || !draft.name) return

      const { error } = await supabase
        .from('workflows')
        .insert({
          business_id: profile!.id,
          name: draft.name,
          trigger_type: draft.trigger_type,
          trigger_config: draft.trigger_config,
          actions: draft.actions,
          is_active: true,
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workflows', profile?.id]
      })
      setShowBuilder(false)
      setStep('trigger')
      setDraft({
        name: '',
        trigger_type: '',
        trigger_config: {},
        actions: [],
      })
      toast.success('Workflow created and active')
    },
    onError: () => {
      toast.error('Could not save workflow')
    },
  })

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
          className="flex items-center gap-2 px-4 py-2.5 bg-electric-blue text-onyx text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
        >
          <Plus size={14} />
          New Workflow
        </button>
      </div>

      {/* Existing workflows */}
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
            className="px-4 py-2.5 bg-electric-blue text-onyx text-xs font-black uppercase tracking-widest hover:brightness-110"
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
