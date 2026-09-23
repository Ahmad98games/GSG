// src/components/shell/ReleaseNotesModal.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Banknote, 
  Zap, 
  X, 
  ChevronRight,
  ArrowUpRight
} from 'lucide-react'

const CURRENT_VERSION = '13.1.13'
const STORAGE_KEY = 'noxis_last_viewed_version'

interface FixItem {
  icon: React.ReactNode
  tag: string
  tagColor: string
  title: string
  description: string
}

const FIXES: FixItem[] = [
  {
    icon: <Zap className="text-cyan-400" size={18} />,
    tag: 'OTA Pipeline',
    tagColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    title: 'Differential Fallback & Telemetry Scaling',
    description: 'Fixed denominator bug when delta downloads fall back to full binary installer; prevented >100% progress overflow and realigned ETA calculations.'
  },
  {
    icon: <Sparkles className="text-cyan-400" size={18} />,
    tag: 'Enterprise UI',
    tagColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    title: 'Linear-Grade Enterprise ERP Navigation',
    description: 'Completely redesigned sidebar with high-density layout, standardized 16px iconography, disciplined dark slate foundation, and collapsible operational modules.'
  },
  {
    icon: <Sparkles className="text-blue-400" size={18} />,
    tag: 'Settings UI',
    tagColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    title: 'Persistent Settings Navigation Sidebar',
    description: 'The settings navigation sidebar is now permanently anchored on the left across all subpages. Never lose your context or click back buttons.'
  },
  {
    icon: <Zap className="text-emerald-400" size={18} />,
    tag: 'Resilience',
    tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    title: 'Power-Cut Safe Resumable Updates',
    description: 'Update downloads now use HTTP byte-range offsets. If power or Wi-Fi cuts off, reopening the app seamlessly continues directly from where it left off.'
  },
  {
    icon: <Sparkles className="text-blue-400" size={18} />,
    tag: 'Updates Telemetry',
    tagColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    title: 'Advanced Software Updates Dashboard',
    description: 'Replaced the updates page with an industrial telemetry HUD showing live download speed, ETA, segmented progress, and release channel management.'
  },
  {
    icon: <ShieldCheck className="text-purple-400" size={18} />,
    tag: 'Backup & Export',
    tagColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    title: 'Excel Export & Data Backup Fixed',
    description: 'Export All Data as Excel now exports all inventory, parties, karigars, invoices, and ledgers with full column headers and summary metrics.'
  },
  {
    icon: <ShieldCheck className="text-emerald-400" size={18} />,
    tag: 'OS Support',
    tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    title: 'Windows 7 to Windows 11 Universal Support',
    description: 'Removed the restrictive Windows OS build check completely. Noxis Hub installs seamlessly across Windows 7, 8, 10, and Windows 11.'
  },
  {
    icon: <Zap className="text-amber-400" size={18} />,
    tag: 'Turbo Updates',
    tagColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    title: 'Instant Silent Update (< 1 min)',
    description: 'Pruned over 5,700 redundant files and enabled silent background application upgrades to complete installs in seconds.'
  },
  {
    icon: <ChevronRight className="text-blue-400" size={18} />,
    tag: 'Settings UI',
    tagColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    title: 'Universal Back Button in Settings',
    description: 'Added clear, intuitive Back navigation to every Settings subpage and the main Settings view so you can easily return with one click.'
  },
  {
    icon: <Users className="text-emerald-400" size={18} />,
    tag: 'Team & Payroll',
    tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    title: 'Member Invitations & Payroll Restored',
    description: 'Resolved access permission errors when inviting team members and running payroll wage periods across desktop workstations.'
  },
  {
    icon: <ShieldCheck className="text-purple-400" size={18} />,
    tag: 'Parties & Rules',
    tagColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    title: 'Account Unblocking & Automation Rule Purge',
    description: 'Fixed party unblocking and rule deletion issues with instant local and remote database synchronization.'
  }
]

export default function ReleaseNotesModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Check if user hasn't seen this version yet
    try {
      const lastSeen = localStorage.getItem(STORAGE_KEY)
      if (lastSeen !== CURRENT_VERSION) {
        // Small delay to let shell render smoothly first
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 1200)
        return () => clearTimeout(timer)
      }
    } catch {}

    // 2. Listen to electron event if available
    const handleNewVersion = () => {
      setIsOpen(true)
    }

    if ((window as any).electronAPI?.on) {
      ;(window as any).electronAPI.on('app:new-version', handleNewVersion)
    }

    window.addEventListener('noxis:show-release-notes', handleNewVersion)
    return () => {
      window.removeEventListener('noxis:show-release-notes', handleNewVersion)
    }
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION)
    } catch {}
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-[#0E1115] border border-white/10 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header subtle glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 opacity-80" />

          {/* Modal Header */}
          <div className="p-6 border-b border-white/5 bg-[#14181E]/60 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle2 size={11} />
                  Update Applied • v{CURRENT_VERSION}
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  Build 2026.09
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight uppercase italic flex items-center gap-2">
                What Was Fixed in Noxis Hub
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Your system has been updated. Here is a summary of all resolved issues and enhancements:
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Fixes List */}
          <div className="p-6 overflow-y-auto space-y-3.5 flex-1 divide-y divide-white/[0.04]">
            {FIXES.map((fix, idx) => (
              <div 
                key={idx} 
                className={`pt-3.5 first:pt-0 flex items-start gap-4 group`}
              >
                <div className="p-2.5 rounded-sm bg-white/[0.03] border border-white/5 shrink-0 mt-0.5 group-hover:border-white/10 transition-colors">
                  {fix.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${fix.tagColor}`}>
                      {fix.tag}
                    </span>
                    <h3 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                      {fix.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {fix.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Footer */}
          <div className="p-5 border-t border-white/5 bg-[#14181E]/80 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-mono">
              Noxis Industrial ERP Mesh
            </span>
            <button
              onClick={handleDismiss}
              className="flex items-center gap-2 px-5 py-2 bg-[#60A5FA] text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-blue-400 transition-all rounded-sm shadow-lg shadow-blue-500/10"
            >
              Continue to App
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
