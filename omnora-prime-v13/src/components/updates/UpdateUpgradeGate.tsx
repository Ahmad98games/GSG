'use client'

import React, { useState } from 'react'
import {
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  X,
  Sparkles,
  Lock,
  Layers,
  Cpu,
  Zap,
} from 'lucide-react'

export interface UpdateUpgradeGateProps {
  isOpen: boolean
  onClose: () => void
  targetVersion: string
  baselineVersion: string
  currentVersion: string
  currentTier: 'lite' | 'pro' | 'elite' | string
  maxAllowedVersion: string
  requiredTier?: string
  hwid?: string
  message?: string
}

export function UpdateUpgradeGate({
  isOpen,
  onClose,
  targetVersion,
  baselineVersion,
  currentVersion,
  currentTier,
  maxAllowedVersion,
  requiredTier = 'elite',
  hwid = '',
  message,
}: UpdateUpgradeGateProps) {
  const [copiedHwid, setCopiedHwid] = useState(false)

  if (!isOpen) return null

  const cleanTarget = targetVersion.startsWith('v') ? targetVersion : `v${targetVersion}`
  const cleanBaseline = baselineVersion.startsWith('v') ? baselineVersion : `v${baselineVersion}`
  const cleanMax = maxAllowedVersion.startsWith('v') ? maxAllowedVersion : `v${maxAllowedVersion}`
  const tierUpper = currentTier.toUpperCase()
  const reqTierUpper = requiredTier.toUpperCase()

  const prefilledWhatsappText = encodeURIComponent(
    `Assalam-o-Alaikum Bilal,\n\nI need a license tier upgrade for Noxis Hub to unlock ${cleanTarget}.\n\n• Machine HWID: ${hwid || 'Pending detection'}\n• Current Tier: ${tierUpper}\n• Baseline Version: ${cleanBaseline}\n• Current Version: ${currentVersion}\n• Eligible Ceiling: ${cleanMax}\n• Requested Tier: ${reqTierUpper}\n\nPlease issue the updated license key.`
  )

  const whatsappUrl = `https://wa.me/923264742678?text=${prefilledWhatsappText}`

  const handleCopyHwid = () => {
    if (!hwid) return
    navigator.clipboard.writeText(hwid)
    setCopiedHwid(true)
    setTimeout(() => setCopiedHwid(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#090D16] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-500/10 via-red-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">
                  Version-Locked Tier Upgrade Gate
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Tier Ceiling Reached
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target release {cleanTarget} requires license elevation beyond your baseline window
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="relative z-10 p-6 space-y-6">
          {/* Policy Window Comparison Matrix */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-500">
                Installation Baseline
              </span>
              <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-slate-200">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                {cleanBaseline}
              </div>
              <p className="text-[11px] text-slate-400">First-run snapshot</p>
            </div>

            <div className="space-y-1 border-x border-slate-800 px-3">
              <span className="text-[10px] font-mono font-semibold uppercase text-cyan-400">
                Active Tier Ceiling
              </span>
              <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-cyan-300">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                {cleanMax}
              </div>
              <p className="text-[11px] text-cyan-400/80">
                {tierUpper} (+{currentTier === 'elite' ? '2' : '1'} Major window)
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-semibold uppercase text-amber-400">
                Target Release
              </span>
              <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-amber-300">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                {cleanTarget}
              </div>
              <p className="text-[11px] text-amber-400/80">Requires {reqTierUpper}</p>
            </div>
          </div>

          {/* Explanation Alert Box */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-300 leading-relaxed">
            <p className="font-medium text-amber-200 mb-1">
              {message ||
                `Your current ${tierUpper} license supports major version upgrades up to ${cleanMax}. Upgrade to ${reqTierUpper} to unlock ${cleanTarget} and future generations.`}
            </p>
            <p className="text-slate-400">
              Noxis Hub guarantees uninterrupted backward compatibility and stability by gating major core runtime leaps. Upgrading your license tier issues a new cryptographic RSA-2048 key bound to your hardware fingerprint.
            </p>
          </div>

          {/* Hardware ID Section */}
          {hwid && (
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-mono font-semibold uppercase text-slate-400">
                    Hardware Fingerprint (HWID)
                  </div>
                  <div className="text-xs font-mono font-medium text-slate-300 truncate">
                    {hwid}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyHwid}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 shrink-0"
              >
                {copiedHwid ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy HWID</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="relative z-10 flex items-center justify-between p-6 border-t border-slate-800/80 bg-slate-900/40">
          <div className="text-[11px] text-slate-500">
            Official Omnora Support Bridge · Contact: Bilal
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition rounded-xl"
            >
              Dismiss
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition transform active:scale-95"
            >
              <span>Instant Upgrade via WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
