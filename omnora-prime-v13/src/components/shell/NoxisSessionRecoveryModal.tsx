'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, RotateCcw, ShoppingCart, BookOpen,
  Boxes, FileText, Users, ArrowRight, Trash2, CheckCircle2,
  Clock, Sparkles, X
} from 'lucide-react'
import { getAllActiveDrafts, SavedDraftInfo } from '@/hooks/useFormDraft'
import { formatDistanceToNow } from 'date-fns'

interface NoxisSessionRecoveryModalProps {
  powerCutInfo: { lastRoute: string; message: string } | null
  onClose: () => void
}

export function NoxisSessionRecoveryModal({
  powerCutInfo,
  onClose
}: NoxisSessionRecoveryModalProps) {
  const router = useRouter()
  const [drafts, setDrafts] = useState<SavedDraftInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    getAllActiveDrafts().then((active) => {
      if (isMounted) {
        setDrafts(active)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const handleResumeDraft = (draft: SavedDraftInfo) => {
    onClose()
    router.push(draft.route)
  }

  const handleDiscardDraft = async (draftKey: string) => {
    try {
      localStorage.removeItem('noxis_draft_' + draftKey)
      if (typeof window !== 'undefined' && (window as any).electronAPI?.store?.clearFormDraft) {
        await (window as any).electronAPI.store.clearFormDraft(draftKey)
      }
      setDrafts(prev => prev.filter(d => d.key !== draftKey))
    } catch {}
  }

  const handleResumeLastRoute = () => {
    onClose()
    if (powerCutInfo?.lastRoute) {
      router.push(powerCutInfo.lastRoute)
    }
  }

  const getIcon = (key: string) => {
    switch (key) {
      case 'pos_cart':
        return ShoppingCart
      case 'khata-entry':
        return BookOpen
      case 'inventory-new':
        return Boxes
      case 'invoice-new':
      case 'recurring-invoice-new':
      case 'purchase-new':
        return FileText
      case 'parties-new':
      case 'karigar-new':
        return Users
      default:
        return FileText
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        className="relative w-full max-w-2xl bg-[#0B0F19] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden shadow-cyan-950/40"
      >
        {/* Top Glow bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-cyan-400 to-indigo-500" />

        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  Noxis Resilience Engine
                </span>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  Crash / Power-Cut Resumed
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Session Auto-Recovery Activated
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Noxis preserved your uncommitted transactions, register state, and forms.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Last Route Callout */}
          {powerCutInfo?.lastRoute && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-indigo-950/30 border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    Previous Working Screen
                  </div>
                  <div className="text-sm font-semibold text-cyan-300 font-mono">
                    {powerCutInfo.lastRoute}
                  </div>
                </div>
              </div>
              <button
                onClick={handleResumeLastRoute}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <span>Resume Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Pending Drafts Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-300">
                Recoverable Work & Pending Drafts ({drafts.length})
              </span>
              <span className="text-[11px] text-zinc-500">
                Encrypted & Persisted Locally
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Scanning resilience cache...
              </div>
            ) : drafts.length === 0 ? (
              <div className="py-6 px-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400/80 mx-auto mb-2" />
                <p className="text-sm text-zinc-300 font-medium">All Transactions Were Committed</p>
                <p className="text-xs text-zinc-500 mt-1">
                  No abandoned carts or pending form drafts detected. Your database ledger is 100% synchronized.
                </p>
              </div>
            ) : (
              drafts.map((draft) => {
                const Icon = getIcon(draft.key)
                const timeAgo = formatDistanceToNow(new Date(draft.savedAt), { addSuffix: true })

                return (
                  <div
                    key={draft.key}
                    className="p-3.5 rounded-xl bg-[#0F1422] border border-white/10 hover:border-cyan-500/40 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">
                            {draft.label}
                          </span>
                          {draft.itemCount !== undefined && draft.itemCount > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {draft.itemCount} items
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 truncate mt-0.5">
                          {draft.preview || 'Unsaved draft in progress'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Last captured {timeAgo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDiscardDraft(draft.key)}
                        title="Discard Draft"
                        className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResumeDraft(draft)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300 text-xs font-medium transition-all cursor-pointer"
                      >
                        <span>Restore</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-black/40 border-t border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Noxis Core safely recovered local state via SQLite WAL.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-medium transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </div>
  )
}
