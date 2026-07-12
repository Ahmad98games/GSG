export type Role =
  | 'owner'
  | 'manager'
  | 'accountant'
  | 'supervisor'
  | 'viewer'

export type Permission =
  // Financial visibility
  | 'view:revenue'
  | 'view:profit'
  | 'view:costs'
  | 'view:owner_equity'
  | 'view:payroll_amounts'
  | 'view:party_balances'

  // Invoicing
  | 'view:invoices'
  | 'create:invoices'
  | 'edit:invoices'
  | 'delete:invoices'
  | 'post:invoices'

  // Workers
  | 'view:karigars'
  | 'create:karigars'
  | 'edit:karigars'
  | 'view:karigar_pii'
  | 'create:attendance'
  | 'create:production_logs'
  | 'create:peshgi'

  // Inventory
  | 'view:inventory'
  | 'view:inventory_costs'
  | 'create:inventory'
  | 'edit:inventory'

  // Parties
  | 'view:parties'
  | 'create:parties'
  | 'edit:parties'

  // Reports
  | 'view:reports_basic'
  | 'view:reports_financial'
  | 'view:reports_payroll'

  // System
  | 'manage:users'
  | 'view:settings'
  | 'edit:settings'
  | 'view:audit_log'
  | 'view:cctv'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    // Owner has ALL permissions
    'view:revenue', 'view:profit',
    'view:costs', 'view:owner_equity',
    'view:payroll_amounts',
    'view:party_balances',
    'view:invoices', 'create:invoices',
    'edit:invoices', 'delete:invoices',
    'post:invoices',
    'view:karigars', 'create:karigars',
    'edit:karigars', 'view:karigar_pii',
    'create:attendance',
    'create:production_logs',
    'create:peshgi',
    'view:inventory', 'view:inventory_costs',
    'create:inventory', 'edit:inventory',
    'view:parties', 'create:parties',
    'edit:parties',
    'view:reports_basic',
    'view:reports_financial',
    'view:reports_payroll',
    'manage:users',
    'view:settings', 'edit:settings',
    'view:audit_log', 'view:cctv',
  ],

  manager: [
    'view:revenue',
    'view:costs',
    'view:party_balances',
    'view:invoices', 'create:invoices',
    'edit:invoices', 'post:invoices',
    'view:karigars', 'view:karigar_pii',
    'view:inventory', 'view:inventory_costs',
    'create:inventory', 'edit:inventory',
    'view:parties', 'create:parties',
    'edit:parties',
    'view:reports_basic',
    'view:cctv',
  ],

  accountant: [
    'view:revenue', 'view:profit',
    'view:costs', 'view:party_balances',
    'view:invoices',
    'view:karigars',
    'view:inventory',
    'view:parties',
    'view:reports_basic',
    'view:reports_financial',
    'view:reports_payroll',
    'view:audit_log',
  ],

  supervisor: [
    'view:karigars', 'view:karigar_pii',
    'create:attendance',
    'create:production_logs',
    'create:peshgi',
    'view:inventory',
  ],

  viewer: [
    'view:karigars',
    'view:inventory',
  ],
}

export function hasPermission(
  role: Role | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(
    permission
  ) ?? false
}

export function getRolePermissions(
  role: Role
): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  manager: 'Manager',
  accountant: 'Accountant',
  supervisor: 'Supervisor',
  viewer: 'View Only',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'Full access to everything. Cannot be restricted.',
  manager: 'Can manage invoices, stock, and parties. Cannot see profits or payroll details.',
  accountant: 'Can view all financial reports and ledger. Cannot create invoices or manage stock.',
  supervisor: 'Can mark attendance and log production only. Cannot see any financial data.',
  viewer: 'Read-only access to stock levels and karigar list. No financial visibility.',
}
