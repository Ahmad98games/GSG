'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { 
  Keyboard, 
  Search, 
  RotateCcw, 
  Monitor, 
  Zap, 
  ShoppingCart, 
  Layers, 
  X, 
  CheckCircle2, 
  HelpCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface ShortcutCategory {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

interface ShortcutItem {
  category: 'display' | 'nav' | 'pos' | 'data'
  keys: string[]
  desc: string
  action?: string
  badge?: string
}

const CATEGORIES: ShortcutCategory[] = [
  { id: 'all', label: 'All Shortcuts', icon: Keyboard },
  { id: 'display', label: 'Display & View (Ctrl+0)', icon: Monitor },
  { id: 'nav', label: 'Navigation', icon: Zap },
  { id: 'pos', label: 'POS & Billing', icon: ShoppingCart },
  { id: 'data', label: 'Data & Records', icon: Layers },
]

const SHORTCUTS: ShortcutItem[] = [
  // ── DISPLAY & VIEW ──
  { category: 'display', keys: ['Ctrl', '0'], desc: 'Reset Display Zoom to 100% (Fixes tiny/shrunken screen)', badge: 'CRITICAL FIX', action: 'reset-zoom' },
  { category: 'display', keys: ['Ctrl', '+'], desc: 'Zoom In UI (+10% scaling)', action: 'zoom-in' },
  { category: 'display', keys: ['Ctrl', '-'], desc: 'Zoom Out UI (-10% scaling)', action: 'zoom-out' },
  { category: 'display', keys: ['F11'], desc: 'Toggle Fullscreen Mode' },
  { category: 'display', keys: ['Ctrl', 'B'], desc: 'Toggle Left Sidebar (Expand / Collapse)' },
  { category: 'display', keys: ['F1'], desc: 'Open Keyboard Shortcuts & User Guide' },

  // ── NAVIGATION & MODULES ──
  { category: 'nav', keys: ['Ctrl', 'K'], desc: 'Global Command Palette & Quick Search', badge: 'POPULAR' },
  { category: 'nav', keys: ['Ctrl', 'P'], desc: 'Open POS Counter / Fast Billing' },
  { category: 'nav', keys: ['Ctrl', 'I'], desc: 'Open Inventory & SKU Registry' },
  { category: 'nav', keys: ['Ctrl', 'Shift', 'P'], desc: 'Open Wholesale Khata & Party Ledgers' },
  { category: 'nav', keys: ['Ctrl', 'Shift', 'K'], desc: 'Open Karigar Piece-Rate Payroll & Attendance' },
  { category: 'nav', keys: ['Ctrl', 'Shift', 'R'], desc: 'Open Reports & Roznamcha Cash Book' },
  { category: 'nav', keys: ['Ctrl', 'Shift', 'C'], desc: 'Open RTSP CCTV Camera Feeds' },
  { category: 'nav', keys: ['Ctrl', 'Shift', 'E'], desc: 'Open Multi-Currency Exchange Rates' },
  { category: 'nav', keys: ['Ctrl', 'Shift', 'M'], desc: 'Open Universal Excel / CSV Data Importer' },
  { category: 'nav', keys: ['Ctrl', 'D'], desc: 'Return to Executive Dashboard' },
  { category: 'nav', keys: ['Alt', '1-5'], desc: 'Quick jump between main operations' },

  // ── POS & BILLING COUNTER ──
  { category: 'pos', keys: ['F2'], desc: 'Start New Invoice / Clear Counter Cart', badge: 'POS' },
  { category: 'pos', keys: ['F4'], desc: 'Search & Select Customer / Khata Party' },
  { category: 'pos', keys: ['F7'], desc: 'Tender Cash Payment & Finalize' },
  { category: 'pos', keys: ['F8'], desc: 'Book to Credit / Wholesale Khata Ledger' },
  { category: 'pos', keys: ['F9'], desc: 'Print 58mm / 80mm Thermal Receipt' },
  { category: 'pos', keys: ['F10'], desc: 'Commit / Save Invoice (Instant Dispatch)' },
  { category: 'pos', keys: ['Esc'], desc: 'Cancel current modal or clear search focus' },

  // ── DATA & WORKFLOWS ──
  { category: 'data', keys: ['Ctrl', 'N'], desc: 'Create New Item / Record' },
  { category: 'data', keys: ['Ctrl', 'Enter'], desc: 'Save & Submit Active Form' },
  { category: 'data', keys: ['Ctrl', 'F'], desc: 'Filter / Find rows inside active data table' },
  { category: 'data', keys: ['?'], desc: 'Toggle this Shortcuts & Help Guide' },
]

export function ShortcutHelp() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [zoomNotification, setZoomNotification] = useState<string | null>(null)
  const toast = useToast()

  const handleResetZoom = () => {
    if (typeof window !== 'undefined') {
      if ((window as any).electronAPI?.resetZoom) {
        (window as any).electronAPI.resetZoom()
      }
      document.documentElement.style.zoom = '100%'
      document.body.style.zoom = '100%'
      setZoomNotification('Display scale restored to 100% normal view!')
      setTimeout(() => setZoomNotification(null), 3500)
    }
  }

  const handleZoomIn = () => {
    if (typeof window !== 'undefined') {
      if ((window as any).electronAPI?.zoomIn) {
        (window as any).electronAPI.zoomIn()
      }
    }
  }

  const handleZoomOut = () => {
    if (typeof window !== 'undefined') {
      if ((window as any).electronAPI?.zoomOut) {
        (window as any).electronAPI.zoomOut()
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? key outside of inputs opens modal
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) {
          setOpen(prev => !prev)
        }
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    const handleCustomOpen = () => setOpen(true)
    const handleZoomResetEvent = () => {
      setZoomNotification('Display scale reset to 100% via hotkey (Ctrl + 0)!')
      setTimeout(() => setZoomNotification(null), 3000)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-shortcut-help', handleCustomOpen)
    window.addEventListener('noxis:zoom-reset', handleZoomResetEvent)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-shortcut-help', handleCustomOpen)
      window.removeEventListener('noxis:zoom-reset', handleZoomResetEvent)
    }
  }, [])

  const filteredShortcuts = useMemo(() => {
    return SHORTCUTS.filter(s => {
      const matchCat = selectedCategory === 'all' || s.category === selectedCategory
      const q = search.trim().toLowerCase()
      const matchSearch = !q || 
        s.desc.toLowerCase().includes(q) || 
        s.keys.some(k => k.toLowerCase().includes(q))
      return matchCat && matchSearch
    })
  }, [selectedCategory, search])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-[#0B0E14] border border-cyan-500/30 rounded-lg shadow-[0_0_50px_rgba(8,235,246,0.15)] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#080B10]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Keyboard size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                Noxis Hub Shortcut Keys & Troubleshooter
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-normal lowercase">v14.0.0</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Master industrial navigation & resolve display zoom issues instantly
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── CRITICAL TROUBLESHOOTING BANNER (CTRL + 0) ── */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-transparent border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded bg-amber-500/20 text-amber-400 mt-0.5">
              <AlertTriangle size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Screen looks tiny or shrunken? (Accidental Zoom Glitch)</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">FIX</span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                If the window zoomed out accidentally, press <kbd className="px-1.5 py-0.5 bg-black border border-white/20 rounded font-mono text-cyan-400 font-bold">Ctrl + 0</kbd> on your keyboard to instantly restore 100% normal view.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={handleResetZoom}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded flex items-center gap-1.5 shadow-[0_0_15px_rgba(8,235,246,0.3)] transition-all"
            >
              <RotateCcw size={13} />
              <span>Reset to 100%</span>
            </button>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-zinc-300 font-mono"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-zinc-300 font-mono"
            >
              -
            </button>
          </div>
        </div>

        {/* ── NOTIFICATION TOAST ── */}
        {zoomNotification && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-400 animate-in fade-in duration-150">
            <CheckCircle2 size={14} />
            <span>{zoomNotification}</span>
          </div>
        )}

        {/* ── SEARCH & CATEGORY FILTER ── */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#080B10]/50">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search shortcut (e.g. zoom, POS, khata, karigar, print)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0F131D] border border-white/10 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SHORTCUT LIST ── */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1 max-h-[50vh]">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              No keyboard shortcuts match "{search}"
            </div>
          ) : (
            filteredShortcuts.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">
                    {s.desc}
                  </span>
                  {s.badge && (
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                      {s.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  {s.keys.map((k, i) => (
                    <React.Fragment key={i}>
                      <kbd className="text-[11px] font-mono font-bold bg-[#141923] border border-white/20 px-2 py-0.5 rounded text-cyan-300 shadow-sm">
                        {k}
                      </kbd>
                      {i < s.keys.length - 1 && (
                        <span className="text-[10px] text-zinc-600 font-mono">+</span>
                      )}
                    </React.Fragment>
                  ))}
                  {s.action === 'reset-zoom' && (
                    <button
                      onClick={handleResetZoom}
                      title="Click to reset zoom now"
                      className="ml-2 p-1 text-cyan-400 hover:text-white rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-[10px]"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── FOOTER HELP LINK ── */}
        <div className="p-3.5 border-t border-white/10 bg-[#080B10] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2 text-[11px]">
            <HelpCircle size={14} className="text-cyan-400" />
            <span>Need more help? Check the complete user manual</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/docs"
              className="text-cyan-400 hover:text-cyan-300 font-bold text-xs inline-flex items-center gap-1"
            >
              <span>Read Full Documentation</span>
              <ArrowRight size={12} />
            </a>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-500 text-[11px] font-mono">Press ? or F1 to open</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
