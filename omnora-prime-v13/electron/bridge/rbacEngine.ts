/**
 * WebSocket Bridge RBAC Engine
 *
 * Defines per-role table access for mobile pairing.
 * Consumed by the WebSocket bridge server running in main.ts.
 *
 * Roles mirror the business_users table:
 *   owner | manager | accountant | supervisor | cashier
 *
 * allowedTables: mobile device is permitted to read/write
 * blockedTables: mobile device is explicitly denied
 * canWriteKhata: ledger entry write permission
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type MobileRole =
  | 'owner'
  | 'manager'
  | 'accountant'
  | 'supervisor'
  | 'cashier'

export interface RBACPolicy {
  role: MobileRole
  allowedTables: string[]
  blockedTables: string[]
  canViewKhata: boolean
  canWriteKhata: boolean
  canViewReports: boolean
  canManageInventory: boolean
  canCreateInvoice: boolean
  canMarkAttendance: boolean
  canLogProduction: boolean
  canAddPeshgi: boolean
}

export interface HubAck {
  type: 'HUB_ACK'
  role: MobileRole
  allowedTables: string[]
  blockedTables: string[]
  permissions: Omit<RBACPolicy, 'role' | 'allowedTables' | 'blockedTables'>
  tierName: string
  maxDevices: number
  connectedAt: number
}

// ── Role → Policy Matrix ──────────────────────────────────────────────────────

const ROLE_POLICIES: Record<MobileRole, RBACPolicy> = {
  owner: {
    role: 'owner',
    allowedTables: [
      'attendance_logs',
      'karigar_production_logs',
      'peshgi_transactions',
      'invoices',
      'invoice_items',
      'ledger_entries',
      'parties',
      'skus',
      'purchase_orders',
      'purchase_order_items',
      'payments',
      'business_users',
    ],
    blockedTables: [],
    canViewKhata:       true,
    canWriteKhata:      true,
    canViewReports:     true,
    canManageInventory: true,
    canCreateInvoice:   true,
    canMarkAttendance:  true,
    canLogProduction:   true,
    canAddPeshgi:       true,
  },

  manager: {
    role: 'manager',
    allowedTables: [
      'attendance_logs',
      'karigar_production_logs',
      'peshgi_transactions',
      'invoices',
      'invoice_items',
      'ledger_entries',
      'parties',
      'skus',
      'purchase_orders',
      'purchase_order_items',
      'payments',
    ],
    blockedTables: ['business_users'],
    canViewKhata:       true,
    canWriteKhata:      true,
    canViewReports:     true,
    canManageInventory: true,
    canCreateInvoice:   true,
    canMarkAttendance:  true,
    canLogProduction:   true,
    canAddPeshgi:       true,
  },

  accountant: {
    role: 'accountant',
    allowedTables: [
      'invoices',
      'invoice_items',
      'ledger_entries',
      'parties',
      'payments',
      'purchase_orders',
    ],
    blockedTables: [
      'attendance_logs',
      'karigar_production_logs',
      'peshgi_transactions',
      'skus',
      'business_users',
    ],
    canViewKhata:       true,
    canWriteKhata:      true,
    canViewReports:     true,
    canManageInventory: false,
    canCreateInvoice:   true,
    canMarkAttendance:  false,
    canLogProduction:   false,
    canAddPeshgi:       false,
  },

  supervisor: {
    role: 'supervisor',
    allowedTables: [
      'attendance_logs',
      'karigar_production_logs',
      'peshgi_transactions',
    ],
    blockedTables: [
      'ledger_entries',
      'invoices',
      'invoice_items',
      'parties',
      'skus',
      'purchase_orders',
      'payments',
      'business_users',
    ],
    canViewKhata:       false,
    canWriteKhata:      false,
    canViewReports:     false,
    canManageInventory: false,
    canCreateInvoice:   false,
    canMarkAttendance:  true,
    canLogProduction:   true,
    canAddPeshgi:       true,
  },

  cashier: {
    role: 'cashier',
    allowedTables: [
      'invoices',
      'invoice_items',
      'parties',
      'payments',
    ],
    blockedTables: [
      'attendance_logs',
      'karigar_production_logs',
      'peshgi_transactions',
      'ledger_entries',
      'skus',
      'purchase_orders',
      'business_users',
    ],
    canViewKhata:       false,
    canWriteKhata:      false,
    canViewReports:     false,
    canManageInventory: false,
    canCreateInvoice:   true,
    canMarkAttendance:  false,
    canLogProduction:   false,
    canAddPeshgi:       false,
  },
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getPolicyForRole(role: MobileRole): RBACPolicy {
  return ROLE_POLICIES[role] || ROLE_POLICIES.cashier
}

/**
 * Builds the HUB_ACK payload sent to a mobile client upon successful pairing.
 */
export function buildHubAck(
  role: MobileRole,
  tierName: string,
  maxDevices: number
): HubAck {
  const policy = getPolicyForRole(role)
  return {
    type: 'HUB_ACK',
    role,
    allowedTables: policy.allowedTables,
    blockedTables: policy.blockedTables,
    permissions: {
      canViewKhata:       policy.canViewKhata,
      canWriteKhata:      policy.canWriteKhata,
      canViewReports:     policy.canViewReports,
      canManageInventory: policy.canManageInventory,
      canCreateInvoice:   policy.canCreateInvoice,
      canMarkAttendance:  policy.canMarkAttendance,
      canLogProduction:   policy.canLogProduction,
      canAddPeshgi:       policy.canAddPeshgi,
    },
    tierName,
    maxDevices,
    connectedAt: Date.now(),
  }
}

/**
 * Validates that a mobile role has khata write permission.
 */
export function canWriteKhata(role: MobileRole): boolean {
  return getPolicyForRole(role).canWriteKhata
}

/**
 * Validates that a mobile role can access a specific table.
 */
export function canAccessTable(role: MobileRole, table: string): boolean {
  const policy = getPolicyForRole(role)
  if (policy.blockedTables.includes(table)) return false
  if (policy.allowedTables.includes(table)) return true
  return false
}

/**
 * Normalizes a raw role string from SQLite, falls back to 'cashier'.
 */
export function normalizeRole(raw: string): MobileRole {
  const valid: MobileRole[] = ['owner', 'manager', 'accountant', 'supervisor', 'cashier']
  const lower = (raw || '').toLowerCase() as MobileRole
  return valid.includes(lower) ? lower : 'cashier'
}
