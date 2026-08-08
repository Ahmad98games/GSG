'use client'
import { useLicense } from '@/hooks/useLicense'
import { Crown, ArrowRight, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export function ExpiryBanner() {
  const {
    isPaid, isExpired, isExpiringSoon,
    tier, effectiveTier,
    previousPaidTier, daysUntilExpiry,
  } = useLicense()

  const [dismissed, setDismissed] = useState(false)

  // Nothing to show
  if (!isPaid && !previousPaidTier) return null
  if (!isExpired && !isExpiringSoon) return null
  if (dismissed) return null

  // EXPIRED STATE
  if (isExpired) {
    const prevTier = previousPaidTier || tier
    const tierName =
      prevTier.charAt(0).toUpperCase() +
      prevTier.slice(1)

    return (
      <div className="
        mx-6 mt-4 p-4 rounded-sm
        bg-[#0F1114] border border-amber-500/20
        flex items-start gap-3
        animate-in slide-in-from-top-1
        duration-300
      ">
        {/* Icon */}
        <div className="w-8 h-8 rounded-sm
          bg-amber-500/10 border
          border-amber-500/20
          flex items-center justify-center
          flex-shrink-0">
          <Crown size={14}
            className="text-amber-400" />
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold
            text-white mb-1">
            Your {tierName} plan has expired
          </p>
          <p className="text-xs text-gray-500
            leading-relaxed">
            You are now on the{' '}
            <span className="text-white
              font-semibold">
              Free plan
            </span>
            {' '}— your data is safe and
            the software is fully working.
            Some {tierName} features are
            paused until you renew.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center
          gap-2 flex-shrink-0">
          <Link
            href="/settings/license?upgrade=true"
            className="flex items-center gap-1.5
              px-3 py-1.5 bg-amber-500
              text-black text-xs font-bold
              rounded-sm hover:bg-amber-400
              transition-colors"
          >
            Renew {tierName}
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-600
              hover:text-gray-400 p-1"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  // EXPIRING SOON STATE (< 30 days)
  if (isExpiringSoon && !isExpired) {
    const tierName =
      tier.charAt(0).toUpperCase() +
      tier.slice(1)
    return (
      <div className="
        mx-6 mt-4 p-3 rounded-sm
        bg-amber-500/5 border
        border-amber-500/15
        flex items-center justify-between gap-4
      ">
        <p className="text-xs text-amber-400">
          ⏰ Your {tierName} plan expires in{' '}
          <strong>{daysUntilExpiry} days</strong>.
          Renew to keep all features.
        </p>
        <div className="flex gap-2
          flex-shrink-0">
          <a
            href={`https://wa.me/923264742678?text=I want to renew my Noxis Hub ${tierName} license`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5
              bg-amber-500 text-black
              text-xs font-bold rounded-sm
              hover:bg-amber-400
              transition-colors"
          >
            Renew Now
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-600
              hover:text-gray-400"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  return null
}
