'use client'

import React, { useState, useEffect } from 'react'
import { X, ShieldCheck, Cpu, MessageSquare, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface HWIDActivationModalProps {
  isOpen: boolean
  onClose: () => void
  initialTier: string
  isNonDismissible?: boolean
}

export default function HWIDActivationModal({
  isOpen,
  onClose,
  initialTier,
  isNonDismissible = false,
}: HWIDActivationModalProps) {
  const [businessName, setBusinessName] = useState('')
  const [hwid, setHwid] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const electronHwid = (window as any).electron?.getHwid?.() || (window as any).electronAPI?.getHwid?.();
      if (electronHwid) {
        setHwid(electronHwid);
      } else {
        const storedProfile = localStorage.getItem('noxis-business-profile');
        if (storedProfile) {
          try {
            const parsed = JSON.parse(storedProfile);
            if (parsed.business_name && !businessName) {
              setBusinessName(parsed.business_name);
            }
          } catch {}
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null

  const handleCopyHwid = () => {
    if (!hwid) return;
    navigator.clipboard.writeText(hwid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivateViaWhatsApp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!businessName.trim()) {
      setError('Please enter your Business Name');
      return;
    }
    if (!hwid.trim()) {
      setError('Please enter your Hardware ID (HWID)');
      return;
    }

    // Copy HWID to clipboard automatically
    navigator.clipboard.writeText(hwid.trim());
    setCopied(true);

    const tierName = initialTier.toUpperCase();
    const textMessage = 
      `Assalam-o-Alaikum Omnora Labs,\n\n` +
      `I want to activate Noxis Hub *${tierName} Plan*.\n` +
      `🏢 Business: ${businessName.trim()}\n` +
      `💻 Machine HWID: ${hwid.trim()}\n\n` +
      `Please issue my cryptographically verified offline activation license key.`;

    const waUrl = `https://wa.me/923264742678?text=${encodeURIComponent(textMessage)}`;
    window.open(waUrl, '_blank');

    if (!isNonDismissible) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0A0D10] border border-[#08EBF6]/30 rounded-sm w-full max-w-lg overflow-hidden shadow-2xl relative"
        >
          {/* Header */}
          <div className="bg-[#12161F] border-b border-white/[0.08] p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#08EBF6]/10 border border-[#08EBF6]/30 flex items-center justify-center text-[#08EBF6]">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Activate {initialTier.toUpperCase()} License
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  100% Offline Cryptographic Hardware Registration
                </p>
              </div>
            </div>
            {!isNonDismissible && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleActivateViaWhatsApp} className="p-6 space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                Selected Tier Plan
              </label>
              <input
                type="text"
                readOnly
                value={`NOXIS HUB ${initialTier.toUpperCase()} TIER`}
                className="w-full bg-[#040608] border border-white/10 text-[#08EBF6] font-mono text-xs px-4 py-3 rounded-sm font-bold outline-none"
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
                className="w-full bg-[#040608] border border-white/10 text-white text-xs px-4 py-3 rounded-sm focus:border-[#08EBF6] outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Hardware ID (HWID) <span className="text-red-400">*</span>
                </label>
                {hwid && (
                  <button
                    type="button"
                    onClick={handleCopyHwid}
                    className="text-[10px] font-mono text-[#08EBF6] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copied ? 'Copied!' : 'Copy HWID'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={hwid}
                onChange={(e) => { setError(''); setHwid(e.target.value.toUpperCase()); }}
                placeholder="e.g. A1B2-C3D4-E5F6-7890"
                className="w-full bg-[#040608] border border-white/10 text-emerald-400 font-mono text-xs px-4 py-3 rounded-sm focus:border-[#08EBF6] outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                💡 Located in Noxis Hub Desktop → Settings → License & System
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
                className="w-full flex items-center justify-center gap-2 bg-[#08EBF6] hover:bg-[#08EBF6]/90 text-black font-black text-xs uppercase tracking-wider py-4 rounded-sm transition-all shadow-[0_0_25px_rgba(8,235,246,0.35)] cursor-pointer"
              >
                <MessageSquare size={16} />
                <span>Activate via WhatsApp (1-Click)</span>
              </button>
            </div>

            <div className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>Offline RSA-2048 Signed Key Delivery via Official Support (+92 326 4742678)</span>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
