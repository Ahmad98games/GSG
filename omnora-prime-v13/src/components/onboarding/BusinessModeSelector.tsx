'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Factory, Package, Store, ArrowRight,
  MessageCircle, X, Sparkles, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BusinessMode,
  BUSINESS_MODE_CONFIGS,
  useBusinessModeStore,
} from '@/stores/businessModeStore'
import { useTierStore } from '@/stores/tierStore'

const MODE_ICONS: Record<BusinessMode, React.ComponentType<{ size?: number; className?: string }>> = {
  textile: Factory,
  wholesale: Package,
  retail: Store,
}

const MODE_COLORS: Record<BusinessMode, { accent: string; border: string; bg: string; glow: string }> = {
  textile: {
    accent: 'text-blue-400',
    border: 'border-blue-500/50',
    bg: 'bg-blue-500/10',
    glow: 'shadow-[0_0_20px_rgba(96,165,250,0.15)]',
  },
  wholesale: {
    accent: 'text-amber-400',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  },
  retail: {
    accent: 'text-emerald-400',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]',
  },
}

export default function BusinessModeSelector() {
  const { setMode } = useBusinessModeStore()
  const { setTier } = useTierStore()

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedMode, setSelectedMode] = useState<BusinessMode | null>(null)
  const [shopName, setShopName] = useState('')
  const [whatsApp, setWhatsApp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleModeSelect = useCallback((mode: BusinessMode) => {
    setSelectedMode(mode)
  }, [])

  const handleContinue = useCallback(() => {
    if (selectedMode) {
      setStep(2)
    }
  }, [selectedMode])

  const handleComplete = useCallback(() => {
    if (!selectedMode || !shopName.trim()) return

    setIsSubmitting(true)

    // Save to business mode store
    setMode(selectedMode, shopName.trim(), whatsApp.trim())

    // Start 14-day trial
    const trialExpiry = new Date()
    trialExpiry.setDate(trialExpiry.getDate() + 14)
    setTier('elite', trialExpiry.toISOString(), true)

    // Mark onboarding as complete
    if (typeof window !== 'undefined') {
      localStorage.setItem('noxis_onboarded', 'true')
      localStorage.setItem('noxis_first_run_complete', 'true')
      localStorage.setItem('noxis_trial_started', new Date().toISOString())
    }

    // Brief delay for animation
    setTimeout(() => {
      setIsSubmitting(false)
      window.location.reload()
    }, 600)
  }, [selectedMode, shopName, whatsApp, setMode, setTier])

  const handleWhatsAppSync = useCallback(() => {
    if (!selectedMode || !shopName.trim()) return

    const mode = BUSINESS_MODE_CONFIGS[selectedMode]
    const msg = encodeURIComponent(
      `Salam Omnora,\n\nI just installed Noxis Hub.\n\nBusiness: ${shopName.trim()}\nMode: ${mode.label}\nWhatsApp: ${whatsApp.trim() || 'Not provided'}\n\nPlease help me get started with my 14-day trial.`
    )
    window.open(`https://wa.me/923264742678?text=${msg}`, '_blank')
  }, [selectedMode, shopName, whatsApp])

  return (
    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#08EBF6]/5 blur-[150px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-[#0B0E14] border border-white/10 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-8 pb-4 text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#08EBF6]/10 border border-[#08EBF6]/30 text-[10px] font-mono font-bold text-[#08EBF6] uppercase tracking-widest">
                  <Sparkles size={10} />
                  <span>First-Run Setup</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-mono">
                  What Does Your Business Do?
                </h1>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  This configures your sidebar, dashboard, and feature modules.
                  You can change this later in Settings.
                </p>
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
                        'w-full text-left p-5 rounded-lg border transition-all duration-200 cursor-pointer group',
                        'hover:bg-white/[0.03]',
                        isSelected
                          ? `${colors.border} ${colors.bg} ${colors.glow}`
                          : 'border-white/10 bg-[#080A0F]'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border transition-colors',
                          isSelected
                            ? `${colors.bg} ${colors.border}`
                            : 'bg-white/5 border-white/10'
                        )}>
                          <Icon size={20} className={cn(
                            'transition-colors',
                            isSelected ? colors.accent : 'text-zinc-400'
                          )} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{config.emoji}</span>
                            <h3 className={cn(
                              'text-sm font-bold uppercase tracking-wide font-mono transition-colors',
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
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                          isSelected
                            ? `${colors.border} ${colors.bg}`
                            : 'border-white/20'
                        )}>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                              <Check size={12} className={colors.accent} />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Continue Button */}
              <div className="px-6 pb-8">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!selectedMode}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer',
                    selectedMode
                      ? 'bg-[#08EBF6] text-black hover:bg-[#5FA5FA] shadow-[0_0_20px_rgba(8,235,246,0.2)]'
                      : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                  )}
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg"
          >
            <div className="bg-[#0B0E14] border border-white/10 rounded-xl overflow-hidden">
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
                  Your Business Details
                </h2>
                <p className="text-xs text-zinc-400">
                  This appears on your invoices, receipts, and WhatsApp messages.
                </p>
              </div>

              {/* Form */}
              <div className="px-8 pb-6 space-y-5">
                {/* Shop Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    Business / Shop Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Gold She Garments"
                    className="w-full px-4 py-3 bg-[#080A0F] border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 font-mono focus:outline-none focus:border-[#08EBF6]/50 focus:ring-1 focus:ring-[#08EBF6]/20 transition-all"
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
                    className="w-full px-4 py-3 bg-[#080A0F] border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 font-mono focus:outline-none focus:border-[#08EBF6]/50 focus:ring-1 focus:ring-[#08EBF6]/20 transition-all"
                    maxLength={20}
                  />
                </div>

                {/* Selected Mode Badge */}
                {selectedMode && (
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
                        14-Day Elite Trial starts on launch
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-8 pb-8 space-y-3">
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={!shopName.trim() || isSubmitting}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer',
                    shopName.trim()
                      ? 'bg-[#08EBF6] text-black hover:bg-[#5FA5FA] shadow-[0_0_20px_rgba(8,235,246,0.2)]'
                      : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                      />
                      Setting Up...
                    </span>
                  ) : (
                    <>
                      <span>Start 14-Day Elite Trial</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppSync}
                  disabled={!shopName.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 text-[#25D366] font-mono font-bold text-[10px] uppercase tracking-wider hover:bg-[#25D366]/10 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <MessageCircle size={13} />
                  <span>Sync Trial via WhatsApp</span>
                </button>

                <p className="text-center text-[10px] text-zinc-600 font-mono">
                  No credit card · No email · Works 100% offline
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
