'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLicense } from '@/hooks/useLicense';
import { useToastStore } from '@/hooks/useToast';
import {
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Smartphone,
  Video,
  CloudOff,
  Building2,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function TrialExpirationModal() {
  const router = useRouter();
  const {
    isPaid,
    trialStatus,
    effectiveTier,
    refresh,
  } = useLicense();

  const [isOpen, setIsOpen] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [hwid, setHwid] = useState('');
  const [copiedHwid, setCopiedHwid] = useState(false);

  // Fetch HWID for quick activation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const api = (window as any).electronAPI;
    if (api?.license?.getHWID) {
      api.license.getHWID().then((id: string) => {
        if (id) setHwid(id);
      }).catch(() => {});
    } else if ((window as any).electron?.getHwid) {
      setHwid((window as any).electron.getHwid());
    }
  }, []);

  // Determine if user has reached Day 8+ expired state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isPaid) {
      setIsOpen(false);
      return;
    }

    const acknowledged = localStorage.getItem('noxis_free_forever_acknowledged');

    // Check if expired either from trial status or stored trial state
    const isExpiredState = trialStatus === 'expired' || effectiveTier === 'free';
    const isTrialCompleted = localStorage.getItem('noxis_trial_completed') === 'true';

    // If Electron returns trial:getState
    const api = (window as any).electronAPI;
    if (api?.trial?.getState) {
      api.trial.getState().then((state: any) => {
        if (state?.status === 'expired' || state?.trialCompleted) {
          if (!acknowledged) {
            setIsOpen(true);
          }
        }
      }).catch(() => {});
    } else {
      // Browser / renderer fallback check
      const rawLicense = localStorage.getItem('noxis_license');
      if (rawLicense) {
        try {
          const parsed = JSON.parse(rawLicense);
          if (parsed.key?.includes('TRIAL') && parsed.expiresAt) {
            const isPast = new Date(parsed.expiresAt).getTime() <= Date.now();
            if (isPast && !acknowledged) {
              setIsOpen(true);
            }
          }
        } catch {}
      } else if (isExpiredState && !acknowledged) {
        setIsOpen(true);
      }
    }
  }, [isPaid, trialStatus, effectiveTier]);

  const handleCopyHwid = () => {
    if (!hwid) return;
    navigator.clipboard.writeText(hwid);
    setCopiedHwid(true);
    setTimeout(() => setCopiedHwid(false), 2000);
  };

  const handleActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setActivationError('Please enter a valid RSA license key');
      return;
    }

    setActivating(true);
    setActivationError('');

    try {
      const api = (window as any).electronAPI;
      if (api?.license?.activate) {
        const res = await api.license.activate(licenseKey.trim());
        if (res.success) {
          useToastStore.getState().addToast({
            type: 'success',
            title: 'License Activated Successfully!',
            message: `Full ${res.tier ? res.tier.toUpperCase() : 'PRO'} tier features permanently unlocked.`,
          });
          setIsOpen(false);
          await refresh();
          return;
        } else {
          setActivationError(res.error || 'Invalid license signature or HWID mismatch');
        }
      } else {
        // Fallback for web demo environment
        const upper = licenseKey.trim().toUpperCase();
        if (upper.includes('NOXIS') || upper.includes('ELITE') || upper.includes('PRO') || upper.length >= 16) {
          const tier = upper.includes('ELITE') ? 'elite' : 'pro';
          localStorage.setItem('noxis_license', JSON.stringify({
            id: 'activated-workstation',
            key: upper,
            tier,
            customerName: 'Verified Factory Node',
            expiresAt: null,
            maxDevices: tier === 'elite' ? 50 : 15,
            activatedAt: Date.now(),
            cacheExpires: Date.now() + 365 * 24 * 60 * 60 * 1000,
            isValid: true,
          }));
          useToastStore.getState().addToast({
            type: 'success',
            title: 'License Activated Successfully!',
            message: `Full ${tier.toUpperCase()} tier features permanently unlocked.`,
          });
          setIsOpen(false);
          await refresh();
          return;
        } else {
          setActivationError('Invalid license key format. Please check your purchase certificate.');
        }
      }
    } catch (err: any) {
      setActivationError(err.message || 'Activation failed');
    } finally {
      setActivating(false);
    }
  };

  const handleContinueFreeForever = () => {
    try {
      localStorage.setItem('noxis_free_forever_acknowledged', 'true');
    } catch {}

    setIsOpen(false);
    useToastStore.getState().addToast({
      type: 'info',
      title: 'Operating in Free Forever Mode',
      message: 'Zero data loss guarantee: POS counter remains active forever and all your records are safe.',
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-2xl bg-[#0B0E14] border border-amber-500/30 rounded-lg shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden flex flex-col"
        >
          {/* Top Brand Accent Stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />

          {/* Modal Header */}
          <div className="p-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                  Your 7-Day Pro Evaluation Has Ended
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Choose whether to upgrade your factory setup or continue with Free Forever mode.
                </p>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Zero Data Loss Guarantee Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-md p-3.5 flex items-start gap-3">
              <Database className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Zero Data Loss Guarantee
                </p>
                <p className="text-[11px] text-emerald-400/80 leading-relaxed mt-0.5">
                  Your local SQLite database is untouched. Every Karigar ledger entry, invoice, customer balance, and inventory item is preserved and will never be deleted.
                </p>
              </div>
            </div>

            {/* Free Forever vs Paid Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              {/* What Remains Active */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-md p-4 space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  Free Forever Features (Always Active)
                </p>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>POS Counter:</strong> Remains 100% unlocked forever</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Data Capacity:</strong> Capped to 200 SKUs &amp; 50 Parties/Ledgers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Export:</strong> Full PDF invoices and Excel records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Offline Local Engine:</strong> Works with zero internet required</span>
                  </li>
                </ul>
              </div>

              {/* What Requires License */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-md p-4 space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-400" />
                  Locked Premium Modules
                </p>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  <li className="flex items-start gap-2">
                    <CloudOff size={13} className="text-slate-500 shrink-0 mt-0.5" />
                    <span>Cloud Backup &amp; Automatic Sync locked</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Smartphone size={13} className="text-slate-500 shrink-0 mt-0.5" />
                    <span>Mobile Wi-Fi pairing (&gt;1 device) locked</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Building2 size={13} className="text-slate-500 shrink-0 mt-0.5" />
                    <span>Multi-branch consolidation locked</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Video size={13} className="text-slate-500 shrink-0 mt-0.5" />
                    <span>CCTV live camera feeds locked</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Offline HWID / Activation Form Accordion */}
            {showKeyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#121622] border border-cyan-500/30 rounded-md p-4 space-y-3.5 shadow-inner"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound size={13} className="text-cyan-400" />
                    Machine ID (HWID) &amp; License Input
                  </span>
                  <a
                    href="https://wa.me/923264742678?text=Hello%20Omnora%20Labs,%20my%207-day%20trial%20has%20ended.%20I%20would%20like%20to%20activate%20my%20license."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <MessageCircle size={12} />
                    WhatsApp Support (+92 326 4742678)
                  </a>
                </div>

                {hwid && (
                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-2 rounded font-mono text-[11px] text-cyan-300">
                    <span className="text-slate-400 select-none">HWID:</span>
                    <span className="flex-1 truncate select-all">{hwid}</span>
                    <button
                      type="button"
                      onClick={handleCopyHwid}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] uppercase font-sans font-bold flex items-center gap-1"
                    >
                      {copiedHwid ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      {copiedHwid ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}

                <form onSubmit={handleActivateKey} className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                      Enter RSA Digital License Key
                    </label>
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      placeholder="e.g. NOXIS-PRO-2026-XXXX-XXXX-XXXX"
                      className="w-full bg-black/60 border border-white/15 focus:border-cyan-400 text-white font-mono text-xs px-3 py-2.5 rounded outline-none transition-colors"
                    />
                  </div>

                  {activationError && (
                    <p className="text-[11px] text-red-400 font-semibold">{activationError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={activating}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider rounded transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <span>{activating ? 'Validating Signature...' : 'Apply License & Unlock'}</span>
                    <ArrowRight size={13} />
                  </button>
                </form>
              </motion.div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="p-6 pt-4 border-t border-white/[0.06] bg-[#080B10] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleContinueFreeForever}
              className="w-full sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded transition-colors text-center"
            >
              Continue in Free Forever Mode
            </button>

            <button
              type="button"
              onClick={() => {
                if (!showKeyInput) {
                  setShowKeyInput(true);
                } else {
                  router.push('/settings/license?upgrade=true');
                }
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <KeyRound size={14} />
              <span>Activate Full License</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
