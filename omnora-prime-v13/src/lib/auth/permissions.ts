// src/lib/auth/permissions.ts
// Role-based access control for Noxis Hub multi-user system

export type StaffRole = 'owner' | 'manager' | 'accountant' | 'supervisor' | 'salesman' | 'viewer';

/**
 * Maps each role to allowed route prefixes.
 * Owner has unrestricted access (handled separately).
 */
export const ROLE_ROUTE_PERMISSIONS: Record<StaffRole, string[]> = {
  owner: ['*'], // all routes
  manager: [
    '/dashboard', '/inventory', '/karigars', '/production', '/payroll',
    '/dispatch', '/invoices', '/parties', '/purchase', '/orders',
    '/khata', '/cashflow', '/reports', '/audit', '/cctv', '/quick-entry',
    '/analytics', '/stock', '/generators', '/calculators', '/converters',
    '/file-morph', '/messaging', '/pairing', '/portal',
    // Manager cannot access /settings (billing/users)
  ],
  accountant: [
    '/dashboard', '/khata', '/invoices', '/reports', '/parties',
    '/cashflow', '/audit', '/purchase', '/stock',
    '/calculators', '/converters', '/generators', '/file-morph',
  ],
  supervisor: [
    '/dashboard', '/production', '/karigars', '/payroll',
    '/dispatch', '/stock', '/inventory',
  ],
  salesman: [
    '/dashboard', '/invoices', '/parties', '/stock', '/orders',
    '/calculators', '/converters',
  ],
  viewer: [
    '/dashboard', '/reports', '/analytics',
  ],
};

/**
 * Maps roles to sidebar module IDs for filtering navigation.
 */
export const ROLE_MODULE_MAP: Record<StaffRole, string[]> = {
  owner: ['*'],
  manager: [
    'dashboard', 'inventory', 'karigars', 'production', 'payroll',
    'dispatch', 'invoices', 'parties', 'purchase', 'orders',
    'khata', 'cashflow', 'reports', 'audit', 'cctv', 'quick-entry',
    'analytics', 'generators', 'calculators', 'converters',
    'file-morph', 'messaging', 'pairing',
  ],
  accountant: [
    'dashboard', 'khata', 'invoices', 'reports', 'parties',
    'cashflow', 'audit', 'purchase', 'calculators', 'converters',
    'generators', 'file-morph', 'settings',
  ],
  supervisor: [
    'dashboard', 'production', 'karigars', 'payroll',
    'dispatch', 'inventory',
  ],
  salesman: [
    'dashboard', 'invoices', 'parties', 'orders',
    'calculators', 'converters',
  ],
  viewer: [
    'dashboard', 'reports', 'analytics',
  ],
};

/**
 * Check if a given role has permission to access a specific route.
 */
export function hasRoutePermission(role: StaffRole, pathname: string): boolean {
  if (role === 'owner') return true;

  const allowedRoutes = ROLE_ROUTE_PERMISSIONS[role] || [];
  return allowedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if a given role can see a specific sidebar module.
 */
export function hasModulePermission(role: StaffRole, moduleId: string): boolean {
  if (role === 'owner') return true;
  
  const allowedModules = ROLE_MODULE_MAP[role] || [];
  return allowedModules.includes(moduleId);
}

/**
 * Get visible module IDs for a given role.
 */
export function getVisibleModules(role: StaffRole): string[] {
  if (role === 'owner') return ['*'];
  return ROLE_MODULE_MAP[role] || [];
}

/**
 * Role display labels and descriptions
 */
export const ROLE_LABELS: Record<StaffRole, { label: string; description: string; color: string }> = {
  owner: {
    label: 'Owner',
    description: 'Full access to all modules and settings',
    color: 'text-[#C5A059]',
  },
  manager: {
    label: 'Manager',
    description: 'All modules except settings and billing',
    color: 'text-blue-400',
  },
  accountant: {
    label: 'Accountant',
    description: 'Khata, invoices, reports, parties, and finance',
    color: 'text-emerald-400',
  },
  supervisor: {
    label: 'Supervisor',
    description: 'Production, workers, attendance, and dispatch',
    color: 'text-amber-400',
  },
  salesman: {
    label: 'Salesman',
    description: 'Invoices, parties, stock (view only), and orders',
    color: 'text-purple-400',
  },
  viewer: {
    label: 'Viewer',
    description: 'Dashboard and reports (read only)',
    color: 'text-gray-400',
  },
};
