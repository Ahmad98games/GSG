'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useIndustryConfig } from '@/hooks/useIndustryConfig'
import Fuse from 'fuse.js'

interface Command {
  id: string
  label: string
  category: string
  keywords: string[]
  icon: string
  action: () => void
  shortcut?: string[]
}

export function CommandPalette() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const { t, nav } = useIndustryConfig()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentParties, setRecentParties] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent parties for quick access
  useEffect(() => {
    if (!profile?.id) return
    supabase.from('parties')
      .select('id, name, party_type')
      .eq('business_id', profile.id)
      .order('updated_at', { ascending: false })
      .limit(5)
      .then((res: any) => {
        setRecentParties(res.data || [])
      })
  }, [profile?.id])

  const COMMANDS = useMemo((): Command[] => [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      category: 'Navigation',
      keywords: ['home', 'dashboard', 'main'],
      icon: '⊞',
      action: () => router.push('/dashboard'),
    },
    {
      id: 'nav-invoices',
      label: `Go to ${t.invoices}`,
      category: 'Navigation',
      keywords: ['invoices', 'bills', 'sales'],
      icon: '📄',
      action: () => router.push('/invoices'),
    },
    {
      id: 'nav-karigars',
      label: `Go to ${t.workers}`,
      category: 'Navigation',
      keywords: ['karigars', 'workers', 'employees', 'staff'],
      icon: '👷',
      action: () => router.push('/karigars'),
    },
    {
      id: 'nav-inventory',
      label: `Go to ${nav.inventory}`,
      category: 'Navigation',
      keywords: ['stock', 'inventory', 'items', 'products'],
      icon: '📦',
      action: () => router.push('/inventory'),
    },
    {
      id: 'nav-parties',
      label: `Go to ${t.customer}s`,
      category: 'Navigation',
      keywords: ['parties', 'customers', 'suppliers', 'clients'],
      icon: '🤝',
      action: () => router.push('/parties'),
    },
    {
      id: 'nav-reports',
      label: 'Go to Reports',
      category: 'Navigation',
      keywords: ['reports', 'analytics', 'pnl', 'profit'],
      icon: '📊',
      action: () => router.push('/reports'),
    },
    {
      id: 'nav-intelligence',
      label: 'Business Intelligence',
      category: 'Navigation',
      keywords: ['intelligence', 'insights', 'ai', 'analysis'],
      icon: '💡',
      action: () => router.push('/intelligence'),
    },
    {
      id: 'nav-audit',
      label: 'Audit Log',
      category: 'Navigation',
      keywords: ['audit', 'log', 'history', 'activity'],
      icon: '🔍',
      action: () => router.push('/audit'),
    },

    // Quick actions
    {
      id: 'action-new-invoice',
      label: `New ${t.invoice}`,
      category: 'Quick Actions',
      keywords: ['new invoice', 'create invoice', 'add bill', 'sell'],
      icon: '➕',
      action: () => router.push('/invoices/new'),
      shortcut: ['Ctrl', 'N'],
    },
    {
      id: 'action-new-karigar',
      label: `Register ${t.worker}`,
      category: 'Quick Actions',
      keywords: ['new karigar', 'add worker', 'register employee'],
      icon: '👤',
      action: () => router.push('/karigars/new'),
    },
    {
      id: 'action-new-party',
      label: `Add ${t.customer}`,
      category: 'Quick Actions',
      keywords: ['new party', 'add customer', 'add supplier'],
      icon: '🏢',
      action: () => router.push('/parties/new'),
    },
    {
      id: 'action-mark-attendance',
      label: 'Mark Attendance',
      category: 'Quick Actions',
      keywords: ['attendance', 'haazri', 'present', 'absent'],
      icon: '✓',
      action: () => router.push('/karigars?action=attendance'),
    },
    {
      id: 'action-send-reminders',
      label: 'Send Payment Reminders',
      category: 'Quick Actions',
      keywords: ['reminder', 'payment', 'overdue', 'whatsapp'],
      icon: '💬',
      action: () => router.push('/parties/reminders'),
    },
    {
      id: 'action-run-payroll',
      label: 'Run Payroll',
      category: 'Quick Actions',
      keywords: ['payroll', 'salary', 'wages', 'tankhwa'],
      icon: '💰',
      action: () => router.push('/payroll/new'),
    },
    {
      id: 'action-backup',
      label: 'Download Backup',
      category: 'Quick Actions',
      keywords: ['backup', 'export', 'download', 'data'],
      icon: '💾',
      action: () => router.push('/settings/backup'),
    },

    // Recent parties
    ...recentParties.map(p => ({
      id: `party-${p.id}`,
      label: p.name,
      category: 'Recent Parties',
      keywords: [p.name.toLowerCase(), p.party_type],
      icon: p.party_type === 'customer' ? '🛒' : '🏭',
      action: () => router.push(`/parties/${p.id}`),
    })),
  ], [t, nav, recentParties, router])

  const fuse = useMemo(() => new Fuse(COMMANDS, {
    keys: [
      { name: 'label', weight: 3 },
      { name: 'keywords', weight: 2 },
      { name: 'category', weight: 1 },
    ],
    threshold: 0.4,
    includeScore: true,
  }), [COMMANDS])

  const results = useMemo(() => {
    if (!query.trim()) {
      return COMMANDS.slice(0, 10)
    }
    return fuse.search(query)
      .slice(0, 10)
      .map(r => r.item)
  }, [query, fuse, COMMANDS])

  const execute = useCallback((cmd: Command) => {
    cmd.action()
    setOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
        return
      }
      if (!open) return
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        const cmd = results[selectedIndex]
        if (cmd) execute(cmd)
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, results, selectedIndex, execute])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    setSelectedIndex(0)
  }, [open, query])

  if (!open || typeof document === 'undefined') return null

  const grouped = results.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = []
    }
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, Command[]>)

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-[#0A0C0F] border border-white/12 rounded-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
          <span className="text-gray-600">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-700"
          />
          <kbd className="text-[10px] font-mono text-gray-700 bg-white/5 px-1.5 py-0.5 rounded border border-white/8">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-600 text-center">
              No commands match "{query}"
            </p>
          ) : (
            Object.entries(grouped).map(([category, cmds]) => (
              <div key={category}>
                <p className="px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-700">
                  {category}
                </p>
                {cmds.map((cmd) => {
                  const globalIndex = results.indexOf(cmd)
                  const isSelected = globalIndex === selectedIndex
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => execute(cmd)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-[#60A5FA]/10' : 'hover:bg-white/4'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base w-6 text-center">
                          {cmd.icon}
                        </span>
                        <span className={`text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                          {cmd.label}
                        </span>
                      </div>
                      {cmd.shortcut && (
                        <div className="flex gap-1">
                          {cmd.shortcut.map(k => (
                            <kbd
                              key={k}
                              className="text-[9px] font-mono text-gray-650 bg-white/5 px-1.5 py-0.5 rounded border border-white/8"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/6 flex items-center gap-4 text-[9px] text-gray-700">
          <span>↑↓ Navigate</span>
          <span>↵ Execute</span>
          <span>Esc Close</span>
          <span className="ml-auto">
            Ctrl+K to open
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}
