'use client'

import React, { useState, useEffect } from 'react'
import {
  Factory, Package, Store, ArrowRight,
  MessageCircle, X, Sparkles, Check, Crown, ShieldCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BusinessMode,
  BUSINESS_MODE_CONFIGS,
  useBusinessModeStore,
} from '@/stores/businessModeStore'
import { useTierStore } from '@/stores/tierStore'
import { useBusinessProfileStore } from '@/store/BusinessProfileStore'

const MODE_ICONS: Record<BusinessMode, React.ComponentType<{ size?: number; className?: string }>> = {
  textile: Factory,
  wholesale: Package,
  retail: Store,
}

const MODE_COLORS: Record<BusinessMode, { accent: string; border: string; bg: string }> = {
  textile: {
    accent: 'text-blue-400',
    border: 'border-blue-500/50',
    bg: 'bg-blue-500/10',
  },
  wholesale: {
    accent: 'text-amber-400',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
  },
  retail: {
    accent: 'text-emerald-400',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
  },
}

export default function BusinessModeSelector() {
  const { setMode } = useBusinessModeStore()
  const { setTier, isTrial, tier } = useTierStore()

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedMode, setSelectedMode] = useState<BusinessMode>('textile')
  const [shopName, setShopName] = useState('')
  const [whatsApp, setWhatsApp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOwnerPermanent, setIsOwnerPermanent] = useState(false)
  const [hwid, setHwid] = useState('')

  // Check hardware ID and active permanent license immediately on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedLicense = localStorage.getItem('noxis_license')
    let hasRealPerpetual = false
    if (storedLicense) {
      try {
        const parsed = JSON.parse(storedLicense)
        if (
          !parsed.isTrial &&
          (parsed.key?.includes('PERPETUAL') ||
           parsed.key?.startsWith('ELIT') ||
           (parsed.tier === 'elite' && parsed.isValid && (!parsed.expiresAt || new Date(parsed.expiresAt).getFullYear() > 2028)))
        ) {
          hasRealPerpetual = true
        }
      } catch {}
    }

    if (hasRealPerpetual) {
      setIsOwnerPermanent(true)
    }

    // Check Electron HWID & verified license status
    const api = (window as any).electronAPI
    if (api?.license?.getInfo) {
      api.license.getInfo().then((res: any) => {
        if (res?.hwid) setHwid(res.hwid)
        if (res?.licenseActive && (res?.isPermanent || !res?.trialStatus)) {
          setIsOwnerPermanent(true)
        }
      }).catch(() => {})
    } else if (api?.license?.getHWID) {
      api.license.getHWID().then((id: string) => {
        if (id) setHwid(id)
      }).catch(() => {})
    }
  }, [])

  const handleModeSelect = (mode: BusinessMode) => {
    setSelectedMode(mode)
  }

  const handleContinue = () => {
    if (selectedMode) {
      setStep(2)
    }
  }

  const handleDismiss = () => {
    // Quick exit: apply fallback profile and mark configured
    const finalShopName = shopName.trim() || 'My Business'
    setMode(selectedMode || 'textile', finalShopName, whatsApp.trim())
    if (typeof window !== 'undefined') {
      localStorage.setItem('noxis_onboarded', 'true')
    }
  }

  const handleComplete = () => {
    const finalShopName = shopName.trim() || 'My Business'
    setIsSubmitting(true)

    // Save mode configuration
    setMode(selectedMode, finalShopName, whatsApp.trim())

    // Update business profile with custom shop name and contact
    const existing = useBusinessProfileStore.getState().profile || ({} as any)
    const updatedProfile = {
      ...existing,
      id: existing.id || '00000000-0000-0000-0000-000000000000',
      business_name: finalShopName,
      owner_name: finalShopName,
      phone: whatsApp.trim(),
      industry_key: selectedMode,
      industry_type: selectedMode,
      onboarding_done: true,
      onboarding_complete: true,
    }
    useBusinessProfileStore.getState().setProfile(updatedProfile)

    // If NOT owner and is a fresh trial user, set 14-day trial
    if (!isOwnerPermanent) {
      const trialExpiry = new Date()
      trialExpiry.setDate(trialExpiry.getDate() + 14)
      setTier('elite', trialExpiry.toISOString(), true)
    } else {
      // Retain Permanent Elite license!
      setTier('elite', undefined, false)
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('noxis-business-profile', JSON.stringify(updatedProfile))
      localStorage.setItem('noxis_onboarded', 'true')
      localStorage.setItem('noxis_first_run_complete', 'true')
    }

    setTimeout(() => {
      setIsSubmitting(false)
      window.location.reload()
    }, 200)
  }

  const handleWhatsAppSync = () => {
    const mode = BUSINESS_MODE_CONFIGS[selectedMode]
    const msg = encodeURIComponent(
      `Salam Omnora,\n\nI configured Noxis Hub.\n\nBusiness: ${shopName.trim() || 'My Business'}\nMode: ${mode.label}\nHWID: ${hwid || 'Verified Hardware'}\nWhatsApp: ${whatsApp.trim() || 'Not provided'}`
    )
    window.open(`https://wa.me/923264742678?text=${msg}`, '_blank')
  }

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-[#030712]/95 flex items-center justify-center p-4 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-2xl bg-[#0B0E14] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer z-10"
          title="Dismiss and open dashboard"
        >
          <X size={18} />
        </button>

        {step === 1 ? (
          <div>
            {/* Header */}
            <div className="px-8 pt-8 pb-4 text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#08EBF6]/10 border border-[#08EBF6]/30 text-[10px] font-mono font-bold text-[#08EBF6] uppercase tracking-widest">
                {isOwnerPermanent ? <Crown size={12} className="text-amber-400" /> : <Sparkles size={10} />}
                <span>{isOwnerPermanent ? 'Permanent Elite License Active' : 'First-Run Setup'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-mono">
                Select Your Industry Mode
              </h1>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                {isOwnerPermanent 
                  ? 'Your Hardware ID is verified. Select your preferred workflow layout below.'
                  : 'This configures your sidebar, dashboard, and feature modules. You can change this anytime.'}
              </p>
              {hwid && (
                <p className="text-[10px] font-mono text-zinc-500 truncate max-w-md mx-auto">
                  HWID: <span className="text-emerald-400 font-semibold">{hwid}</span>
                </p>
              )}
            </div>

            {/* Mode Cards */}
            <div className="px-6 pb-6 space-y-3">
              {(Object.keys(BUSINESS_MODE_CONFIGS) as BusinessMode[]).map((mode) => {
                const config = BUSINESS_MODE_CONFIGS[mode]
                const Icon = MODE_ICONS[mode]
                const colors = MODE_COLORS[mode]
                const isSelected = selectedMode === mode

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeSelect(mode)}
                    className={cn(
                      'w-full text-left p-4 sm:p-5 rounded-lg border transition-colors cursor-pointer',
                      isSelected
                        ? `${colors.border} ${colors.bg}`
                        : 'border-white/10 bg-[#080A0F] hover:bg-white/[0.03]'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border',
                        isSelected
                          ? `${colors.bg} ${colors.border}`
                          : 'bg-white/5 border-white/10'
                      )}>
                        <Icon size={20} className={cn(
                          isSelected ? colors.accent : 'text-zinc-400'
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{config.emoji}</span>
                          <h3 className={cn(
                            'text-sm font-bold uppercase tracking-wide font-mono',
                            isSelected ? 'text-white' : 'text-zinc-300'
                          )}>
                            {config.label}
                          </h3>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                          {config.tagline}
                        </p>
                      </div>

                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                        isSelected
                          ? `${colors.border} ${colors.bg}`
                          : 'border-white/20'
                      )}>
                        {isSelected && <Check size={12} className={colors.accent} />}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Continue Button */}
            <div className="px-6 pb-8 flex items-center gap-3">
              <button
                type="button"
                onClick={handleContinue}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider bg-[#08EBF6] text-black hover:bg-[#5FA5FA] transition-colors cursor-pointer shadow-lg shadow-[#08EBF6]/20"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
              {isOwnerPermanent && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-5 py-3.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="px-8 pt-8 pb-4 space-y-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider cursor-pointer"
              >
                ← Back to Mode Selection
              </button>
              <h2 className="text-xl font-black text-white uppercase tracking-tight font-mono">
                {isOwnerPermanent ? 'Confirm Business Profile' : 'Your Business Details'}
              </h2>
              <p className="text-xs text-zinc-400">
                This appears on your invoices, receipts, and reports.
              </p>
            </div>

            {/* Form */}
            <div className="px-8 pb-6 space-y-5">
              {/* Shop Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Business / Shop Name
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Al-Rehman Fabrics, Lahore Traders, etc."
                  className="w-full px-4 py-3 bg-[#080A0F] border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 font-mono focus:outline-none focus:border-[#08EBF6]/50 transition-colors"
                  autoFocus
                  maxLength={100}
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Contact WhatsApp <span className="text-zinc-600">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={whatsApp}
                  onChange={(e) => setWhatsApp(e.target.value)}
                  placeholder="e.g. 0326-4742678"
                  className="w-full px-4 py-3 bg-[#080A0F] border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 font-mono focus:outline-none focus:border-[#08EBF6]/50 transition-colors"
                  maxLength={20}
                />
              </div>

              {/* Status Badge */}
              <div className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                MODE_COLORS[selectedMode].bg,
                MODE_COLORS[selectedMode].border,
              )}>
                <span className="text-xl">{BUSINESS_MODE_CONFIGS[selectedMode].emoji}</span>
                <div>
                  <p className="text-xs font-bold text-white font-mono">
                    {BUSINESS_MODE_CONFIGS[selectedMode].label}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {isOwnerPermanent
                      ? '👑 Permanent Elite License · Unlimited karigars, cameras & workstations'
                      : '14-Day Full Elite Trial included'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 space-y-3">
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider bg-[#08EBF6] text-black hover:bg-[#5FA5FA] transition-colors cursor-pointer shadow-lg shadow-[#08EBF6]/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Applying Settings...</span>
                ) : (
                  <>
                    <span>{isOwnerPermanent ? 'Open Workspace (Permanent Elite)' : 'Start 14-Day Elite Trial'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppSync}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 text-[#25D366] font-mono font-bold text-[10px] uppercase tracking-wider hover:bg-[#25D366]/10 transition-colors cursor-pointer"
              >
                <MessageCircle size={13} />
                <span>Contact Omnora WhatsApp Support</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
