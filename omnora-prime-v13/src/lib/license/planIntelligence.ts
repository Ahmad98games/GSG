/**
 * Plan Intelligence & Lifecycle Engine
 *
 * Self-detecting intelligence system for user licenses:
 * - Detects user identity, tier, billing cycle (monthly vs yearly vs lifetime vs trial)
 * - Calculates active timespan, days elapsed, and days remaining
 * - Flags automatic deactivation when plan completes
 * - Generates tailored upgrade recommendations and admin notification payloads
 */

import { type Tier } from './tierEngine';

export type PlanCycle = 'monthly' | 'yearly' | 'lifetime' | 'trial' | 'free';

export type PlanLifecycleStatus = 
  | 'active'              // Healthy (> 7 days remaining)
  | 'expiring_soon'       // Upcoming renewal window (3 to 7 days remaining)
  | 'critical_urgency'    // Final countdown (≤ 2 days remaining)
  | 'expired_deactivated'; // Timespan completed, premium features deactivated

export interface PlanUserIdentity {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  hwid?: string | null;
}

export interface PlanTimespan {
  activatedAt: number;        // epoch ms
  expiresAt: number | null;   // epoch ms, null/0 for lifetime
  totalTimespanDays: number;  // total lifespan of the plan (e.g. 30, 365)
  daysActive: number;         // days elapsed since plan start
  daysRemaining: number;      // days remaining (0 or negative if expired)
  hoursRemaining: number;     // hours remaining
  percentElapsed: number;     // 0 to 100
  formattedActivePeriod: string; // e.g. "Oct 1, 2026 – Oct 31, 2026"
}

export interface PlanUpgradeProposal {
  headline: string;
  reason: string;
  recommendedTier: Tier;
  recommendedCycle: 'monthly' | 'yearly' | 'lifetime';
  discountPct: number;
  renewalPricePKR: number;
  renewalPriceText: string;
  renewalUrl: string;
  whatsappMessage: string;
}

export interface PlanIntelligence {
  user: PlanUserIdentity;
  tier: Tier;
  effectiveTier: Tier;
  billingCycle: PlanCycle;
  billingCycleLabel: string;
  timespan: PlanTimespan;
  status: PlanLifecycleStatus;
  isExpired: boolean;
  isDeactivated: boolean;
  deactivationReason: string | null;
  upgradeProposal: PlanUpgradeProposal;
}

// ── Price Constants ──────────────────────────────────────────────────────────

export const PLAN_PRICING = {
  lite: {
    monthly: 1999,
    yearly: 18000,
    lifetime: 72000,
  },
  pro: {
    monthly: 4999,
    yearly: 45000,
    lifetime: 135000,
  },
  elite: {
    monthly: 9999,
    yearly: 90000,
    lifetime: 225000,
  },
} as const;

export const ADMIN_WHATSAPP_NUMBER = '923264742678'; // Omnora Support Desk

// ── Cycle Auto-Detection ─────────────────────────────────────────────────────

export function detectBillingCycle(
  tier: Tier,
  issuedAt: number | null,
  expiresAt: number | null,
  explicitCycle?: string | null
): PlanCycle {
  if (tier === 'free') return 'free';
  if (tier === 'free_trial') return 'trial';

  if (explicitCycle) {
    const norm = explicitCycle.toLowerCase();
    if (norm.includes('month')) return 'monthly';
    if (norm.includes('year') || norm.includes('annual')) return 'yearly';
    if (norm.includes('life') || norm.includes('perm')) return 'lifetime';
    if (norm.includes('trial')) return 'trial';
  }

  if (!expiresAt || expiresAt === 0) {
    return 'lifetime';
  }

  const start = issuedAt || (expiresAt - 30 * 24 * 60 * 60 * 1000);
  const totalDurationMs = Math.max(0, expiresAt - start);
  const totalDays = Math.round(totalDurationMs / (24 * 60 * 60 * 1000));

  if (totalDays <= 12) return 'trial';
  if (totalDays >= 13 && totalDays <= 45) return 'monthly';
  if (totalDays >= 300 && totalDays <= 400) return 'yearly';
  if (totalDays > 400) return 'lifetime';

  return 'monthly'; // fallback default for recurring subscriptions
}

export function getBillingCycleLabel(cycle: PlanCycle): string {
  switch (cycle) {
    case 'monthly':  return 'Monthly Subscription';
    case 'yearly':   return 'Annual Subscription';
    case 'lifetime': return 'Permanent Lifetime';
    case 'trial':    return '7-Day Free Trial';
    case 'free':     return 'Free Forever Mode';
  }
}

// ── Date and Timespan Helpers ────────────────────────────────────────────────

export function formatDatePk(ts: number | null): string {
  if (!ts) return 'Indefinite';
  try {
    return new Intl.DateTimeFormat('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

// ── Core Intelligence Analyzer ───────────────────────────────────────────────

export interface RawLicenseContext {
  tier?: Tier | string | null;
  licenseKey?: string | null;
  issuedAt?: number | null;
  expiresAt?: number | null;
  businessId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  hwid?: string | null;
  billingCycle?: string | null;
  trialStatus?: 'active' | 'grace' | 'expired' | null;
}

export function analyzePlanIntelligence(raw: RawLicenseContext): PlanIntelligence {
  const now = Date.now();
  const rawTier = (raw.tier || 'free') as string;
  const tier: Tier = 
    rawTier === 'elite' ? 'elite' :
    rawTier === 'pro' ? 'pro' :
    rawTier === 'lite' ? 'lite' :
    rawTier === 'free_trial' || rawTier === 'trial' ? 'free_trial' :
    'free';

  const user: PlanUserIdentity = {
    id: raw.businessId || '00000000-0000-0000-0000-000000000000',
    name: raw.customerName || 'Workstation User',
    email: raw.customerEmail || null,
    phone: raw.customerPhone || null,
    hwid: raw.hwid || null,
  };

  const billingCycle = detectBillingCycle(
    tier,
    raw.issuedAt || null,
    raw.expiresAt || null,
    raw.billingCycle
  );
  const billingCycleLabel = getBillingCycleLabel(billingCycle);

  // Expiration detection
  const hasExpiry = raw.expiresAt !== null && raw.expiresAt !== undefined && raw.expiresAt > 0;
  const expiresAt = hasExpiry ? Number(raw.expiresAt) : null;
  const activatedAt = raw.issuedAt && raw.issuedAt > 0 
    ? Number(raw.issuedAt)
    : (expiresAt ? expiresAt - (billingCycle === 'yearly' ? 365 : 30) * 86400000 : now);

  const isExpired = Boolean(expiresAt && now >= expiresAt);
  const effectiveTier: Tier = isExpired && tier !== 'free' ? 'free' : tier;
  const isDeactivated = isExpired && tier !== 'free';

  // Timespan calculations
  const totalTimespanMs = expiresAt ? Math.max(1, expiresAt - activatedAt) : 0;
  const totalTimespanDays = expiresAt ? Math.max(1, Math.round(totalTimespanMs / 86400000)) : 0;
  const msElapsed = Math.max(0, now - activatedAt);
  const daysActive = Math.min(totalTimespanDays || 9999, Math.floor(msElapsed / 86400000));
  
  const msRemaining = expiresAt ? expiresAt - now : 999999999;
  const daysRemaining = expiresAt ? Math.ceil(msRemaining / 86400000) : 9999;
  const hoursRemaining = expiresAt ? Math.max(0, Math.ceil(msRemaining / 3600000)) : 9999;

  let percentElapsed = 0;
  if (totalTimespanMs > 0) {
    percentElapsed = Math.min(100, Math.max(0, Math.round((msElapsed / totalTimespanMs) * 100)));
    if (isExpired) percentElapsed = 100;
  }

  const formattedActivePeriod = expiresAt
    ? `${formatDatePk(activatedAt)} – ${formatDatePk(expiresAt)}`
    : `Activated ${formatDatePk(activatedAt)} (Permanent)`;

  // Lifecycle status
  let status: PlanLifecycleStatus = 'active';
  if (isExpired || isDeactivated) {
    status = 'expired_deactivated';
  } else if (daysRemaining <= 2) {
    status = 'critical_urgency';
  } else if (daysRemaining <= 7) {
    status = 'expiring_soon';
  }

  // Deactivation reason
  const deactivationReason = isDeactivated
    ? `Your ${tier.toUpperCase()} ${billingCycleLabel} of ${totalTimespanDays} days completed on ${formatDatePk(expiresAt)}. The software has automatically paused premium cloud, multi-device, and AI features.`
    : null;

  // Upgrade & Renewal Proposal
  const upgradeProposal = buildUpgradeProposal(user, tier, billingCycle, totalTimespanDays, expiresAt);

  return {
    user,
    tier,
    effectiveTier,
    billingCycle,
    billingCycleLabel,
    timespan: {
      activatedAt,
      expiresAt,
      totalTimespanDays,
      daysActive,
      daysRemaining,
      hoursRemaining,
      percentElapsed,
      formattedActivePeriod,
    },
    status,
    isExpired,
    isDeactivated,
    deactivationReason,
    upgradeProposal,
  };
}

// ── Smart Upgrade Proposal Builder ───────────────────────────────────────────

function buildUpgradeProposal(
  user: PlanUserIdentity,
  currentTier: Tier,
  cycle: PlanCycle,
  timespanDays: number,
  expiresAt: number | null
): PlanUpgradeProposal {
  const tierName = currentTier === 'elite' ? 'Elite' : currentTier === 'pro' ? 'Pro' : 'Lite';

  // Strategy 1: If user was on Monthly, offer Yearly renewal at 25% discount
  if (cycle === 'monthly') {
    const targetTier = currentTier === 'free' ? 'pro' : currentTier;
    const yearlyPrice = PLAN_PRICING[targetTier as keyof typeof PLAN_PRICING]?.yearly || 45000;
    const monthlyPrice = PLAN_PRICING[targetTier as keyof typeof PLAN_PRICING]?.monthly || 4999;

    const message = encodeURIComponent(
      `Assalam o Alaikum Omnora Support,\n\n` +
      `My monthly plan for Noxis Hub has ended and I want to renew/upgrade:\n` +
      `• User/Business: ${user.name}\n` +
      `• Tier: ${tierName}\n` +
      `• Previous Plan: Monthly (${timespanDays} Days)\n` +
      `• Expired On: ${formatDatePk(expiresAt)}\n` +
      `• Target Renewal: ${tierName} Annual Plan (PKR ${yearlyPrice.toLocaleString()}) or Monthly (PKR ${monthlyPrice.toLocaleString()})\n\n` +
      `Please provide the payment instructions to activate immediately.`
    );

    return {
      headline: `Renew Your ${tierName} Plan`,
      reason: `Your 30-day monthly plan completed. Upgrade to Annual and save 25% on your renewal!`,
      recommendedTier: targetTier,
      recommendedCycle: 'yearly',
      discountPct: 25,
      renewalPricePKR: yearlyPrice,
      renewalPriceText: `PKR ${yearlyPrice.toLocaleString()}/yr (Save 25%) or PKR ${monthlyPrice.toLocaleString()}/mo`,
      renewalUrl: `/settings/license/upgrade?tier=${targetTier}&cycle=annual`,
      whatsappMessage: message,
    };
  }

  // Strategy 2: If user was on Yearly, offer Annual renewal or Elite Lifetime
  if (cycle === 'yearly') {
    const yearlyPrice = PLAN_PRICING[currentTier as keyof typeof PLAN_PRICING]?.yearly || 45000;
    const message = encodeURIComponent(
      `Assalam o Alaikum Omnora Support,\n\n` +
      `My annual plan for Noxis Hub has reached its renewal date:\n` +
      `• User/Business: ${user.name}\n` +
      `• Tier: ${tierName}\n` +
      `• Expired On: ${formatDatePk(expiresAt)}\n` +
      `• Request: Renew Annual Subscription (PKR ${yearlyPrice.toLocaleString()})\n\n` +
      `Please provide renewal invoice.`
    );

    return {
      headline: `Renew Your Annual ${tierName} Subscription`,
      reason: `Your 365-day annual timespan has concluded. Renew to keep priority cloud backup, multi-branch, and CCTV active without interruption.`,
      recommendedTier: currentTier,
      recommendedCycle: 'yearly',
      discountPct: 15,
      renewalPricePKR: yearlyPrice,
      renewalPriceText: `PKR ${yearlyPrice.toLocaleString()}/year`,
      renewalUrl: `/settings/license/upgrade?tier=${currentTier}&cycle=annual`,
      whatsappMessage: message,
    };
  }

  // Strategy 3: Default fallback
  const proMonthly = PLAN_PRICING.pro.monthly;
  const message = encodeURIComponent(
    `Assalam o Alaikum Omnora Support,\n\n` +
    `I am on the Free Forever plan for Noxis Hub and want to upgrade to Pro:\n` +
    `• User/Business: ${user.name}\n` +
    `• Desired Tier: Pro Plan\n\n` +
    `Please share payment details.`
  );

  return {
    headline: 'Upgrade to Noxis Pro',
    reason: 'Unlock unlimited SKUs, WhatsApp invoices, Karigar payroll, and Cloud Sync.',
    recommendedTier: 'pro',
    recommendedCycle: 'monthly',
    discountPct: 0,
    renewalPricePKR: proMonthly,
    renewalPriceText: `PKR ${proMonthly.toLocaleString()}/month`,
    renewalUrl: `/settings/license/upgrade?tier=pro`,
    whatsappMessage: message,
  };
}

export function buildWhatsAppRenewalUrl(proposal: PlanUpgradeProposal): string {
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${proposal.whatsappMessage}`;
}

export function buildAdminPlanEndedNotificationPayload(plan: PlanIntelligence) {
  return {
    event: 'plan_ended',
    licenseKey: (plan as any).licenseKey || null,
    customerName: plan.user.name,
    customerEmail: plan.user.email,
    customerPhone: plan.user.phone,
    businessId: plan.user.id,
    hwid: plan.user.hwid,
    tier: plan.tier,
    billingCycle: plan.billingCycle,
    totalTimespanDays: plan.timespan.totalTimespanDays,
    activatedAt: plan.timespan.activatedAt,
    expiresAt: plan.timespan.expiresAt,
    deactivatedAt: Date.now(),
    message: `User plan ended: ${plan.user.name} (${plan.tier.toUpperCase()} · ${plan.billingCycleLabel}) timespan completed on ${formatDatePk(plan.timespan.expiresAt)}. Software auto-deactivated to Free mode.`,
  };
}
