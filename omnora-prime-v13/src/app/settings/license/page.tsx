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
    name: 'Lite',
    pkrPrice: 'PKR 25,000 / year',
    aedPrice: 'AED 350 / year',
    usdPrice: '$95 / year',
    features: [
      'Unlimited inventory items & parties (no caps)',
      'WhatsApp automated billing & PDF delivery',
      'Karigar payroll runs & pieces tracking',
      'All financial reports with PDF/Excel export',
      'Up to 5 paired mobile devices & PC counter'
    ]
  },
  {
    key: 'pro',
    name: 'Pro',
    pkrPrice: 'PKR 45,000 / year',
    aedPrice: 'AED 600 / year',
    usdPrice: '$160 / year',
    popular: true,
    features: [
      'Everything in Lite included',
      'Foresight AI predictive inventory & cashflow',
      'CCTV live feeds (up to 4 RTSP cameras)',
      'Workflow automation & transactional alerts',
      'Up to 15 devices & multi-branch support'
    ]
  },
  {
    key: 'elite',
    name: 'Elite',
    pkrPrice: 'PKR 75,000 / year',
    aedPrice: 'AED 1,000 / year',
    usdPrice: '$270 / year',
    features: [
      'Everything in Pro included',
      'Up to 6 cameras with AI Sentinel detection',
      'Up to 50 concurrent mobile devices',
      'REST API access, webhooks & custom export',
      'Dedicated Omnora engineering onboarding'
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
    let machineHwid = '';
    if (typeof window !== 'undefined') {
      machineHwid = (window as any).electron?.getHwid?.() || (window as any).electronAPI?.getHwid?.() || '';
      if (!machineHwid) {
        machineHwid = localStorage.getItem('noxis_hwid') || '';
        if (!machineHwid) {
          machineHwid = 'HWID-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
          localStorage.setItem('noxis_hwid', machineHwid);
        }
      }
      setHwid(machineHwid);
    }
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
    toast.success("HWID Copied", "Machine HWID copied to clipboard");
  };

  const getWhatsAppUpgradeUrl = (planKey: string) => {
    const planName = planKey.toUpperCase();
    const bizName = profile?.business_name || 'My Business';
    const message = 
      `Assalam o Alaikum, I want to upgrade Noxis Hub to ${planName} Plan.\n` +
      `My HWID is: ${hwid || 'Checking machine...'}\n` +
      `Business Name: ${bizName}`;
    return `https://wa.me/923264742678?text=${encodeURIComponent(message)}`;
  };

  const handleActivateLicense = async () => {
    const key = licenseKeyInput.trim();
    if (!key) {
      setActivationError("Please enter your license key");
      return;
    }

    setIsActivating(true);
    setActivationError("");

    try {
      let success = false;
      let activatedTier = selectedPlan;

      // Check if Electron offline verification handler exists
      if (typeof window !== 'undefined' && (window as any).electronAPI?.license?.verify) {
        const result = await (window as any).electronAPI.license.verify(key);
        if (result?.valid) {
          success = true;
          activatedTier = result.payload?.tier || selectedPlan;
        } else {
          throw new Error(result?.error || "Invalid offline license key");
        }
      } else {
        // Fallback local verify (for web preview / offline testing)
        if (key.toUpperCase().startsWith("NOXIS-")) {
          const parts = key.split(/[-.]/);
          if (parts.length >= 2) {
            const potentialTier = parts[1].toLowerCase();
            if (['lite', 'pro', 'elite'].includes(potentialTier)) {
              activatedTier = potentialTier as any;
            }
          }
          localStorage.setItem('noxis_license', JSON.stringify({
            tier: activatedTier,
            key: key,
            activatedAt: Date.now(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }));
          success = true;
        } else {
          throw new Error("Invalid license key format. Key must begin with NOXIS-");
        }
      }

      if (success) {
        toast.success("License Activated", `Successfully unlocked ${activatedTier.toUpperCase()} Plan!`);
        await refresh();
        triggerActivationCelebration(activatedTier);
      }
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
        
        {/* Header section */}
        <div className="text-center space-y-2 pt-4">
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-[#C5A059] bg-[#C5A059]/10 px-3 py-1 rounded-full border border-[#C5A059]/20">
            PERPETUAL INDUSTRIAL LICENSING
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Upgrade Noxis Hub
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Permanent license. Your data stays forever. One time per year.
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

          {/* STEP 1: Copy HWID */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs flex-shrink-0">
              1
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-white">
                Step 1 — Copy Your Machine HWID
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This is your machine's unique ID. We need it to make your license work only on your computer.
              </p>

              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  readOnly
                  value={hwid || 'Loading Hardware ID...'}
                  className="flex-1 bg-black/60 border border-white/10 px-3 py-2 text-xs font-mono text-cyan-400 rounded-sm outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyHwid}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-sm transition-colors flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>{copiedHwid ? 'Copied!' : 'Copy HWID'}</span>
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
                Share your HWID and chosen plan directly via WhatsApp for instant verification.
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
                  <p className="text-xs font-bold text-white font-mono mt-0.5">0321-8338768</p>
                  <p className="text-[10px] text-zinc-400">Title: Ahmad Mahboob</p>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-sm">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Easypaisa</p>
                  <p className="text-xs font-bold text-white font-mono mt-0.5">0321-8338768</p>
                  <p className="text-[10px] text-zinc-400">Title: Ahmad Mahboob</p>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-sm">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Bank Transfer / Raast</p>
                  <p className="text-xs font-bold text-white font-mono mt-0.5 truncate">PK74NAYA1234503218338768</p>
                  <p className="text-[10px] text-zinc-400">NayaPay / Raast</p>
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
                    placeholder="Paste your license key here (e.g. NOXIS-PRO-...)"
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
                Activated on a new computer? Contact us on WhatsApp with your new HWID. Transfer takes 5 minutes.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
