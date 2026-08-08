'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Zap, Shield, Crown, ExternalLink, MessageCircle } from 'lucide-react';
import { useLicense } from '@/hooks/useLicense';
import { type FeatureKey, type Tier, FEATURE_MATRIX } from '@/lib/license/tierEngine';
import { cn } from '@/lib/utils';

// ── TierBadge (inline, used by UpgradeGate) ──────────────────────────────────

function GateTierBadge({ tier }: { tier: Tier }) {
  const configs: Record<Tier, { label: string; color: string; icon: React.ElementType }> = {
    free:       { label: 'Free',       color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', icon: Shield },
    free_trial: { label: 'Free Trial', color: 'text-blue-400  bg-blue-400/10  border-blue-400/20',  icon: Zap },
    lite:       { label: 'Lite',       color: 'text-gray-300  bg-gray-300/10  border-gray-300/20',  icon: Shield },
    pro:        { label: 'Pro',        color: 'text-blue-400  bg-blue-400/10  border-blue-400/20',  icon: Zap },
    elite:      { label: 'Elite',      color: 'text-[#C5A059] bg-[#C5A059]/10 border-[#C5A059]/20', icon: Crown },
  };
  const c = configs[tier] ?? configs.lite;
  const Icon = c.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest',
      c.color,
    )}>
      <Icon size={8} />
      {c.label}
    </span>
  );
}

// ── WhatsApp CTA URL ──────────────────────────────────────────────────────────

function buildWhatsAppUrl(featureTitle: string, minTier: Tier, waMsgOverride?: string): string {
  if (waMsgOverride) {
    return `https://wa.me/923264742678?text=${encodeURIComponent(waMsgOverride)}`;
  }
  const tierName = minTier.charAt(0).toUpperCase() + minTier.slice(1);
  const msg = encodeURIComponent(
    `Hi, I want to upgrade to the ${tierName} plan to use ${featureTitle}. Please share the details.`
  );
  return `https://wa.me/923264742678?text=${msg}`;
}

// ── Lock Card (shared between replace & overlay variants) ─────────────────────

function UpgradeCard({
  featureTitle,
  reason,
  minTier,
  ctaLabel,
  waMsg,
  compact = false,
}: {
  featureTitle: string;
  reason: string;
  minTier: Tier;
  ctaLabel?: string;
  waMsg?: string;
  compact?: boolean;
}) {
  const waUrl = buildWhatsAppUrl(featureTitle, minTier, waMsg);
  return (
    <div className={cn(
      'flex flex-col items-center text-center gap-3 bg-[#0A0C10] border border-white/[0.08] rounded-sm',
      compact ? 'p-4' : 'p-8 max-w-md mx-auto',
    )}>
      <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center">
        <Lock size={20} className="text-slate-400" />
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
          Feature Paused
        </p>
        <h3 className="text-sm font-black text-white uppercase tracking-tight">
          {featureTitle}
        </h3>
        <div className="flex justify-center mt-1">
          <GateTierBadge tier={minTier} />
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
        {reason}
      </p>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#25D366] text-black rounded-sm text-xs font-black uppercase tracking-wider hover:bg-[#22C05D] transition-colors"
        >
          <MessageCircle size={13} />
          {ctaLabel || 'Upgrade via WhatsApp'}
        </a>
        <Link
          href="/settings/license"
          className="w-full flex items-center justify-center gap-1.5 py-2 px-4 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors"
        >
          Compare Plans <ExternalLink size={10} />
        </Link>
      </div>
    </div>
  );
}

// ── UpgradeGate ───────────────────────────────────────────────────────────────

interface UpgradeGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  /** 
   * replace  — replaces children with full lock card (default)
   * overlay  — blurs children and overlays the lock card on top
   * button   — renders children + a small "Upgrade" button beneath
   */
  variant?: 'replace' | 'overlay' | 'button';
  /** Skip the gate entirely (e.g. admin bypass) */
  bypass?: boolean;
}

export function UpgradeGate({
  feature,
  children,
  variant = 'replace',
  bypass = false,
}: UpgradeGateProps) {
  const { can, upgradeInfo, previousPaidTier, isExpired } = useLicense();

  // Pass-through if allowed or bypassed
  if (bypass || can(feature)) {
    return <>{children}</>;
  }

  const info = upgradeInfo(feature);

  const hadFeatureBefore =
    isExpired && previousPaidTier &&
    FEATURE_MATRIX[feature]?.[previousPaidTier];

  const expiredTierName = previousPaidTier
    ? previousPaidTier.charAt(0).toUpperCase() + previousPaidTier.slice(1)
    : info.minTier.charAt(0).toUpperCase() + info.minTier.slice(1);

  const title = hadFeatureBefore
    ? `${info.title} — Paused`
    : info.title;

  const reason = hadFeatureBefore
    ? `This ${expiredTierName} feature is paused while you are on Free plan. Renew your ${expiredTierName} license to restore it immediately.`
    : info.reason;

  const ctaLabel = hadFeatureBefore
    ? `Renew ${expiredTierName} to restore`
    : `Upgrade to ${info.minTier}`;

  const waMsg = hadFeatureBefore
    ? `I want to renew my Noxis Hub ${expiredTierName} license to restore ${info.title}`
    : `I want to upgrade to Noxis Hub ${info.minTier} to get ${info.title}`;

  if (variant === 'overlay') {
    return (
      <div className="relative">
        {/* Blurred children */}
        <div
          className="pointer-events-none select-none"
          style={{ opacity: 0.3, filter: 'blur(2px) saturate(0)' } as React.CSSProperties}
          aria-hidden="true"
        >
          {children}
        </div>

        {/* Centered upgrade card */}
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#070809]/60">
          <UpgradeCard
            featureTitle={title}
            reason={reason}
            minTier={info.minTier}
            ctaLabel={ctaLabel}
            waMsg={waMsg}
            compact
          />
        </div>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <div className="space-y-3">
        {children}
        <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-sm">
          <Lock size={12} className="text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400 flex-1">{reason}</p>
          <a
            href={buildWhatsAppUrl(title, info.minTier, waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-3 py-1.5 bg-[#25D366] text-black rounded-sm text-[10px] font-black uppercase tracking-wider hover:bg-[#22C05D] transition-colors"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    );
  }

  // Default: replace
  return (
    <div className="w-full py-10 px-4">
      <UpgradeCard
        featureTitle={title}
        reason={reason}
        minTier={info.minTier}
        ctaLabel={ctaLabel}
        waMsg={waMsg}
      />
    </div>
  );
}
