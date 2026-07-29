/**
 * Tier Capability Engine
 *
 * Single source of truth for what each tier/trial state can do.
 * All IPC handlers and RBAC checks consult canUse() — never the renderer.
 *
 * Tier hierarchy: trial < free_forever < lite < pro < elite
 *
 * Feature keys are string constants — add new ones here first.
 */

import { getActiveLicensePayload, type LicenseTier } from './licenseVerifier'
import { getTrialState, type TrialStatus } from './trialEngine'

// ── Feature Key Registry ──────────────────────────────────────────────────────

export const FEATURES = {
  // Core POS
  POS:                  'pos',
  // Inventory
  INVENTORY:            'inventory',
  // Invoicing
  INVOICES:             'invoices',
  RECURRING_INVOICES:   'recurring_invoices',
  // Parties / Ledger
  PARTIES:              'parties',
  KHATA:                'khata',
  // Cloud sync
  CLOUD_SYNC:           'cloud_sync',
  // Mobile RBAC pairing
  MOBILE_PAIRING:       'mobile_pairing',
  MOBILE_MULTI_DEVICE:  'mobile_multi_device',   // > 1 device
  // CCTV
  CCTV:                 'cctv',
  CCTV_MULTI_CAM:       'cctv_multi_cam',        // > 1 camera
  // AI / Foresight
  FORESIGHT_AI:         'foresight_ai',
  // Reporting
  REPORTS_BASIC:        'reports_basic',
  REPORTS_ADVANCED:     'reports_advanced',
  // Branches
  BRANCHES:             'branches',
  MULTI_BRANCH:         'multi_branch',
  // Payroll
  PAYROLL:              'payroll',
  // Purchase orders
  PURCHASE_ORDERS:      'purchase_orders',
  // Audit log
  AUDIT_LOG:            'audit_log',
  // Auto-updater priority
  BETA_UPDATES:         'beta_updates',
} as const

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES]

// ── Tier Feature Matrix ───────────────────────────────────────────────────────
// Each tier gets all features listed for it (not cumulative — explicitly listed per tier)

const TIER_FEATURES: Record<LicenseTier | 'free_forever' | 'trial', FeatureKey[]> = {
  trial: [
    FEATURES.POS,
    FEATURES.INVENTORY,
    FEATURES.INVOICES,
    FEATURES.PARTIES,
    FEATURES.KHATA,
    FEATURES.CLOUD_SYNC,
    FEATURES.MOBILE_PAIRING,
    FEATURES.MOBILE_MULTI_DEVICE,
    FEATURES.CCTV,
    FEATURES.CCTV_MULTI_CAM,
    FEATURES.FORESIGHT_AI,
    FEATURES.REPORTS_BASIC,
    FEATURES.REPORTS_ADVANCED,
    FEATURES.BRANCHES,
    FEATURES.PURCHASE_ORDERS,
    FEATURES.AUDIT_LOG,
  ],

  // After 17 days — POS stays, everything cloud/AI locked, caps enforced
  free_forever: [
    FEATURES.POS,
    FEATURES.INVENTORY,          // capped at 200 SKUs
    FEATURES.INVOICES,
    FEATURES.PARTIES,            // capped at 50 parties
    FEATURES.KHATA,
    FEATURES.REPORTS_BASIC,
    FEATURES.PURCHASE_ORDERS,
  ],

  lite: [
    FEATURES.POS,
    FEATURES.INVENTORY,
    FEATURES.INVOICES,
    FEATURES.RECURRING_INVOICES,
    FEATURES.PARTIES,
    FEATURES.KHATA,
    FEATURES.CLOUD_SYNC,
    FEATURES.MOBILE_PAIRING,     // 1 device only
    FEATURES.REPORTS_BASIC,
    FEATURES.PURCHASE_ORDERS,
    FEATURES.AUDIT_LOG,
  ],

  pro: [
    FEATURES.POS,
    FEATURES.INVENTORY,
    FEATURES.INVOICES,
    FEATURES.RECURRING_INVOICES,
    FEATURES.PARTIES,
    FEATURES.KHATA,
    FEATURES.CLOUD_SYNC,
    FEATURES.MOBILE_PAIRING,
    FEATURES.MOBILE_MULTI_DEVICE,
    FEATURES.CCTV,
    FEATURES.REPORTS_BASIC,
    FEATURES.REPORTS_ADVANCED,
    FEATURES.BRANCHES,
    FEATURES.PAYROLL,
    FEATURES.PURCHASE_ORDERS,
    FEATURES.AUDIT_LOG,
  ],

  elite: [
    FEATURES.POS,
    FEATURES.INVENTORY,
    FEATURES.INVOICES,
    FEATURES.RECURRING_INVOICES,
    FEATURES.PARTIES,
    FEATURES.KHATA,
    FEATURES.CLOUD_SYNC,
    FEATURES.MOBILE_PAIRING,
    FEATURES.MOBILE_MULTI_DEVICE,
    FEATURES.CCTV,
    FEATURES.CCTV_MULTI_CAM,
    FEATURES.FORESIGHT_AI,
    FEATURES.REPORTS_BASIC,
    FEATURES.REPORTS_ADVANCED,
    FEATURES.BRANCHES,
    FEATURES.MULTI_BRANCH,
    FEATURES.PAYROLL,
    FEATURES.PURCHASE_ORDERS,
    FEATURES.AUDIT_LOG,
    FEATURES.BETA_UPDATES,
  ],
}

// ── Caps per tier ─────────────────────────────────────────────────────────────

export interface TierCaps {
  maxDevices: number   // -1 = unlimited
  maxBranches: number
  maxCameras: number
  maxSkus: number      // -1 = unlimited
  maxParties: number   // -1 = unlimited
}

const TIER_CAPS: Record<LicenseTier | 'free_forever' | 'trial', TierCaps> = {
  trial:        { maxDevices: 5,  maxBranches: 1, maxCameras: 4,  maxSkus: -1,  maxParties: -1  },
  free_forever: { maxDevices: 1,  maxBranches: 1, maxCameras: 0,  maxSkus: 200, maxParties: 50  },
  lite:         { maxDevices: 2,  maxBranches: 1, maxCameras: 1,  maxSkus: -1,  maxParties: -1  },
  pro:          { maxDevices: 10, maxBranches: 3, maxCameras: 8,  maxSkus: -1,  maxParties: -1  },
  elite:        { maxDevices: -1, maxBranches: -1, maxCameras: -1, maxSkus: -1, maxParties: -1  },
}

// ── Active Tier Resolution ────────────────────────────────────────────────────

export type ActiveTierName = LicenseTier | 'free_forever' | 'trial'

export interface TierInfo {
  name: ActiveTierName
  caps: TierCaps
  trialStatus?: TrialStatus
  trialDaysLeft?: number
  graceDaysLeft?: number
  maxDevices: number
  maxBranches: number
  maxCameras: number
  features: FeatureKey[]
}

export function getActiveTierInfo(): TierInfo {
  // Check for active paid license first
  const license = getActiveLicensePayload()

  if (license) {
    const name = license.tier
    const matrixCaps = TIER_CAPS[name]

    // License payload overrides matrix caps (explicit per-customer settings)
    const caps: TierCaps = {
      maxDevices:  license.maxDevices  > 0 ? license.maxDevices  : matrixCaps.maxDevices,
      maxBranches: license.maxBranches > 0 ? license.maxBranches : matrixCaps.maxBranches,
      maxCameras:  license.maxCameras  > 0 ? license.maxCameras  : matrixCaps.maxCameras,
      maxSkus:     matrixCaps.maxSkus,
      maxParties:  matrixCaps.maxParties,
    }

    return {
      name,
      caps,
      maxDevices:  caps.maxDevices,
      maxBranches: caps.maxBranches,
      maxCameras:  caps.maxCameras,
      features:    TIER_FEATURES[name],
    }
  }

  // No paid license — resolve from trial state
  const trialState = getTrialState()

  if (trialState.status === 'active') {
    return {
      name: 'trial',
      caps: TIER_CAPS.trial,
      trialStatus: 'active',
      trialDaysLeft: trialState.daysLeft,
      maxDevices:  TIER_CAPS.trial.maxDevices,
      maxBranches: TIER_CAPS.trial.maxBranches,
      maxCameras:  TIER_CAPS.trial.maxCameras,
      features:    TIER_FEATURES.trial,
    }
  }

  if (trialState.status === 'grace') {
    return {
      name: 'trial',
      caps: TIER_CAPS.trial,
      trialStatus: 'grace',
      trialDaysLeft: 0,
      graceDaysLeft: trialState.graceDaysLeft,
      maxDevices:  1,       // grace: lock to 1 device
      maxBranches: 1,
      maxCameras:  0,
      features: [
        // Grace: POS stays; cloud/CCTV/AI/multi-device locked
        FEATURES.POS,
        FEATURES.INVENTORY,
        FEATURES.INVOICES,
        FEATURES.PARTIES,
        FEATURES.KHATA,
        FEATURES.REPORTS_BASIC,
        FEATURES.PURCHASE_ORDERS,
      ],
    }
  }

  // Expired — Free Forever
  return {
    name: 'free_forever',
    caps: TIER_CAPS.free_forever,
    trialStatus: 'expired',
    trialDaysLeft: 0,
    graceDaysLeft: 0,
    maxDevices:  TIER_CAPS.free_forever.maxDevices,
    maxBranches: TIER_CAPS.free_forever.maxBranches,
    maxCameras:  TIER_CAPS.free_forever.maxCameras,
    features:    TIER_FEATURES.free_forever,
  }
}

/**
 * Primary feature gate. True = feature is available in current tier/trial state.
 * Call this from every IPC handler before performing gated operations.
 */
export function canUse(feature: FeatureKey): boolean {
  const tier = getActiveTierInfo()
  return (tier.features as string[]).includes(feature)
}

/**
 * Returns whether the current device count is within the tier's device limit.
 * connectedDevices = number of active WebSocket clients currently paired.
 */
export function isWithinDeviceLimit(connectedDevices: number): boolean {
  const { maxDevices } = getActiveTierInfo()
  if (maxDevices === -1) return true   // unlimited
  return connectedDevices < maxDevices
}
