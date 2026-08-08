/**
 * Renderer-Side Tier Engine
 *
 * Single source of truth for every feature gate in Noxis Hub (renderer process).
 * Pure TypeScript — no Node.js or Electron imports.
 *
 * The LicenseProvider calls window.electronAPI.license.getInfo() and passes
 * the tier down as a string; every component calls canUse(feature, tier).
 *
 * Tier hierarchy: free_trial > elite > pro > lite > free
 *   free_trial = all Pro features for 14 days
 *   free       = POS + 200 SKU + 50 parties + basic ledger only
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type Tier = 'free_trial' | 'free' | 'lite' | 'pro' | 'elite'

export type FeatureKey =
  // Core POS & Sales
  | 'pos_counter'
  | 'invoice_pdf'
  | 'invoice_whatsapp'
  | 'recurring_invoices'
  | 'quick_entry'
  | 'sales_return'
  // Inventory
  | 'inventory_basic'
  | 'inventory_advanced'
  | 'barcode_scanning'
  | 'batch_tracking'
  | 'expiry_tracking'
  | 'import_export'
  // Parties & Ledger
  | 'parties_basic'
  | 'khata_ledger'
  | 'credit_limit'
  | 'customer_portal'
  // Production & Workforce
  | 'karigars'
  | 'attendance'
  | 'production_log'
  | 'payroll'
  | 'payroll_advanced'
  // Reporting & Analytics
  | 'reports_basic'
  | 'reports_export'
  | 'reports_advanced'
  | 'profit_loss'
  | 'balance_sheet'
  // Cloud & Sync
  | 'cloud_backup'
  | 'cloud_sync'
  | 'multi_device'
  // Mobile
  | 'mobile_app'
  | 'mobile_multi_device'
  // CCTV & Security
  | 'cctv_cameras'
  | 'cctv_ai_detection'
  // AI & Intelligence
  | 'foresight_ai'
  | 'sentinel_ai'
  // Multi-location
  | 'multi_branch'
  | 'branch_reports'
  // Advanced / Enterprise
  | 'rbac_roles'
  | 'audit_log'
  | 'workflow_builder'
  | 'api_access'
  | 'whatsapp_automation'
  | 'purchase_orders'
  | 'dispatch_module'

// ── Feature Matrix ────────────────────────────────────────────────────────────
// Every feature explicitly mapped for every tier — no implicit inheritance.

export const FEATURE_MATRIX: Record<FeatureKey, Record<Tier, boolean>> = {
  // ── Core POS & Sales ────────────────────────────────────────────────────────
  pos_counter:          { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  invoice_pdf:          { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  invoice_whatsapp:     { free_trial: true,  free: false, lite: true,  pro: true,  elite: true  },
  recurring_invoices:   { free_trial: true,  free: false, lite: true,  pro: true,  elite: true  },
  quick_entry:          { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  sales_return:         { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },

  // ── Inventory ───────────────────────────────────────────────────────────────
  inventory_basic:      { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  inventory_advanced:   { free_trial: true,  free: false, lite: true,  pro: true,  elite: true  },
  barcode_scanning:     { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  batch_tracking:       { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },
  expiry_tracking:      { free_trial: true,  free: false, lite: true,  pro: true,  elite: true  },
  import_export:        { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },

  // ── Parties & Ledger ────────────────────────────────────────────────────────
  parties_basic:        { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  khata_ledger:         { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  credit_limit:         { free_trial: true,  free: false, lite: true,  pro: true,  elite: true  },
  customer_portal:      { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },

  // ── Production & Workforce ──────────────────────────────────────────────────
  karigars:             { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  attendance:           { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  production_log:       { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  payroll:              { free_trial: true,  free: false, lite: true,  pro: true,  elite: true  },
  payroll_advanced:     { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },

  // ── Reporting & Analytics ───────────────────────────────────────────────────
  reports_basic:        { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  reports_export:       { free_trial: true,  free: false, lite: true,  pro: true,  elite: true  },
  reports_advanced:     { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },
  profit_loss:          { free_trial: true,  free: false, lite: true,  pro: true,  elite: true  },
  balance_sheet:        { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },

  // ── Cloud & Sync ────────────────────────────────────────────────────────────
  cloud_backup:         { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },
  cloud_sync:           { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },
  multi_device:         { free_trial: true,  free: false, lite: true,  pro: true,  elite: true  },

  // ── Mobile ──────────────────────────────────────────────────────────────────
  mobile_app:           { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  mobile_multi_device:  { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },

  // ── CCTV & Security ─────────────────────────────────────────────────────────
  cctv_cameras:         { free_trial: true,  free: false, lite: true,  pro: true,  elite: true  },
  cctv_ai_detection:    { free_trial: true,  free: false, lite: false, pro: false, elite: true  },

  // ── AI & Intelligence ───────────────────────────────────────────────────────
  foresight_ai:         { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },
  sentinel_ai:          { free_trial: true,  free: false, lite: false, pro: false, elite: true  },

  // ── Multi-location ──────────────────────────────────────────────────────────
  multi_branch:         { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },
  branch_reports:       { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },

  // ── Advanced / Enterprise ───────────────────────────────────────────────────
  rbac_roles:           { free_trial: true,  free: false, lite: true,  pro: true,  elite: true  },
  audit_log:            { free_trial: true,  free: false, lite: true,  pro: true,  elite: true  },
  workflow_builder:     { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },
  api_access:           { free_trial: false, free: false, lite: false, pro: false, elite: true  },
  whatsapp_automation:  { free_trial: true,  free: false, lite: false, pro: true,  elite: true  },
  purchase_orders:      { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
  dispatch_module:      { free_trial: true,  free: true,  lite: true,  pro: true,  elite: true  },
}

// ── Tier Limits ───────────────────────────────────────────────────────────────

export type ResourceKey = 'max_skus' | 'max_parties' | 'max_karigars' | 'max_devices' | 'max_cameras' | 'max_branches'

export const TIER_LIMITS: Record<Tier, Record<ResourceKey, number>> = {
  //                         skus   parties  karigars  devices  cameras  branches
  free_trial: { max_skus: -1,    max_parties: -1,    max_karigars: -1,    max_devices: 1,  max_cameras: 4,  max_branches: 1  },
  free:       { max_skus: 200,   max_parties: 50,    max_karigars: 25,    max_devices: 1,  max_cameras: 0,  max_branches: 1  },
  lite:       { max_skus: -1,    max_parties: -1,    max_karigars: -1,    max_devices: 5,  max_cameras: 2,  max_branches: 1  },
  pro:        { max_skus: -1,    max_parties: -1,    max_karigars: -1,    max_devices: 15, max_cameras: 4,  max_branches: 5  },
  elite:      { max_skus: -1,    max_parties: -1,    max_karigars: -1,    max_devices: 50, max_cameras: 6,  max_branches: 99 },
}

// ── Upgrade Messages ──────────────────────────────────────────────────────────

export const UPGRADE_MESSAGES: Record<FeatureKey, string> = {
  pos_counter:         'POS Counter is available on all plans.',
  invoice_pdf:         'PDF invoices are available on all plans.',
  invoice_whatsapp:    'WhatsApp invoice sending requires Lite plan or higher.',
  recurring_invoices:  'Recurring invoices require Lite plan or higher.',
  quick_entry:         'Quick entry is available on all plans.',
  sales_return:        'Sales returns are available on all plans.',
  inventory_basic:     'Basic inventory is available on all plans.',
  inventory_advanced:  'Advanced inventory features require Lite plan or higher.',
  barcode_scanning:    'Barcode scanning is available on all plans.',
  batch_tracking:      'Batch tracking requires Pro plan or higher.',
  expiry_tracking:     'Expiry date tracking requires Lite plan or higher.',
  import_export:       'Data import/export requires Pro plan or higher.',
  parties_basic:       'Basic parties/customers are available on all plans.',
  khata_ledger:        'Khata ledger is available on all plans.',
  credit_limit:        'Credit limits require Lite plan or higher.',
  customer_portal:     'Customer portal requires Pro plan or higher.',
  karigars:            'Karigar management is available on all plans.',
  attendance:          'Attendance tracking is available on all plans.',
  production_log:      'Production logging is available on all plans.',
  payroll:             'Payroll calculations require Lite plan or higher.',
  payroll_advanced:    'Advanced payroll requires Pro plan or higher.',
  reports_basic:       'Basic reports are available on all plans.',
  reports_export:      'Exporting reports (CSV/PDF) requires Lite plan or higher.',
  reports_advanced:    'Advanced reports require Pro plan or higher.',
  profit_loss:         'Profit & Loss report requires Lite plan or higher.',
  balance_sheet:       'Balance Sheet requires Pro plan or higher.',
  cloud_backup:        'Cloud backup requires Pro plan or higher. Your data is currently PC-only.',
  cloud_sync:          'Cloud sync requires Pro plan or higher.',
  multi_device:        'Multi-device access requires Lite plan or higher.',
  mobile_app:          'Mobile app (1 device) is available on all plans.',
  mobile_multi_device: 'Multiple mobile devices require Pro plan or higher.',
  cctv_cameras:        'CCTV camera integration requires Lite plan or higher.',
  cctv_ai_detection:   'AI-powered CCTV detection requires Elite plan.',
  foresight_ai:        'Foresight AI business predictions require Pro plan or higher.',
  sentinel_ai:         'Sentinel AI security monitoring requires Elite plan.',
  multi_branch:        'Multi-branch management requires Pro plan or higher.',
  branch_reports:      'Branch-level reports require Pro plan or higher.',
  rbac_roles:          'Role-based access control requires Lite plan or higher.',
  audit_log:           'Audit log requires Lite plan or higher.',
  workflow_builder:    'Workflow automation builder requires Pro plan or higher.',
  api_access:          'API access is exclusive to Elite plan.',
  whatsapp_automation: 'WhatsApp automation requires Pro plan or higher.',
  purchase_orders:     'Purchase orders are available on all plans.',
  dispatch_module:     'Dispatch module is available on all plans.',
}

export interface UpgradeInfo {
  title: string
  reason: string
  minTier: Tier
}

export function getUpgradeInfo(feature: FeatureKey): UpgradeInfo {
  return {
    title: featureDisplayName(feature),
    reason: UPGRADE_MESSAGES[feature],
    minTier: getMinTierForFeature(feature),
  }
}

export function getMinTierForFeature(feature: FeatureKey): Tier {
  const order: Tier[] = ['free', 'lite', 'pro', 'elite']
  for (const tier of order) {
    if (FEATURE_MATRIX[feature][tier]) return tier
  }
  return 'elite'
}

function featureDisplayName(feature: FeatureKey): string {
  const names: Record<FeatureKey, string> = {
    pos_counter:         'POS Counter',
    invoice_pdf:         'PDF Invoices',
    invoice_whatsapp:    'WhatsApp Invoicing',
    recurring_invoices:  'Recurring Invoices',
    quick_entry:         'Quick Entry',
    sales_return:        'Sales Returns',
    inventory_basic:     'Inventory',
    inventory_advanced:  'Advanced Inventory',
    barcode_scanning:    'Barcode Scanning',
    batch_tracking:      'Batch Tracking',
    expiry_tracking:     'Expiry Tracking',
    import_export:       'Import / Export',
    parties_basic:       'Parties & Customers',
    khata_ledger:        'Khata Ledger',
    credit_limit:        'Credit Limits',
    customer_portal:     'Customer Portal',
    karigars:            'Karigar Management',
    attendance:          'Attendance',
    production_log:      'Production Log',
    payroll:             'Payroll',
    payroll_advanced:    'Advanced Payroll',
    reports_basic:       'Basic Reports',
    reports_export:      'Export Reports',
    reports_advanced:    'Advanced Reports',
    profit_loss:         'Profit & Loss',
    balance_sheet:       'Balance Sheet',
    cloud_backup:        'Cloud Backup',
    cloud_sync:          'Cloud Sync',
    multi_device:        'Multi-Device',
    mobile_app:          'Mobile App',
    mobile_multi_device: 'Multiple Mobile Devices',
    cctv_cameras:        'CCTV Cameras',
    cctv_ai_detection:   'AI CCTV Detection',
    foresight_ai:        'Foresight AI',
    sentinel_ai:         'Sentinel AI',
    multi_branch:        'Multi-Branch',
    branch_reports:      'Branch Reports',
    rbac_roles:          'Role-Based Access',
    audit_log:           'Audit Log',
    workflow_builder:    'Workflow Builder',
    api_access:          'API Access',
    whatsapp_automation: 'WhatsApp Automation',
    purchase_orders:     'Purchase Orders',
    dispatch_module:     'Dispatch Module',
  }
  return names[feature] || feature
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Get the effective tier for a user.
 * Expired paid license = Free tier silently.
 */
export function getEffectiveTier(tier: Tier, isExpired: boolean = false): Tier {
  if (isExpired && tier !== 'free') {
    return 'free';
  }
  return tier;
}

/**
 * Check if a feature is available for the given tier.
 * free_trial gets all features that pro gets (full 14-day trial).
 * Expired paid license = Free tier (never blocks).
 */
export function canUse(feature: FeatureKey, tier: Tier, isExpired: boolean = false): boolean {
  if (isExpired && tier !== 'free') {
    return FEATURE_MATRIX[feature]['free'] ?? false;
  }
  return FEATURE_MATRIX[feature]?.[tier] ?? false;
}

/**
 * Check if a resource count is at or over the tier's limit.
 * Expired paid license = Free tier limits.
 * Returns true if AT or OVER limit (blocked).
 */
export function isAtLimit(
  resource: ResourceKey | 'skus' | 'parties' | 'karigars',
  currentCount: number,
  tier: Tier,
  isExpired: boolean = false
): boolean {
  const effectiveTier = getEffectiveTier(tier, isExpired);
  const limits = TIER_LIMITS[effectiveTier];
  const resKey = (resource.startsWith('max_') ? resource : `max_${resource}`) as keyof typeof limits;
  const limit = limits[resKey];
  if (limit === undefined || limit === -1) return false;   // unlimited
  return currentCount >= limit;
}

/**
 * Get the numeric limit for a resource in a tier.
 * Returns -1 for unlimited.
 */
export function getLimit(resource: ResourceKey, tier: Tier): number {
  return TIER_LIMITS[tier][resource]
}

/**
 * Usage percentage (0–100) for a resource. Returns 0 for unlimited tiers.
 */
export function getUsagePct(resource: ResourceKey, count: number, tier: Tier): number {
  const limit = TIER_LIMITS[tier][resource]
  if (limit === -1) return 0
  return Math.min(100, Math.round((count / limit) * 100))
}
