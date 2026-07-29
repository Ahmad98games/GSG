"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURES = void 0;
exports.getActiveTierInfo = getActiveTierInfo;
exports.canUse = canUse;
exports.isWithinDeviceLimit = isWithinDeviceLimit;
const licenseVerifier_1 = require("./licenseVerifier");
const trialEngine_1 = require("./trialEngine");
// ── Feature Key Registry ──────────────────────────────────────────────────────
exports.FEATURES = {
    // Core POS
    POS: 'pos',
    // Inventory
    INVENTORY: 'inventory',
    // Invoicing
    INVOICES: 'invoices',
    RECURRING_INVOICES: 'recurring_invoices',
    // Parties / Ledger
    PARTIES: 'parties',
    KHATA: 'khata',
    // Cloud sync
    CLOUD_SYNC: 'cloud_sync',
    // Mobile RBAC pairing
    MOBILE_PAIRING: 'mobile_pairing',
    MOBILE_MULTI_DEVICE: 'mobile_multi_device', // > 1 device
    // CCTV
    CCTV: 'cctv',
    CCTV_MULTI_CAM: 'cctv_multi_cam', // > 1 camera
    // AI / Foresight
    FORESIGHT_AI: 'foresight_ai',
    // Reporting
    REPORTS_BASIC: 'reports_basic',
    REPORTS_ADVANCED: 'reports_advanced',
    // Branches
    BRANCHES: 'branches',
    MULTI_BRANCH: 'multi_branch',
    // Payroll
    PAYROLL: 'payroll',
    // Purchase orders
    PURCHASE_ORDERS: 'purchase_orders',
    // Audit log
    AUDIT_LOG: 'audit_log',
    // Auto-updater priority
    BETA_UPDATES: 'beta_updates',
};
// ── Tier Feature Matrix ───────────────────────────────────────────────────────
// Each tier gets all features listed for it (not cumulative — explicitly listed per tier)
const TIER_FEATURES = {
    trial: [
        exports.FEATURES.POS,
        exports.FEATURES.INVENTORY,
        exports.FEATURES.INVOICES,
        exports.FEATURES.PARTIES,
        exports.FEATURES.KHATA,
        exports.FEATURES.CLOUD_SYNC,
        exports.FEATURES.MOBILE_PAIRING,
        exports.FEATURES.MOBILE_MULTI_DEVICE,
        exports.FEATURES.CCTV,
        exports.FEATURES.CCTV_MULTI_CAM,
        exports.FEATURES.FORESIGHT_AI,
        exports.FEATURES.REPORTS_BASIC,
        exports.FEATURES.REPORTS_ADVANCED,
        exports.FEATURES.BRANCHES,
        exports.FEATURES.PURCHASE_ORDERS,
        exports.FEATURES.AUDIT_LOG,
    ],
    // After 17 days — POS stays, everything cloud/AI locked, caps enforced
    free_forever: [
        exports.FEATURES.POS,
        exports.FEATURES.INVENTORY, // capped at 200 SKUs
        exports.FEATURES.INVOICES,
        exports.FEATURES.PARTIES, // capped at 50 parties
        exports.FEATURES.KHATA,
        exports.FEATURES.REPORTS_BASIC,
        exports.FEATURES.PURCHASE_ORDERS,
    ],
    lite: [
        exports.FEATURES.POS,
        exports.FEATURES.INVENTORY,
        exports.FEATURES.INVOICES,
        exports.FEATURES.RECURRING_INVOICES,
        exports.FEATURES.PARTIES,
        exports.FEATURES.KHATA,
        exports.FEATURES.CLOUD_SYNC,
        exports.FEATURES.MOBILE_PAIRING, // 1 device only
        exports.FEATURES.REPORTS_BASIC,
        exports.FEATURES.PURCHASE_ORDERS,
        exports.FEATURES.AUDIT_LOG,
    ],
    pro: [
        exports.FEATURES.POS,
        exports.FEATURES.INVENTORY,
        exports.FEATURES.INVOICES,
        exports.FEATURES.RECURRING_INVOICES,
        exports.FEATURES.PARTIES,
        exports.FEATURES.KHATA,
        exports.FEATURES.CLOUD_SYNC,
        exports.FEATURES.MOBILE_PAIRING,
        exports.FEATURES.MOBILE_MULTI_DEVICE,
        exports.FEATURES.CCTV,
        exports.FEATURES.REPORTS_BASIC,
        exports.FEATURES.REPORTS_ADVANCED,
        exports.FEATURES.BRANCHES,
        exports.FEATURES.PAYROLL,
        exports.FEATURES.PURCHASE_ORDERS,
        exports.FEATURES.AUDIT_LOG,
    ],
    elite: [
        exports.FEATURES.POS,
        exports.FEATURES.INVENTORY,
        exports.FEATURES.INVOICES,
        exports.FEATURES.RECURRING_INVOICES,
        exports.FEATURES.PARTIES,
        exports.FEATURES.KHATA,
        exports.FEATURES.CLOUD_SYNC,
        exports.FEATURES.MOBILE_PAIRING,
        exports.FEATURES.MOBILE_MULTI_DEVICE,
        exports.FEATURES.CCTV,
        exports.FEATURES.CCTV_MULTI_CAM,
        exports.FEATURES.FORESIGHT_AI,
        exports.FEATURES.REPORTS_BASIC,
        exports.FEATURES.REPORTS_ADVANCED,
        exports.FEATURES.BRANCHES,
        exports.FEATURES.MULTI_BRANCH,
        exports.FEATURES.PAYROLL,
        exports.FEATURES.PURCHASE_ORDERS,
        exports.FEATURES.AUDIT_LOG,
        exports.FEATURES.BETA_UPDATES,
    ],
};
const TIER_CAPS = {
    trial: { maxDevices: 5, maxBranches: 1, maxCameras: 4, maxSkus: -1, maxParties: -1 },
    free_forever: { maxDevices: 1, maxBranches: 1, maxCameras: 0, maxSkus: 200, maxParties: 50 },
    lite: { maxDevices: 2, maxBranches: 1, maxCameras: 1, maxSkus: -1, maxParties: -1 },
    pro: { maxDevices: 10, maxBranches: 3, maxCameras: 8, maxSkus: -1, maxParties: -1 },
    elite: { maxDevices: -1, maxBranches: -1, maxCameras: -1, maxSkus: -1, maxParties: -1 },
};
function getActiveTierInfo() {
    // Check for active paid license first
    const license = (0, licenseVerifier_1.getActiveLicensePayload)();
    if (license) {
        const name = license.tier;
        const matrixCaps = TIER_CAPS[name];
        // License payload overrides matrix caps (explicit per-customer settings)
        const caps = {
            maxDevices: license.maxDevices > 0 ? license.maxDevices : matrixCaps.maxDevices,
            maxBranches: license.maxBranches > 0 ? license.maxBranches : matrixCaps.maxBranches,
            maxCameras: license.maxCameras > 0 ? license.maxCameras : matrixCaps.maxCameras,
            maxSkus: matrixCaps.maxSkus,
            maxParties: matrixCaps.maxParties,
        };
        return {
            name,
            caps,
            maxDevices: caps.maxDevices,
            maxBranches: caps.maxBranches,
            maxCameras: caps.maxCameras,
            features: TIER_FEATURES[name],
        };
    }
    // No paid license — resolve from trial state
    const trialState = (0, trialEngine_1.getTrialState)();
    if (trialState.status === 'active') {
        return {
            name: 'trial',
            caps: TIER_CAPS.trial,
            trialStatus: 'active',
            trialDaysLeft: trialState.daysLeft,
            maxDevices: TIER_CAPS.trial.maxDevices,
            maxBranches: TIER_CAPS.trial.maxBranches,
            maxCameras: TIER_CAPS.trial.maxCameras,
            features: TIER_FEATURES.trial,
        };
    }
    if (trialState.status === 'grace') {
        return {
            name: 'trial',
            caps: TIER_CAPS.trial,
            trialStatus: 'grace',
            trialDaysLeft: 0,
            graceDaysLeft: trialState.graceDaysLeft,
            maxDevices: 1, // grace: lock to 1 device
            maxBranches: 1,
            maxCameras: 0,
            features: [
                // Grace: POS stays; cloud/CCTV/AI/multi-device locked
                exports.FEATURES.POS,
                exports.FEATURES.INVENTORY,
                exports.FEATURES.INVOICES,
                exports.FEATURES.PARTIES,
                exports.FEATURES.KHATA,
                exports.FEATURES.REPORTS_BASIC,
                exports.FEATURES.PURCHASE_ORDERS,
            ],
        };
    }
    // Expired — Free Forever
    return {
        name: 'free_forever',
        caps: TIER_CAPS.free_forever,
        trialStatus: 'expired',
        trialDaysLeft: 0,
        graceDaysLeft: 0,
        maxDevices: TIER_CAPS.free_forever.maxDevices,
        maxBranches: TIER_CAPS.free_forever.maxBranches,
        maxCameras: TIER_CAPS.free_forever.maxCameras,
        features: TIER_FEATURES.free_forever,
    };
}
/**
 * Primary feature gate. True = feature is available in current tier/trial state.
 * Call this from every IPC handler before performing gated operations.
 */
function canUse(feature) {
    const tier = getActiveTierInfo();
    return tier.features.includes(feature);
}
/**
 * Returns whether the current device count is within the tier's device limit.
 * connectedDevices = number of active WebSocket clients currently paired.
 */
function isWithinDeviceLimit(connectedDevices) {
    const { maxDevices } = getActiveTierInfo();
    if (maxDevices === -1)
        return true; // unlimited
    return connectedDevices < maxDevices;
}
