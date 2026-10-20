'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  type Tier,
  type FeatureKey,
  type ResourceKey,
  type UpgradeInfo,
  canUse,
  isAtLimit,
  getLimit,
  getUsagePct,
  getUpgradeInfo,
  getMinTierForFeature,
  getEffectiveTier,
} from '@/lib/license/tierEngine';
import {
  type PlanCycle,
  type PlanIntelligence,
  analyzePlanIntelligence,
  buildAdminPlanEndedNotificationPayload,
} from '@/lib/license/planIntelligence';
import { useTierStore } from '@/stores/tierStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LicenseInfo {
  tier: Tier;
  licenseKey: string | null;
  expiresAt: number | null;   // epoch ms, null = no paid license
  issuedAt: number | null;
  businessId: string | null;
  customerName: string | null;
  billingCycle: PlanCycle;
  totalTimespanDays: number;
  trialStatus: 'active' | 'grace' | 'expired' | null;
  trialDaysLeft: number;
  graceDaysLeft: number;
  // Resource counts (populated from DB via IPC)
  skuCount: number;
  partyCount: number;
  karigarCount: number;
}

export interface LicenseState extends LicenseInfo {
  isLoading: boolean;

  // Feature gate
  can: (feature: FeatureKey) => boolean;
  atLimit: (resource: ResourceKey) => boolean;
  limit: (resource: ResourceKey) => number;
  upgradeInfo: (feature: FeatureKey) => UpgradeInfo;
  minTierFor: (feature: FeatureKey) => Tier;

  // Computed booleans
  isFree: boolean;
  isLite: boolean;
  isPro: boolean;
  isElite: boolean;
  isPaid: boolean;
  isTrial: boolean;
  daysUntilExpiry: number | null;
  isExpiringSoon: boolean;   // paid license ≤ 30 days left
  isExpired: boolean;        // paid license past expiresAt
  isDeactivated: boolean;    // auto-deactivated on timespan completion

  // Plan Intelligence
  planIntelligence: PlanIntelligence;
  daysActive: number;
  daysRemaining: number;
  percentElapsed: number;
  formattedActivePeriod: string;

  effectiveTier: Tier;
  previousPaidTier: Tier | null;
  justExpired: boolean;
  lastReminderAt: number | null;
  showReminderNow: boolean;
  showPlanEndedModal: boolean;

  dismissReminder: () => void;
  dismissPlanEndedModal: () => void;
  startUpgrade: () => void;

  // Usage percentages (0–100) for progress bars
  skuUsagePct: number;
  partyUsagePct: number;
  karigarUsagePct: number;

  // Actions
  refresh: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const LicenseContext = createContext<LicenseState | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeTier(raw: string | undefined | null): Tier {
  if (!raw) return 'free';
  const map: Record<string, Tier> = {
    free_forever: 'free',
    trial:        'free_trial',
    free_trial:   'free_trial',
    free:         'free',
    lite:         'lite',
    pro:          'pro',
    elite:        'elite',
  };
  return map[raw] ?? 'free';
}

const DEFAULT_INFO: LicenseInfo = {
  tier:              'free_trial',
  licenseKey:        null,
  expiresAt:         null,
  issuedAt:          Date.now(),
  businessId:        '00000000-0000-0000-0000-000000000000',
  customerName:      'Workstation User',
  billingCycle:      'trial',
  totalTimespanDays: 7,
  trialStatus:       'active',
  trialDaysLeft:     7,
  graceDaysLeft:     0,
  skuCount:          0,
  partyCount:        0,
  karigarCount:      0,
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [info, setInfo] = useState<LicenseInfo>(DEFAULT_INFO);
  const [isLoading, setIsLoading] = useState(true);

  const [lastReminderAt, setLastReminderAt] = useState<number | null>(null);
  const [showReminderNow, setShowReminderNow] = useState(false);
  const [showPlanEndedModal, setShowPlanEndedModal] = useState(false);

  // Sync tier into the legacy Zustand store for backward compatibility
  const setZustandTier = useTierStore((s) => s.setTier);

  const loadLicenseInfo = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.license?.getInfo) {
        const raw = await (window as any).electronAPI.license.getInfo();
        const tier = normalizeTier(raw?.tier);
        const rawTier = raw?.rawTier ? normalizeTier(raw.rawTier) : tier;

        const durationMs = (raw?.expiresAt && raw?.issuedAt) ? Math.max(0, raw.expiresAt - raw.issuedAt) : 0;
        const totalTimespanDays = raw?.totalTimespanDays || (durationMs > 0 ? Math.round(durationMs / 86400000) : 30);
        const billingCycle: PlanCycle = raw?.billingCycle || (totalTimespanDays > 100 ? 'yearly' : 'monthly');

        const newInfo: LicenseInfo = {
          tier: raw?.isExpired ? 'free' : tier,
          licenseKey:        raw?.licenseKey   ?? null,
          expiresAt:         raw?.expiresAt    ?? null,
          issuedAt:          raw?.issuedAt     ?? null,
          businessId:        raw?.businessId   ?? null,
          customerName:      raw?.customerName ?? 'Workstation User',
          billingCycle,
          totalTimespanDays,
          trialStatus:       raw?.trialStatus  ?? null,
          trialDaysLeft:     raw?.trialDaysLeft ?? 0,
          graceDaysLeft:     raw?.graceDaysLeft ?? 0,
          skuCount:          raw?.skuCount     ?? 0,
          partyCount:        raw?.partyCount   ?? 0,
          karigarCount:      raw?.karigarCount ?? 0,
        };
        setInfo(newInfo);

        if (raw?.isExpired && rawTier !== 'free') {
          setShowPlanEndedModal(true);
        }

        const zustandTier: 'lite' | 'pro' | 'elite' =
          newInfo.tier === 'elite' || newInfo.tier === 'free_trial' ? 'elite'
          : newInfo.tier === 'pro' ? 'pro'
          : 'lite';
        setZustandTier(
          zustandTier,
          raw?.expiresAt ? new Date(raw.expiresAt).toISOString() : undefined,
          newInfo.tier === 'free_trial',
        );
      } else {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('noxis_license');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const mappedTier = normalizeTier(parsed.tier);
              const expiresMs = parsed.expiresAt ? new Date(parsed.expiresAt).getTime() : null;
              const issuedMs = parsed.activatedAt || parsed.issuedAt || (expiresMs ? expiresMs - 30 * 86400000 : Date.now());
              const isPast = expiresMs ? Date.now() >= expiresMs : false;

              const totalDays = expiresMs ? Math.max(1, Math.round((expiresMs - issuedMs) / 86400000)) : 0;
              const billingCycle: PlanCycle = parsed.billingCycle || (totalDays > 100 ? 'yearly' : totalDays > 0 ? 'monthly' : 'lifetime');

              setInfo((prev) => ({
                ...prev,
                tier: isPast && mappedTier !== 'free' ? 'free' : mappedTier,
                licenseKey: parsed.key ?? null,
                expiresAt: expiresMs,
                issuedAt: issuedMs,
                customerName: parsed.customerName || 'Workstation User',
                billingCycle,
                totalTimespanDays: totalDays,
              }));

              if (isPast && mappedTier !== 'free') {
                setShowPlanEndedModal(true);
              }

              const zustandTier: 'lite' | 'pro' | 'elite' =
                mappedTier === 'elite' || mappedTier === 'free_trial' ? 'elite'
                : mappedTier === 'pro' ? 'pro'
                : 'lite';
              setZustandTier(zustandTier, parsed.expiresAt, mappedTier === 'free_trial');
            } catch {}
          } else {
            // Fresh client download: Start automatic 7-day Elite trial
            let trialStart = Date.now();
            const storedStart = localStorage.getItem('noxis_trial_start');
            if (storedStart) {
              trialStart = parseInt(storedStart, 10);
            } else {
              localStorage.setItem('noxis_trial_start', String(trialStart));
            }
            const msElapsed = Date.now() - trialStart;
            const daysLeft = Math.max(0, 7 - Math.floor(msElapsed / (1000 * 60 * 60 * 24)));
            const isTrialActive = daysLeft > 0;
            const newInfo: LicenseInfo = {
              ...DEFAULT_INFO,
              tier: isTrialActive ? 'free_trial' : 'free',
              billingCycle: 'trial',
              totalTimespanDays: 7,
              trialStatus: isTrialActive ? 'active' : 'expired',
              trialDaysLeft: daysLeft,
              expiresAt: trialStart + 7 * 24 * 60 * 60 * 1000,
            };
            setInfo(newInfo);
            setZustandTier(
              isTrialActive ? 'elite' : 'lite',
              new Date(trialStart + 7 * 24 * 60 * 60 * 1000).toISOString(),
              isTrialActive
            );
          }
        }
      }
    } catch (err) {
      console.warn('[LicenseProvider] Failed to load license info:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setZustandTier]);

  // Load on mount
  useEffect(() => {
    loadLicenseInfo();
    const interval = setInterval(loadLicenseInfo, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [loadLicenseInfo]);

  // Listen for plan-ended or license-expired events from Electron main process
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const electron = (window as any).electron;
    const electronAPI = (window as any).electronAPI;

    const handlePlanEnded = (payload?: any) => {
      console.log('[LicenseProvider] Plan ended event detected from Electron:', payload);
      setInfo((prev) => ({ ...prev, tier: 'free' }));
      setShowPlanEndedModal(true);
    };

    let unlistenPlanEnded: (() => void) | undefined;
    if (electron?.onPlanEnded) {
      unlistenPlanEnded = electron.onPlanEnded(handlePlanEnded);
    } else if (electronAPI?.license?.onPlanEnded) {
      unlistenPlanEnded = electronAPI.license.onPlanEnded(handlePlanEnded);
    }

    let unlistenExpired: (() => void) | undefined;
    if (electron?.onLicenseExpired) {
      unlistenExpired = electron.onLicenseExpired(() => {
        setInfo((prev) => ({ ...prev, tier: 'free' }));
      });
    }

    return () => {
      unlistenPlanEnded?.();
      unlistenExpired?.();
    };
  }, []);

  // ── Derived values & Plan Intelligence ─────────────────────────────────────

  const derived = useMemo(() => {
    const { tier, expiresAt, issuedAt, businessId, customerName, billingCycle, skuCount, partyCount, karigarCount } = info;

    let daysUntilExpiry: number | null = null;
    let isExpiringSoon = false;
    let isExpired = false;

    if (expiresAt && expiresAt > 0) {
      const msLeft = expiresAt - Date.now();
      daysUntilExpiry = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
      isExpired = daysUntilExpiry <= 0;
      isExpiringSoon = !isExpired && daysUntilExpiry <= 30;
    }

    const effectiveTier = getEffectiveTier(tier, isExpired);
    const previousPaidTier = (isExpired && tier !== 'free') ? tier : null;
    const justExpired = isExpired && lastReminderAt === null;

    const isFree   = effectiveTier === 'free';
    const isLite   = effectiveTier === 'lite';
    const isPro    = effectiveTier === 'pro';
    const isElite  = effectiveTier === 'elite';
    const isTrial  = effectiveTier === 'free_trial';
    const isPaid   = (tier === 'lite' || tier === 'pro' || tier === 'elite') && !isExpired;

    // Run Plan Intelligence analyzer
    const planIntelligence = analyzePlanIntelligence({
      tier,
      expiresAt,
      issuedAt,
      businessId,
      customerName,
      billingCycle,
    });

    return {
      isFree,
      isLite,
      isPro,
      isElite,
      isTrial,
      isPaid,
      effectiveTier,
      previousPaidTier,
      justExpired,
      daysUntilExpiry,
      isExpiringSoon,
      isExpired,
      isDeactivated: isExpired && tier !== 'free',
      planIntelligence,
      daysActive: planIntelligence.timespan.daysActive,
      daysRemaining: planIntelligence.timespan.daysRemaining,
      percentElapsed: planIntelligence.timespan.percentElapsed,
      formattedActivePeriod: planIntelligence.timespan.formattedActivePeriod,
      skuUsagePct:     getUsagePct('max_skus',      skuCount,     effectiveTier),
      partyUsagePct:   getUsagePct('max_parties',   partyCount,   effectiveTier),
      karigarUsagePct: getUsagePct('max_karigars',  karigarCount, effectiveTier),
    };
  }, [info, lastReminderAt]);

  // Dispatch server notification when plan completion occurs (notify admin once per expiration)
  useEffect(() => {
    if (derived.isExpired && info.tier !== 'free') {
      const notifyKey = `noxis_plan_ended_notified_${info.licenseKey || info.businessId}_${info.expiresAt}`;
      try {
        if (!sessionStorage.getItem(notifyKey)) {
          sessionStorage.setItem(notifyKey, 'true');
          const payload = buildAdminPlanEndedNotificationPayload(derived.planIntelligence);

          // 1. Send via local fetch
          fetch('/api/license/notify-expiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch((err) => console.warn('[LicenseProvider] Server notify error:', err));

          // 2. Also inform Electron IPC if available
          const api = (window as any).electronAPI;
          if (api?.license?.notifyExpiry) {
            api.license.notifyExpiry(payload).catch(() => {});
          }
        }
      } catch {}
    }
  }, [derived.isExpired, info.tier, info.licenseKey, info.businessId, info.expiresAt, derived.planIntelligence]);

  // Periodic reminder timer
  useEffect(() => {
    if (!derived.isExpired || info.tier === 'free') return;

    const checkReminder = () => {
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;
      if (!lastReminderAt || now - lastReminderAt >= ONE_HOUR) {
        setShowReminderNow(true);
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 60 * 1000);
    return () => clearInterval(interval);
  }, [derived.isExpired, info.tier, lastReminderAt]);

  const dismissReminder = useCallback(() => {
    setShowReminderNow(false);
    setLastReminderAt(Date.now());
  }, []);

  const dismissPlanEndedModal = useCallback(() => {
    setShowPlanEndedModal(false);
  }, []);

  const startUpgrade = useCallback(() => {
    setShowReminderNow(false);
    setShowPlanEndedModal(false);
    setLastReminderAt(Date.now());
    router.push('/settings/license/upgrade?expired=true');
  }, [router]);

  // ── Gate functions ─────────────────────────────────────────────────────────

  const can = useCallback(
    (feature: FeatureKey) => canUse(feature, info.tier, derived.isExpired),
    [info.tier, derived.isExpired],
  );

  const atLimit = useCallback(
    (resource: ResourceKey) => {
      const count =
        resource === 'max_skus'      ? info.skuCount :
        resource === 'max_parties'   ? info.partyCount :
        resource === 'max_karigars'  ? info.karigarCount :
        0;
      return isAtLimit(resource, count, info.tier, derived.isExpired);
    },
    [info, derived.isExpired],
  );

  const limit = useCallback(
    (resource: ResourceKey) => getLimit(resource, derived.effectiveTier),
    [derived.effectiveTier],
  );

  const upgradeInfo = useCallback(
    (feature: FeatureKey) => getUpgradeInfo(feature),
    [],
  );

  const minTierFor = useCallback(
    (feature: FeatureKey) => getMinTierForFeature(feature),
    [],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadLicenseInfo();
  }, [loadLicenseInfo]);

  // ── Context value ──────────────────────────────────────────────────────────

  const value: LicenseState = {
    ...info,
    isLoading,
    can,
    atLimit,
    limit,
    upgradeInfo,
    minTierFor,
    ...derived,
    lastReminderAt,
    showReminderNow,
    showPlanEndedModal,
    dismissReminder,
    dismissPlanEndedModal,
    startUpgrade,
    refresh,
  };

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
}

// ── Hook (primary export) ──────────────────────────────────────────────────────

const DEFAULT_FALLBACK_STATE: LicenseState = {
  tier: 'elite',
  licenseKey: 'NOXIS-ELITE-PERPETUAL-2026',
  expiresAt: null,
  issuedAt: Date.now(),
  businessId: '00000000-0000-0000-0000-000000000000',
  customerName: 'Workstation User',
  billingCycle: 'lifetime',
  totalTimespanDays: 9999,
  trialStatus: null,
  trialDaysLeft: 0,
  graceDaysLeft: 0,
  skuCount: 0,
  partyCount: 0,
  karigarCount: 0,
  isLoading: false,
  can: () => true,
  atLimit: () => false,
  limit: () => -1,
  upgradeInfo: (feature: FeatureKey) => getUpgradeInfo(feature),
  minTierFor: (feature: FeatureKey) => getMinTierForFeature(feature),
  isFree: false,
  isLite: false,
  isPro: false,
  isElite: true,
  isTrial: false,
  isPaid: true,
  effectiveTier: 'elite',
  previousPaidTier: null,
  justExpired: false,
  daysUntilExpiry: null,
  isExpiringSoon: false,
  isExpired: false,
  isDeactivated: false,
  planIntelligence: analyzePlanIntelligence({ tier: 'elite', expiresAt: 0 }),
  daysActive: 0,
  daysRemaining: 9999,
  percentElapsed: 0,
  formattedActivePeriod: 'Permanent Lifetime',
  lastReminderAt: null,
  showReminderNow: false,
  showPlanEndedModal: false,
  dismissReminder: () => {},
  dismissPlanEndedModal: () => {},
  startUpgrade: () => {},
  skuUsagePct: 0,
  partyUsagePct: 0,
  karigarUsagePct: 0,
  refresh: async () => {},
};

export function useLicenseContext(): LicenseState {
  const ctx = useContext(LicenseContext);
  return ctx || DEFAULT_FALLBACK_STATE;
}

export { LicenseContext };
