'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLicense } from '@/hooks/useLicense';
import { Sparkles, Zap, Clock, AlertCircle, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrialCountdownBannerProps {
  isCollapsed?: boolean;
}

/**
 * Sidebar Footer Trial Countdown Chip
 * Renders in IndustrialSidebar footer during active 14-day trial
 */
export function TrialCountdownBanner({ isCollapsed = false }: TrialCountdownBannerProps) {
  const router = useRouter();
  const { isTrial, trialDaysLeft, tier, effectiveTier } = useLicense();

  // Only render during active trial
  const isTrialActive = isTrial || effectiveTier === 'free_trial';
  if (!isTrialActive) return null;

  const daysLeft = Math.max(0, trialDaysLeft);

  // DAYS 13-14 (Strong Urgency / Trial End)
  if (daysLeft <= 1) {
    return (
      <div className={cn("px-2 py-2", isCollapsed && "flex justify-center")}>
        <button
          type="button"
          onClick={() => router.push('/settings/license?upgrade=true')}
          title="Last day of Elite access — Click to upgrade"
          className={cn(
            "w-full text-left transition-all duration-300 rounded-sm border",
            "bg-red-500/15 border-red-500/40 hover:bg-red-500/25 hover:border-red-400 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.2)]",
            isCollapsed ? "p-2 flex items-center justify-center" : "px-3 py-2 flex items-center gap-2"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping flex-shrink-0" />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-red-200 truncate">
                🔴 Last day of Elite access
              </p>
              <p className="text-[9px] text-red-400/90 font-mono truncate">
                Keep all features active →
              </p>
            </div>
          )}
        </button>
      </div>
    );
  }

  // DAY 12 (Second urgency signal: 2 days left with pulsing glow)
  if (daysLeft === 2) {
    return (
      <div className={cn("px-2 py-2", isCollapsed && "flex justify-center")}>
        <button
          type="button"
          onClick={() => router.push('/settings/license?upgrade=true')}
          title="2 days left — Click to keep features"
          className={cn(
            "w-full text-left transition-all duration-300 rounded-sm border relative overflow-hidden animate-pulse-subtle",
            "bg-orange-500/15 border-orange-500/40 hover:bg-orange-500/25 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.25)] ring-1 ring-orange-500/30",
            isCollapsed ? "p-2 flex items-center justify-center" : "px-3 py-2 flex items-center gap-2"
          )}
        >
          <Clock className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 animate-spin-slow" />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-orange-200 truncate">
                ⏰ 2 days left — keep features
              </p>
              <p className="text-[9px] text-orange-400/80 font-mono truncate">
                View permanent upgrade
              </p>
            </div>
          )}
        </button>
      </div>
    );
  }

  // DAY 11 (First urgency signal: 3 days remain)
  if (daysLeft === 3) {
    return (
      <div className={cn("px-2 py-2", isCollapsed && "flex justify-center")}>
        <button
          type="button"
          onClick={() => router.push('/settings/license?upgrade=true')}
          title="3 days of Elite remain"
          className={cn(
            "w-full text-left transition-all duration-200 rounded-sm border",
            "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-300",
            isCollapsed ? "p-2 flex items-center justify-center" : "px-3 py-2 flex items-center gap-2"
          )}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-200 truncate">
                ⚡ 3 days of Elite remain
              </p>
              <p className="text-[9px] text-amber-400/70 font-mono truncate">
                Click to explore plans
              </p>
            </div>
          )}
        </button>
      </div>
    );
  }

  // DAYS 1-10 (Early trial — curiosity)
  return (
    <div className={cn("px-2 py-2", isCollapsed && "flex justify-center")}>
      <button
        type="button"
        onClick={() => router.push('/settings/license?upgrade=true')}
        title={`Elite Trial — ${daysLeft} days left`}
        className={cn(
          "w-full text-left transition-all duration-200 rounded-sm border",
          "bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-300",
          isCollapsed ? "p-2 flex items-center justify-center" : "px-3 py-1.5 flex items-center gap-2"
        )}
      >
        <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0" />
        {!isCollapsed && (
          <div className="min-w-0 flex-1 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 truncate">
              ✦ Elite Trial — {daysLeft} days left
            </span>
            <span className="text-[8px] font-mono text-emerald-400/60 bg-emerald-500/10 px-1 py-0.5 rounded">
              Active
            </span>
          </div>
        )}
      </button>
    </div>
  );
}

/**
 * Non-blocking Top Bar Banner for Days 13 and 14
 * Positioned under navbar without blocking the POS or user workflow.
 */
export function TopUrgencyBanner() {
  const router = useRouter();
  const { isTrial, trialDaysLeft, effectiveTier } = useLicense();
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('noxis_top_banner_dismissed_until');
      if (stored) {
        setDismissedUntil(parseInt(stored, 10));
      }
    } catch {}
  }, []);

  const isTrialActive = isTrial || effectiveTier === 'free_trial';
  if (!isTrialActive) return null;

  const daysLeft = Math.max(0, trialDaysLeft);

  // Only shows on Day 13 and Day 14 (<= 1 day left)
  if (daysLeft > 1) return null;

  const isDay14 = daysLeft === 0;
  const now = Date.now();

  // Day 13 is dismissible for 4 hours; Day 14 CANNOT be dismissed today
  if (!isDay14 && dismissedUntil && now < dismissedUntil) {
    return null;
  }

  const handleDismiss = () => {
    if (isDay14) return; // Cannot dismiss on trial end day
    const fourHoursFromNow = Date.now() + 4 * 60 * 60 * 1000;
    setDismissedUntil(fourHoursFromNow);
    try {
      localStorage.setItem('noxis_top_banner_dismissed_until', fourHoursFromNow.toString());
    } catch {}
  };

  return (
    <div className="w-full bg-[#120B0B] border-b border-red-500/30 px-4 py-2.5 flex items-center justify-between z-[40] transition-all duration-300">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        <div>
          {isDay14 ? (
            <p className="text-xs font-bold text-red-200">
              Elite trial ends today at midnight. <span className="text-red-400 font-normal">Upgrade now to keep all features active.</span>
            </p>
          ) : (
            <p className="text-xs font-bold text-red-200">
              🔴 Elite trial ends tomorrow. <span className="text-red-400 font-normal">Your POS, CCTV, Mobile Companion, and Foresight AI will pause.</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/settings/license?upgrade=true"
          className="px-3 py-1 bg-red-500 hover:bg-red-400 text-black text-[10px] font-black uppercase tracking-wider rounded-sm transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] flex items-center gap-1"
        >
          <span>Upgrade</span>
          <ArrowRight size={11} />
        </Link>

        {!isDay14 && (
          <button
            type="button"
            onClick={handleDismiss}
            title="Dismiss for 4 hours"
            className="p-1 text-red-400 hover:text-white rounded hover:bg-white/5 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
