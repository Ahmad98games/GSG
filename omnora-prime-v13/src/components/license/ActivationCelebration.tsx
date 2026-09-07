'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Sparkles, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CelebrationState {
  isOpen: boolean;
  tier: string;
  validUntil: string;
  redirectTo?: string;
}

const TIER_UNLOCKED_FEATURES: Record<string, string[]> = {
  lite: [
    "Unlimited inventory items (no 100 SKU cap)",
    "WhatsApp billing automation & PDF invoice sharing",
    "PDF and Excel report exports",
    "Karigar payroll runs & payslip generation",
    "Bank reconciliation & expense khata",
    "Up to 5 paired mobile devices",
  ],
  pro: [
    "Everything in Lite included",
    "Foresight AI demand & revenue predictions",
    "CCTV live feeds (up to 4 RTSP cameras)",
    "Workflow automation triggers",
    "Up to 15 connected devices",
    "Multi-branch consolidated ledger",
  ],
  elite: [
    "Everything in Pro included",
    "Up to 6 high-def CCTV cameras with AI Sentinel",
    "Up to 50 concurrent mobile devices",
    "Full REST API & webhook access",
    "Perpetual offline cryptographic activation",
    "Priority Omnora Labs engineering support",
  ],
};

let globalTrigger: ((tier: string, validUntil?: string, redirectTo?: string) => void) | null = null;

export function triggerActivationCelebration(tier: string, validUntil?: string, redirectTo?: string) {
  if (globalTrigger) {
    globalTrigger(tier, validUntil, redirectTo);
  } else if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('noxis:activation_celebration', {
      detail: { tier, validUntil, redirectTo }
    }));
  }
}

export function ActivationCelebration() {
  const router = useRouter();
  const [state, setState] = useState<CelebrationState>({
    isOpen: false,
    tier: 'lite',
    validUntil: '1 Year from today',
    redirectTo: undefined,
  });

  useEffect(() => {
    globalTrigger = (tier: string, validUntil?: string, redirectTo?: string) => {
      // Check if user was previously blocked from a feature
      const savedRedirect = redirectTo || (typeof window !== 'undefined' ? sessionStorage.getItem('noxis_upgrade_redirect') || undefined : undefined);
      setState({
        isOpen: true,
        tier: tier.toLowerCase(),
        validUntil: validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
        redirectTo: savedRedirect,
      });
    };

    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      globalTrigger?.(detail.tier || 'lite', detail.validUntil, detail.redirectTo);
    };

    window.addEventListener('noxis:activation_celebration', handleCustomEvent);
    return () => {
      window.removeEventListener('noxis:activation_celebration', handleCustomEvent);
      globalTrigger = null;
    };
  }, []);

  if (!state.isOpen) return null;

  const tierKey = state.tier in TIER_UNLOCKED_FEATURES ? state.tier : 'lite';
  const tierDisplayName = tierKey.charAt(0).toUpperCase() + tierKey.slice(1) + ' Plan';
  const features = TIER_UNLOCKED_FEATURES[tierKey] || TIER_UNLOCKED_FEATURES.lite;

  const handleDismiss = () => {
    setState(prev => ({ ...prev, isOpen: false }));
    if (state.redirectTo) {
      const destination = state.redirectTo;
      try {
        sessionStorage.removeItem('noxis_upgrade_redirect');
      } catch {}
      router.push(destination);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#07090B] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Gold Ambient Glow & Rising Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.18)_0,transparent_70%)]" />
        {[...Array(28)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#C5A059] opacity-75 animate-float-up"
            style={{
              left: `${(i * 13) % 100}%`,
              bottom: `-20px`,
              animationDuration: `${3.2 + (i % 4)}s`,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-lg w-full bg-[#0D0F12] border border-[#C5A059]/40 rounded-xl p-6 sm:p-8 text-center space-y-6 relative z-10 shadow-[0_0_50px_rgba(197,160,89,0.2)] animate-in zoom-in-95 duration-400">
        
        {/* Animated Gold Checkmark */}
        <div className="w-16 h-16 rounded-full bg-[#C5A059]/15 border-2 border-[#C5A059] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(197,160,89,0.35)] animate-bounce-subtle">
          <CheckCircle2 className="w-9 h-9 text-[#C5A059]" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-[#C5A059] bg-[#C5A059]/10 px-3 py-1 rounded-full border border-[#C5A059]/20">
            OFFLINE CRYPTOGRAPHIC ACTIVATION VERIFIED
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            License Activated
          </h2>
          <p className="text-sm font-bold text-[#C5A059]">
            {tierDisplayName}
          </p>
          <p className="text-xs text-zinc-400 font-mono">
            Valid until: {state.validUntil}
          </p>
        </div>

        {/* Unlocked Tier Specific Features */}
        <div className="text-left bg-black/50 border border-white/5 rounded-lg p-4 space-y-2.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#C5A059]" />
            Unlocked Capabilities
          </p>
          <ul className="space-y-1.5">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                <Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-3.5 px-6 bg-[#C5A059] hover:bg-[#D4B06A] text-black font-black uppercase tracking-wider text-xs transition-all rounded-sm shadow-[0_4px_25px_rgba(197,160,89,0.35)] flex items-center justify-center gap-2 group"
          >
            <span>Start Using {tierDisplayName} Features</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
          {state.redirectTo && (
            <p className="text-[10px] text-zinc-500 font-mono mt-2">
              Resuming your session at {state.redirectTo}...
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          30% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) scale(1.2);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: floatUp 4s infinite linear;
        }
        @keyframes bounceSubtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .animate-bounce-subtle {
          animation: bounceSubtle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
