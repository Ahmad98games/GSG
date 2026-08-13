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
import { useTierStore } from '@/stores/tierStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LicenseInfo {
  tier: Tier;
  licenseKey: string | null;
  expiresAt: number | null;   // epoch ms, null = no paid license
  issuedAt: number | null;
  businessId: string | null;
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

  effectiveTier: Tier;
  previousPaidTier: Tier | null;
  justExpired: boolean;
  lastReminderAt: number | null;
  showReminderNow: boolean;

  dismissReminder: () => void;
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

/**
 * Map the raw IPC tier string (from electron/services/tierEngine) to the
 * renderer Tier type. 'free_forever' → 'free', 'trial' → 'free_trial'.
 */
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
  tier:          'elite',
  licenseKey:    'NOXIS-ELITE-PERPETUAL-2026',
  expiresAt:     null,
  issuedAt:      Date.now(),
  businessId:    '00000000-0000-0000-0000-000000000000',
  trialStatus:   null,
  trialDaysLeft: 0,
  graceDaysLeft: 0,
  skuCount:      0,
  partyCount:    0,
  karigarCount:  0,
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [info, setInfo] = useState<LicenseInfo>(DEFAULT_INFO);
  const [isLoading, setIsLoading] = useState(true);

  const [lastReminderAt, setLastReminderAt] = useState<number | null>(null);
  const [showReminderNow, setShowReminderNow] = useState(false);

  // Sync tier into the legacy Zustand store for backward compatibility
  const setZustandTier = useTierStore((s) => s.setTier);

  const loadLicenseInfo = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.license?.getInfo) {
        const raw = await (window as any).electronAPI.license.getInfo();
        const tier = normalizeTier(raw?.tier);

        const newInfo: LicenseInfo = {
          tier,
          licenseKey:    raw?.licenseKey   ?? null,
          expiresAt:     raw?.expiresAt    ?? null,
          issuedAt:      raw?.issuedAt     ?? null,
          businessId:    raw?.businessId   ?? null,
          trialStatus:   raw?.trialStatus  ?? null,
          trialDaysLeft: raw?.trialDaysLeft ?? 0,
          graceDaysLeft: raw?.graceDaysLeft ?? 0,
          skuCount:      raw?.skuCount     ?? 0,
          partyCount:    raw?.partyCount   ?? 0,
          karigarCount:  raw?.karigarCount ?? 0,
        };
        setInfo(newInfo);

        const zustandTier: 'lite' | 'pro' | 'elite' =
          tier === 'elite' ? 'elite'
          : tier === 'pro' ? 'pro'
          : 'lite';
        setZustandTier(
          zustandTier,
          raw?.expiresAt ? new Date(raw.expiresAt).toISOString() : undefined,
          tier === 'free_trial',
        );
      } else {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('noxis_license');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setInfo((prev) => ({
                ...prev,
                tier: normalizeTier(parsed.tier),
                licenseKey: parsed.key ?? null,
                expiresAt: parsed.expiresAt
                  ? new Date(parsed.expiresAt).getTime()
                  : null,
              }));
            } catch {}
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

    const interval = setInterval(loadLicenseInfo, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadLicenseInfo]);

  // Listen for license-expired event from Electron main process
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const electron = (window as any).electron;
    if (!electron?.onLicenseExpired) return;
    const unlisten = electron.onLicenseExpired(() => {
      setInfo((prev) => ({ ...prev, tier: 'free' }));
    });
    return () => unlisten?.();
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────

  const derived = useMemo(() => {
    const { tier, expiresAt, skuCount, partyCount, karigarCount } = info;

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
      skuUsagePct:     getUsagePct('max_skus',      skuCount,     effectiveTier),
      partyUsagePct:   getUsagePct('max_parties',   partyCount,   effectiveTier),
      karigarUsagePct: getUsagePct('max_karigars',  karigarCount, effectiveTier),
    };
  }, [info, lastReminderAt]);

  // Hourly reminder timer
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

  const startUpgrade = useCallback(() => {
    setShowReminderNow(false);
    setLastReminderAt(Date.now());
    router.push('/settings/license?upgrade=true');
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
    dismissReminder,
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
  lastReminderAt: null,
  showReminderNow: false,
  dismissReminder: () => {},
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
