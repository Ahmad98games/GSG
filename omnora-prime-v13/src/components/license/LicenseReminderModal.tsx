'use client'
import { useLicense } from '@/hooks/useLicense'
import {
  Crown, ArrowRight, Check,
} from 'lucide-react'

const TIER_FEATURES: Record<string, string[]> = {
  lite: [
    'Cloud backup protects your data',
    'Mobile app to manage from your phone',
    'WhatsApp invoice sending',
    'All financial reports with export',
    'Unlimited inventory and customers',
    'Full payroll and payslips',
  ],
  pro: [
    'Everything in Lite, plus:',
    'Multiple branch locations',
    'Foresight AI predictions',
    'Workflow automation',
    '15 devices (PC + Mobile)',
    '4 CCTV cameras',
  ],
  elite: [
    'Everything in Pro, plus:',
    'Unlimited branches',
    '50 devices',
    'API access and webhooks',
    'Priority support',
  ],
}

export function LicenseReminderModal() {
  const {
    isExpired, showReminderNow,
    previousPaidTier, tier,
    dismissReminder, startUpgrade,
  } = useLicense()

  if (!isExpired) return null
  if (!showReminderNow) return null

  const expiredTier =
    (previousPaidTier || tier) as string
  const tierName =
    expiredTier.charAt(0).toUpperCase() +
    expiredTier.slice(1)
  const features =
    TIER_FEATURES[expiredTier] || []

  return (
    // Semi-transparent overlay
    // Does NOT block the page completely
    // User can click outside to dismiss
    <div
      className="fixed inset-0 z-50
        bg-black/60 flex items-end
        sm:items-center justify-center p-4"
      onClick={(e) => {
        // Dismiss if clicking outside the modal
        if (e.target === e.currentTarget) {
          dismissReminder()
        }
      }}
    >
      <div className="w-full max-w-md
        bg-[#0F1114] border border-white/10
        rounded-xl shadow-2xl
        animate-in slide-in-from-bottom-4
        sm:slide-in-from-bottom-0
        sm:zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-6 border-b
          border-white/6">
          <div className="flex items-center
            gap-3 mb-3">
            <div className="w-10 h-10
              rounded-xl bg-amber-500/10
              border border-amber-500/20
              flex items-center justify-center">
              <Crown size={18}
                className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-black
                text-white">
                You are on Free plan
              </p>
              <p className="text-xs
                text-gray-500">
                Your {tierName} license expired
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400
            leading-relaxed">
            Your data is{' '}
            <span className="text-emerald-400
              font-semibold">
              100% safe
            </span>
            {' '}and Noxis is working normally
            on the Free plan. These {tierName}{' '}
            features are paused:
          </p>
        </div>

        {/* Feature list */}
        <div className="p-6 space-y-2.5">
          {features.map(f => (
            <div key={f}
              className="flex items-start
                gap-2.5">
              <div className="w-4 h-4
                rounded bg-amber-500/15
                flex items-center justify-center
                flex-shrink-0 mt-0.5">
                <Crown size={8}
                  className="text-amber-400" />
              </div>
              <span className="text-xs
                text-gray-400">
                {f}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">

          {/* Primary: Upgrade */}
          <button
            onClick={startUpgrade}
            className="w-full flex items-center
              justify-between px-4 py-3
              bg-[#60A5FA] text-black
              rounded-lg font-bold text-sm
              hover:bg-blue-400
              transition-colors group"
          >
            <span>
              Renew {tierName} —
              see how to get it
            </span>
            <ArrowRight size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>

          {/* Secondary: Stay Free */}
          <button
            onClick={dismissReminder}
            className="w-full flex items-center
              justify-center gap-2 px-4 py-3
              border border-white/8 text-gray-400
              rounded-lg text-sm font-semibold
              hover:border-white/15
              hover:text-gray-300
              transition-all"
          >
            <Check size={14} />
            Stay on Free plan — remind me later
          </button>

        </div>

        {/* Footer note */}
        <div className="px-6 pb-5">
          <p className="text-[10px]
            text-gray-700 text-center
            leading-relaxed">
            This reminder shows every hour.
            Renewing takes 5 minutes via WhatsApp.
          </p>
        </div>

      </div>
    </div>
  )
}
