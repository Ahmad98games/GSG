'use client'

import React, { useState } from 'react'
import { X, ShieldCheck, Cpu, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface HWIDActivationModalProps {
  isOpen: boolean
  onClose: () => void
  initialTier: string
}

export default function HWIDActivationModal({ isOpen, onClose, initialTier }: HWIDActivationModalProps) {
  const [businessName, setBusinessName] = useState('')
  const [hwid, setHwid] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessName.trim()) {
      setError('Please enter your Business Name')
      return
    }
    if (!hwid.trim()) {
      setError('Please enter your Hardware ID (HWID)')
      return
    }

    const tierName = initialTier.toUpperCase()
    const textMessage = `Assalam-o-Alaikum Omnora Labs, I want to activate Noxis Hub ${tierName} for ${businessName.trim()}. My Hardware ID (HWID) is: ${hwid.trim()}`
    const waUrl = `https://wa.me/923264742678?text=${encodeURIComponent(textMessage)}`
    
    window.open(waUrl, '_blank')
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0A0D10] border border-[#C5A059]/30 rounded-sm w-full max-w-lg overflow-hidden shadow-2xl relative"
        >
          {/* Header */}
          <div className="bg-[#12161F] border-b border-white/[0.08] p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
                <Cpu size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Activate {initialTier.toUpperCase()} License
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Offline Hardware Fingerprint Registration
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleContinue} className="p-6 space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                Selected Tier Plan
              </label>
              <input
                type="text"
                readOnly
                value={`NOXIS HUB ${initialTier.toUpperCase()} TIER`}
                className="w-full bg-[#040608] border border-white/10 text-[#C5A059] font-mono text-xs px-4 py-3 rounded-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                Business Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => { setError(''); setBusinessName(e.target.value); }}
                placeholder="e.g. Al-Hamid Textiles"
                className="w-full bg-[#040608] border border-white/10 text-white text-xs px-4 py-3 rounded-sm focus:border-[#C5A059] outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                Hardware ID (HWID) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={hwid}
                onChange={(e) => { setError(''); setHwid(e.target.value.toUpperCase()); }}
                placeholder="e.g. A1B2-C3D4-E5F6-7890"
                className="w-full bg-[#040608] border border-white/10 text-emerald-400 font-mono text-xs px-4 py-3 rounded-sm focus:border-[#C5A059] outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                💡 Found in Noxis Hub PC → Settings → License & System
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 rounded-sm">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#C5A059] via-[#E8D5B5] to-[#C5A059] text-black font-black text-xs uppercase tracking-wider py-3.5 rounded-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(197,160,89,0.2)]"
              >
                <MessageSquare size={16} />
                <span>Continue to WhatsApp Activation 🚀</span>
              </button>
            </div>

            <div className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>Offline RSA-2048 Signed Key Delivery via Official Support</span>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
