'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Check, Copy, ExternalLink, ShieldCheck, Zap, Crown, 
  MessageCircle, ArrowRight, Cpu, Clock, AlertCircle, Sparkles, Building2, CheckCircle2
} from 'lucide-react';
import { useLicense } from '@/hooks/useLicense';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { triggerActivationCelebration } from '@/components/license/ActivationCelebration';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface PlanDetails {
  key: 'lite' | 'pro' | 'elite';
  name: string;
  pkrPrice: string;
  aedPrice: string;
  usdPrice: string;
  popular?: boolean;
  features: string[];
}

const PLANS: PlanDetails[] = [
  {
    key: 'lite',
    name: 'Lite Tier',
    pkrPrice: 'Rs. 72,000 Permanent (or Rs. 1,999/mo · 18k/yr)',
    aedPrice: 'AED 999 Lifetime (or AED 350/yr)',
    usdPrice: '$260 Lifetime (or $95/yr)',
    features: [
      'Permanent lifetime motherboard-locked license (Never expires)',
      'Up to 5 workstation PCs & 5 Android phones on Wi-Fi',
      'Unlimited raw material & fabric SKUs',
      'Double-entry wholesale Khata ledger & party accounts',
      'PDF invoices & 58mm/80mm thermal slip printing',
      'Automated daily local SQLite backups',
      'Free hardware motherboard re-binding guarantee'
    ]
  },
  {
    key: 'pro',
    name: 'Pro Tier',
    pkrPrice: 'Rs. 135,000 Permanent (or Rs. 4,999/mo · 45k/yr)',
    aedPrice: 'AED 1,899 Lifetime (or AED 750/yr)',
    usdPrice: '$490 Lifetime (or $205/yr)',
    popular: true,
    features: [
      'Permanent lifetime motherboard-locked license (Never expires)',
      'Up to 15 workstation PCs & 15 Android phones on Wi-Fi',
      'Karigar piece-rate payroll & Peshgi advance ledger',
      'Connect up to 4 on-site IP cameras via RTSP',
      'Automated WhatsApp invoices & payment slips',
      'Roznamcha cash book & Profit/Loss reporting',
      '1 Year VIP technical support & free lifetime motherboard re-binding'
    ]
  },
  {
    key: 'elite',
    name: 'Elite Tier',
    pkrPrice: 'Rs. 225,000 Permanent (or Rs. 9,999/mo · 90k/yr)',
    aedPrice: 'AED 3,199 Lifetime (or AED 1,499/yr)',
    usdPrice: '$799 Lifetime (or $410/yr)',
    features: [
      'Permanent enterprise cluster license (Never expires)',
      'Up to 50 workstation PCs & 50 Android devices on Wi-Fi',
      'Connect up to 6 IP cameras with AI Sentinel tripwires',
      'Multi-branch factory operations & stock transfer',
      'RS232 weighbridge scale bridge integration',
      'Automatic reorder & 30-day material forecasting',
      'Turnkey onboarding & lifetime direct Senior Engineer WhatsApp desk'
    ]
  }
];

export default function LicenseUpgradePage() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const { profile } = useBusinessProfile();
  const { tier, isPaid, isTrial, refresh } = useLicense();

  const [selectedPlan, setSelectedPlan] = useState<'lite' | 'pro' | 'elite'>('pro');
  const [hwid, setHwid] = useState<string>('');
  const [copiedHwid, setCopiedHwid] = useState<boolean>(false);
  const [licenseKeyInput, setLicenseKeyInput] = useState<string>('');
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [activationError, setActivationError] = useState<string>('');

  // Detect region/currency
  const isUAE = profile?.country_code === 'AE';
  const isIntl = profile?.region === 'international' && !isUAE;

  // Retrieve HWID from electron or fallback localStorage
  useEffect(() => {
    let isMounted = true;
    async function fetchHwid() {
      if (typeof window === 'undefined') return;
      try {
        const api = (window as any).electronAPI || (window as any).electron;
        const machineId = await (api?.license?.getHWID?.() || api?.getHwid?.());
        if (isMounted && machineId && typeof machineId === 'string') {
          setHwid(machineId);
          return;
        }
      } catch (err) {
        console.warn('Failed to load electron HWID:', err);
      }

      let fallback = localStorage.getItem('noxis_hwid') || '';
      if (!fallback) {
        fallback = 'HWID-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        localStorage.setItem('noxis_hwid', fallback);
      }
      if (isMounted) setHwid(fallback);
    }

    fetchHwid();
    return () => { isMounted = false; };
  }, []);

  // Business Hours Calculation (Mon-Sat 9am - 9pm PKT = UTC+5)
  const isBusinessHours = () => {
    const now = new Date();
    // Convert to PKT (UTC+5)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const pktTime = new Date(utc + (3600000 * 5));
    const day = pktTime.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const hours = pktTime.getHours();
    const isWorkDay = day >= 1 && day <= 6;
    const isWorkHours = hours >= 9 && hours < 21;
    return isWorkDay && isWorkHours;
  };

  const withinBusinessHours = isBusinessHours();

  const handleCopyHwid = () => {
    if (!hwid) return;
    navigator.clipboard.writeText(hwid);
    setCopiedHwid(true);
    setTimeout(() => setCopiedHwid(false), 2500);
    toast.success("Machine ID Copied", "Your Machine ID has been copied to clipboard");
  };

  const getWhatsAppUpgradeUrl = (planKey: string) => {
    const planName = planKey.toUpperCase();
    const bizName = profile?.business_name || 'My Business';
    const message = 
      `Assalam o Alaikum, I want to upgrade Noxis Hub to ${planName} Plan.\n` +
      `My Machine ID is: ${hwid || 'Checking machine...'}\n` +
      `Business Name: ${bizName}`;
    return `https://wa.me/923264742678?text=${encodeURIComponent(message)}`;
  };

  const handleActivateLicense = async () => {
    const rawKey = licenseKeyInput.trim();
    if (!rawKey) {
      setActivationError("Please enter your license key");
      return;
    }

    setIsActivating(true);
    setActivationError("");

    const cleanKey = rawKey.toUpperCase();

    try {
      let success = false;
      let activatedTier: 'lite' | 'pro' | 'elite' = selectedPlan;
      let licenseExpiresAt: string | undefined = undefined;
      let customerName: string = profile?.business_name || 'Customer';

      // ── Step 1: Attempt Live Supabase Activation API ──
      try {
        const array = new Uint8Array(16);
        if (typeof window !== 'undefined' && window.crypto) {
          window.crypto.getRandomValues(array);
        }
        const nonce = Array.from(array, dec => dec.toString(16).padStart(2, '0')).join('') || 
                      (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)).slice(0, 32);

        const machineInfo = {
          platform: typeof navigator !== 'undefined' ? navigator.platform : 'win32',
          language: typeof navigator !== 'undefined' ? navigator.language : 'en',
          cores: String(typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 'unknown' : 'unknown'),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screen: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'desktop',
          hwid: hwid || 'HWID-UNKNOWN',
        };

        const res = await fetch('/api/license/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseKey: cleanKey,
            machineInfo,
            appVersion: '13.0.3',
            nonce,
          }),
          signal: AbortSignal.timeout(10000),
        });

        const data = await res.json().catch(() => null);

        if (res.ok && data?.success && data?.license) {
          success = true;
          const returnedTier = String(data.license.tier || '').toLowerCase();
          if (['lite', 'pro', 'elite'].includes(returnedTier)) {
            activatedTier = returnedTier as 'lite' | 'pro' | 'elite';
          }
          licenseExpiresAt = data.license.expiresAt || undefined;
          if (data.license.customerName) {
            customerName = data.license.customerName;
          }
        } else if (data?.error && (res.status === 403 || res.status === 429)) {
          // Explicit refusal from license server (e.g. deactivated or expired)
          throw new Error(data.error);
        }
      } catch (apiErr: any) {
        if (apiErr.message && (
          apiErr.message.includes('deactivated') || 
          apiErr.message.includes('expired') || 
          apiErr.message.includes('registered to a different email') ||
          apiErr.message.includes('Too many attempts')
        )) {
          throw apiErr;
        }
        console.warn('[License Activation] Live API check bypassed or offline, falling back to local verification:', apiErr);
      }

      // ── Step 2: If live API didn't resolve, try Electron offline verification ──
      if (!success) {
        const electron = typeof window !== 'undefined' ? ((window as any).electronAPI || (window as any).electron) : null;
        if (electron?.license?.activate) {
          const result = await electron.license.activate(cleanKey);
          if (result?.success) {
            success = true;
            if (result.tier && ['lite', 'pro', 'elite'].includes(result.tier.toLowerCase())) {
              activatedTier = result.tier.toLowerCase() as 'lite' | 'pro' | 'elite';
            }
          }
        }
      }

      if (!success) {
        throw new Error("Invalid license key or cryptographic signature. Please check your key or contact Omnora Labs on WhatsApp (+92 326 4742678).");
      }

      // ── Step 4: Persist activation everywhere and unlock at the moment ──
      const expiresIso = licenseExpiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      // 1. LocalStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('noxis_license', JSON.stringify({
          tier: activatedTier,
          key: cleanKey,
          customerName,
          activatedAt: Date.now(),
          expiresAt: expiresIso,
        }));
      }

      // 2. Electron persistent store
      const electron = typeof window !== 'undefined' ? ((window as any).electronAPI || (window as any).electron) : null;
      if (electron?.license?.activate) {
        await electron.license.activate({
          key: cleanKey,
          tier: activatedTier,
          expiresAt: new Date(expiresIso).getTime(),
          customerName,
        }).catch(() => {});
      }

      // 3. Zustand store
      try {
        const { useTierStore } = await import('@/stores/tierStore');
        useTierStore.getState().setTier(activatedTier, expiresIso, false);
      } catch {}

      // 4. Refresh LicenseProvider context
      await refresh();

      // 5. Celebration & Toast
      triggerActivationCelebration(activatedTier);
      toast.success(
        "License Activated", 
        `Successfully unlocked ${activatedTier.toUpperCase()} Plan permanently!`
      );
      setLicenseKeyInput("");
      setActivationError("");

    } catch (err: any) {
      setActivationError(err.message || "Failed to verify license key");
      toast.error("Activation Failed", err.message || "License could not be verified");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090B] text-slate-300 p-4 sm:p-8 font-inter">
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
        </div>
        
        {/* Header section */}
        <div className="text-center space-y-2 pt-4">
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-[#C5A059] bg-[#C5A059]/10 px-3 py-1 rounded-full border border-[#C5A059]/20">
            PERPETUAL INDUSTRIAL LICENSING
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Upgrade Noxis Hub
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Permanent lifetime licenses (Lite: Rs. 72,000 · Pro: Rs. 135,000 · Elite: Rs. 225,000) or flexible monthly/annual subscriptions.
          </p>
        </div>

        {/* 3 Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((p) => {
            const isSelected = selectedPlan === p.key;
            const isCurrentActive = tier === p.key && isPaid;
            const price = isUAE ? p.aedPrice : isIntl ? p.usdPrice : p.pkrPrice;

            return (
              <div
                key={p.key}
                onClick={() => setSelectedPlan(p.key)}
                className={cn(
                  "p-6 rounded-lg border transition-all relative flex flex-col justify-between cursor-pointer",
                  isSelected
                    ? "bg-[#0F1116] border-[#C5A059] shadow-[0_0_30px_rgba(197,160,89,0.15)] ring-1 ring-[#C5A059]/60"
                    : "bg-[#0B0D10] border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                )}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#C5A059] text-black text-[9px] font-black uppercase tracking-widest shadow-md">
                    Most Popular
                  </div>
                )}

                {isCurrentActive && (
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest">
                    Active Plan
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">
                      {p.name}
                    </h3>
                    <span className={cn(
                      "w-3 h-3 rounded-full border",
                      isSelected ? "bg-[#C5A059] border-[#C5A059]" : "border-zinc-700 bg-transparent"
                    )} />
                  </div>

                  <p className="text-lg font-black text-[#C5A059] font-mono tracking-tight mb-4">
                    {price}
                  </p>

                  <div className="h-px bg-white/5 my-4" />

                  <ul className="space-y-2.5 mb-6">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <Check size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={getWhatsAppUpgradeUrl(p.key)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "w-full py-3 px-4 rounded-sm font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                    isSelected
                      ? "bg-[#C5A059] hover:bg-[#D4B06A] text-black shadow-[0_4px_20px_rgba(197,160,89,0.25)]"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                >
                  <span>Upgrade to {p.name}</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            );
          })}
        </div>

        {/* Plan assistance banner */}
        <div className="text-center p-4 rounded-lg bg-black/40 border border-white/5 space-y-1">
          <p className="text-xs text-zinc-400">
            Not sure which plan? WhatsApp us. We will help you choose.
          </p>
          <a
            href="https://wa.me/923264742678?text=Assalam%20o%20Alaikum%2C%20I%20need%20help%20choosing%20the%20right%20Noxis%20Hub%20plan%20for%20my%20business."
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#25D366] hover:underline inline-flex items-center gap-1.5"
          >
            <MessageCircle size={14} />
            <span>Chat with an advisor on WhatsApp</span>
          </a>
        </div>

        {/* Step-by-Step Offline Activation Process */}
        <div className="bg-[#0B0D10] border border-white/10 rounded-xl p-6 sm:p-8 space-y-8 shadow-2xl">
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              4-Step Instant Activation
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Activate your license completely offline without sharing your financial records.
            </p>
          </div>

          {/* STEP 1: Copy Machine ID */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs flex-shrink-0">
              1
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-white">
                Step 1 — Copy Your Machine ID
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This is your computer&apos;s unique Machine ID (hardware identifier). Your offline license key is permanently locked to this hardware.
              </p>

              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  readOnly
                  value={hwid || 'Loading Machine ID...'}
                  className="flex-1 bg-black/60 border border-white/10 px-3 py-2 text-xs font-mono text-cyan-400 rounded-sm outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyHwid}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-sm transition-colors flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>{copiedHwid ? 'Copied!' : 'Copy Machine ID'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: Contact Omnora Labs */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs flex-shrink-0">
              2
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-white">
                Step 2 — Contact Omnora Labs
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Share your Machine ID and chosen plan directly via WhatsApp for instant license generation.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={getWhatsAppUpgradeUrl(selectedPlan)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-black font-black uppercase tracking-wider text-xs rounded-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.25)]"
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp Omnora Labs (+92 326 4742678)</span>
                </a>
                <span className="text-xs text-zinc-500">
                  Or email: <a href="mailto:activate@noxishub.app" className="text-zinc-400 underline">activate@noxishub.app</a>
                </span>
              </div>
            </div>
          </div>

          {/* STEP 3: Make Payment */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-xs flex-shrink-0">
              3
            </div>
            <div className="flex-1 space-y-3">
              <h4 className="text-sm font-bold text-white">
                Step 3 — Make Payment
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-black/40 border border-white/5 rounded-sm">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">JazzCash</p>
                  <p className="text-xs font-bold text-white font-mono mt-0.5">0326-4742678</p>
                  <p className="text-[10px] text-zinc-400">Title: Ahmad Mahboob</p>
                </div>
              
                <div className="p-3 bg-black/40 border border-white/5 rounded-sm">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Bank Transfer / Raast</p>
                  <p className="text-xs font-bold text-white font-mono mt-0.5 truncate">PK09RQMI0000023005156748</p>
                  <p className="text-[10px] text-zinc-400">Account Number: 023005156748</p>
                  <p className="text-[10px] text-zinc-400">Bank: Raqami Islamic Digital Bank</p>
                  <p className="text-[10px] text-zinc-400">Title: AHMED MEHBOOB</p>
                </div>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/5 rounded text-xs space-y-1">
                <p className="text-zinc-300">
                  Send payment screenshot on WhatsApp. We verify within 30 minutes during business hours (Mon-Sat 9am-9pm PKT).
                </p>
                {!withinBusinessHours && (
                  <p className="text-amber-400 font-medium">
                    🌙 We are currently offline. You will receive your key when we are back online. Your payment is safe.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* STEP 4: Activate Your License */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold text-xs flex-shrink-0">
              4
            </div>
            <div className="flex-1 space-y-3">
              <h4 className="text-sm font-bold text-white">
                Step 4 — Activate Your License
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your license key will be sent via WhatsApp after payment verification. Activation is instant and works completely offline.
              </p>

              <div className="space-y-2 max-w-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={licenseKeyInput}
                    onChange={(e) => setLicenseKeyInput(e.target.value)}
                    placeholder="Paste your license key here (e.g. ELIT-AHMA-D238-2024 or NOXIS-...)"
                    className="flex-1 bg-black/60 border border-white/10 px-3.5 py-2.5 text-xs text-white rounded-sm font-mono focus:border-[#C5A059] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleActivateLicense}
                    disabled={isActivating || !licenseKeyInput.trim()}
                    className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#D4B06A] disabled:opacity-50 text-black font-black uppercase tracking-wider text-xs rounded-sm transition-all shadow-[0_0_15px_rgba(197,160,89,0.2)] flex items-center gap-1.5"
                  >
                    {isActivating ? 'Verifying...' : 'Activate Now'}
                  </button>
                </div>
                {activationError && (
                  <p className="text-[11px] text-red-400 font-medium">
                    {activationError}
                  </p>
                )}
              </div>

              <p className="text-[11px] text-zinc-500 pt-1">
                Activated on a new computer? Contact us on WhatsApp with your new Machine ID. Re-binding to new hardware takes 5 minutes.
              </p>
            </div>
          </div>

        </div>

        {/* Evaluation Terms & Data Retention Policy */}
        <div className="bg-[#0D1017] border border-white/5 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Automated Evaluation &amp; Data Protection Policy
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400">
            <div className="space-y-1">
              <p className="font-bold text-white text-[11px] uppercase tracking-wide">1. Automated 7-Day Elite Trial</p>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Starts automatically on installation with full Elite features (Cloud Sync, CCTV, AI, and Karigar piece-rate payroll). You receive pre-expiry notices before the evaluation window closes.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white text-[11px] uppercase tracking-wide">2. Zero Data Loss Guarantee</p>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Your database is stored locally on your hard drive in SQLite. Records, invoices, and ledgers are never deleted, locked, or held hostage upon trial completion.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white text-[11px] uppercase tracking-wide">3. Free Forever Downgrade &amp; Caps</p>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                On Day 8+, unrenewed workstations transition to Free Forever (POS Counter and existing records remain permanently active; new entries are capped at 200 SKUs and 50 parties).
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
