'use client'
import { useLicense } from '@/hooks/useLicense'
import { Crown, X, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export function ExpiryBanner() {
  const {
    isPaid, isExpired, isExpiringSoon,
    tier, effectiveTier, isTrial,
    previousPaidTier, daysUntilExpiry,
  } = useLicense()

  const [dismissed, setDismissed] = useState(false)

  // Track session launch dismiss
  useEffect(() => {
    try {
      const isDismissedThisSession = sessionStorage.getItem('noxis_expiry_banner_dismissed')
      if (isDismissedThisSession === 'true') {
        setDismissed(true)
      }
    } catch {}
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem('noxis_expiry_banner_dismissed', 'true')
    } catch {}
  }

  // Active trial users are handled by TopUrgencyBanner / TrialCountdownBanner
  if (isTrial || effectiveTier === 'free_trial') return null
  if (dismissed) return null

  // CASE 1: TRIAL ENDED (USER ON FREE PLAN WITHOUT PAID LICENSE)
  const isPostTrialFree = effectiveTier === 'free' && !isPaid

  if (isPostTrialFree) {
    return (
      <div className="mx-6 mt-4 p-4 rounded-sm bg-[#0F1114] border border-amber-500/25 flex items-start gap-3 animate-in slide-in-from-top-1 duration-300 shadow-xl">
        {/* Icon */}
        <div className="w-8 h-8 rounded-sm bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Crown size={14} className="text-amber-400" />
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white mb-1">
            Your Elite trial has ended. You are now on Free plan.
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your existing data is safe and POS counter is fully active. Upgrade to Lite or Pro to restore unlimited items, WhatsApp automation, CCTV, and AI predictions.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/settings/license?upgrade=true"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider rounded-sm transition-colors"
          >
            <span>See Plans</span>
            <ArrowRight size={11} />
          </Link>
          <button
            onClick={handleDismiss}
            title="Dismiss banner"
            className="text-gray-500 hover:text-gray-300 p-1 rounded"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  // CASE 2: PREVIOUSLY PAID LICENSE EXPIRED
  if (isExpired && (previousPaidTier || isPaid)) {
    const prevTier = (previousPaidTier || tier) as string
    const tierName = prevTier.charAt(0).toUpperCase() + prevTier.slice(1)

    return (
      <div className="mx-6 mt-4 p-4 rounded-sm bg-[#0F1114] border border-amber-500/20 flex items-start gap-3 animate-in slide-in-from-top-1 duration-300 shadow-xl">
        <div className="w-8 h-8 rounded-sm bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Crown size={14} className="text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white mb-1">
            Your {tierName} plan has expired
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            You are now on the <span className="text-white font-semibold">Free plan</span> — your data is safe and the software is working. Some {tierName} features are paused until you renew.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/settings/license?upgrade=true"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider rounded-sm transition-colors"
          >
            Renew {tierName}
          </Link>
          <button
            onClick={handleDismiss}
            className="text-gray-600 hover:text-gray-400 p-1"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  // CASE 3: EXPIRING SOON STATE (< 30 days on paid license)
  if (isExpiringSoon && !isExpired && isPaid) {
    const tierName = (tier as string).charAt(0).toUpperCase() + (tier as string).slice(1)
    return (
      <div className="mx-6 mt-4 p-3 rounded-sm bg-amber-500/5 border border-amber-500/15 flex items-center justify-between gap-4">
        <p className="text-xs text-amber-400">
          ⏰ Your {tierName} plan expires in <strong>{daysUntilExpiry} days</strong>. Renew to keep all features.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <a
            href={`https://wa.me/923264742678?text=${encodeURIComponent(`I want to renew my Noxis Hub ${tierName} license`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-sm hover:bg-amber-400 transition-colors"
          >
            Renew Now
          </a>
          <button
            onClick={handleDismiss}
            className="text-gray-600 hover:text-gray-400 p-1"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  return null
}
