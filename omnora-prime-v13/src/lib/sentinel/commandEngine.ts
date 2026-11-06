import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export type SentinelCommand = {
  intent: string;
  entities?: Record<string, string>;
  action: ((router: AppRouterInstance, entities: Record<string, string>) => void) | 'navigate';
  route?: string;
  label?: string;
};

const commands: SentinelCommand[] = [
  // REPORTS
  {
    intent: 'profit_loss',
    entities: {},
    action: (router, e) => {
      const period = parsePeriod(e.period || 'last_month');
      router.push(`/reports/profit-loss?from=${period.from}&to=${period.to}`);
    }
  },
  {
    intent: 'trial_balance',
    entities: {},
    action: (router) => router.push('/reports/trial-balance')
  },
  {
    intent: 'cash_flow',
    entities: {},
    action: (router) => router.push('/cashflow')
  },
  
  // NAVIGATION
  {
    intent: 'go_inventory',
    entities: {},
    action: (router) => router.push('/inventory')
  },
  {
    intent: 'go_karigars',
    entities: {},
    action: (router) => router.push('/karigars')
  },
  {
    intent: 'go_invoices',
    entities: {},
    action: (router) => router.push('/invoices')
  },
  {
    intent: 'go_payroll',
    entities: {},
    action: (router) => router.push('/payroll')
  },
  {
    intent: 'go_cctv',
    entities: {},
    action: (router) => router.push('/cctv')
  },
  
  // ACTIONS
  {
    intent: 'new_invoice',
    entities: {},
    action: (router) => router.push('/invoices/new')
  },
  {
    intent: 'new_purchase',
    entities: {},
    action: (router) => router.push('/purchase/new')
  },
  {
    intent: 'generate_payslip',
    entities: {},
    action: (router) => router.push('/generators/payslip')
  },
  {
    intent: 'generate_qr',
    entities: {},
    action: (router) => router.push('/generators/qr')
  },
  {
    intent: 'check_stock',
    entities: {},
    action: (router, e) => {
      if (e.sku) {
        router.push(`/stock?search=${e.sku}`);
      } else {
        router.push('/inventory');
      }
    }
  },
  {
    intent: 'low_stock',
    entities: {},
    action: (router) => router.push('/purchase/suggestions')
  },
  {
    intent: 'overdue_invoices',
    entities: {},
    action: (router) => router.push('/reports/aging')
  },
  {
    intent: 'add_karigar',
    entities: {},
    action: (router) => {
      router.push('/karigars');
      // Emit event to open Add Karigar modal
      window.dispatchEvent(
        new CustomEvent('sentinel:action', { detail: { type: 'open_add_karigar' } })
      );
    }
  },
  {
    intent: 'go_dashboard',
    action: 'navigate',
    route: '/dashboard',
    label: 'Open Dashboard',
  },
  {
    intent: 'go_settings',
    action: 'navigate',
    route: '/settings',
    label: 'Open Settings',
  },
  {
    intent: 'go_cashflow',
    action: 'navigate',
    route: '/cashflow',
    label: 'Open Cash Flow',
  },
  {
    intent: 'cash_flow',
    action: 'navigate',
    route: '/cashflow',
    label: 'Open Cash Flow',
  },
  {
    intent: 'go_dispatch',
    action: 'navigate',
    route: '/dispatch',
    label: 'Open Dispatch',
  },
  {
    intent: 'go_purchase',
    action: 'navigate',
    route: '/purchase',
    label: 'Open Purchase',
  },
  {
    intent: 'mark_attendance',
    action: 'navigate',
    route: '/quick-entry',
    label: 'Mark Attendance',
  },
  {
    intent: 'go_help',
    action: 'navigate',
    route: '/docs',
    label: 'Open Help',
  },
  {
    intent: 'go_reports',
    action: 'navigate',
    route: '/reports',
    label: 'Open Reports',
  },
  {
    intent: 'go_promises',
    action: 'navigate',
    route: '/promises',
    label: 'Open Promises',
  },
  {
    intent: 'go_network',
    action: 'navigate',
    route: '/network',
    label: 'Factory Network',
  },
  {
    intent: 'go_finance',
    action: 'navigate',
    route: '/finance',
    label: 'Open Finance',
  },
  {
    intent: 'go_intelligence',
    action: 'navigate',
    route: '/intelligence',
    label: 'Open Intelligence',
  },
  {
    intent: 'go_cctv',
    action: 'navigate',
    route: '/cctv',
    label: 'Open CCTV',
  },
  {
    intent: 'go_calculators',
    action: 'navigate',
    route: '/calculators',
    label: 'Open Calculators',
  },
  {
    intent: 'go_import',
    action: 'navigate',
    route: '/import',
    label: 'Import Data',
  },
  {
    intent: 'go_orders',
    action: 'navigate',
    route: '/orders',
    label: 'Open Sales Orders',
  },
  {
    intent: 'go_mandi',
    action: 'navigate',
    route: '/mandi',
    label: 'Open Mandi Rates',
  },
  {
    intent: 'go_backup',
    action: 'navigate',
    route: '/settings/backup',
    label: 'Backup & Restore',
  },
  {
    intent: 'go_diagnostics',
    action: 'navigate',
    route: '/settings/diagnostics',
    label: 'System Diagnostics',
  },
  {
    intent: 'go_branches',
    action: 'navigate',
    route: '/settings/branches',
    label: 'Factory Branches',
  },
  {
    intent: 'go_audit',
    action: 'navigate',
    route: '/audit',
    label: 'Open Audit',
  },
];

function parsePeriod(input: string): { from: string; to: string } {
  const now = new Date();
  if (input.includes('last_month') || input.includes('last month') || input.includes('pichle mahine')) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0]
    };
  }
  if (input.includes('this_month') || input.includes('this month') || input.includes('is mahine')) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: start.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0]
    };
  }
  // Default: this month
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
    to: now.toISOString().split('T')[0]
  };
}

export function parseCommand(input: string): SentinelCommand | null {
  const text = input.toLowerCase().trim();

  // If input is an inquiry, tutorial/learning request, question, or conversational sentence,
  // do NOT intercept with a silent navigation command. Defer to processChatQuery & Sentinel Brain!
  const isQuestionOrHelp = 
    /\b(kaise|kese|how|kya|what|kyun|why|samajh|samjh|nahi ata|ni ata|nahi aata|ni aata|nae ata|nhi ata|ata nahi|aata nahi|ata ni|aata ni|bana na|banana|seekhna|sikhao|sikhayein|batao|batayein|bataiye|tarika|tariqa|karna hai|karna nahi|explain|perform|dikhao|karke dikhao|krke dikhao|guide|help|tour|walkthrough|kya karu|kya karein)\b/i.test(text) ||
    text.includes('?') ||
    (text.split(/\s+/).length > 3 && !text.startsWith('go to') && !text.startsWith('open'));

  if (isQuestionOrHelp) {
    return null;
  }
  
  // Intent matching — keyword patterns (strictly for direct navigation/actions)
  const patterns: Array<{
    keywords: string[];
    intent: string;
    entities?: Record<string, string>;
  }> = [
    // Reports
    { keywords: ['profit loss', 'p&l', 'pnl report', 'munafa report', 'loss report'],
      intent: 'profit_loss' },
    { keywords: ['trial balance', 'balance sheet'],
      intent: 'trial_balance' },
    { keywords: ['cash flow report', 'cashflow report', 'liquidity report'],
      intent: 'cash_flow' },
    // Navigation  
    { keywords: ['go to inventory', 'open inventory', 'inventory list', 'stock list', 'view stock', 'check stock'],
      intent: 'go_inventory' },
    { keywords: ['go to dashboard', 'open dashboard', 'show dashboard', 'home page', 'main page'],
      intent: 'go_dashboard' },
    { keywords: ['business intelligence', 'open intelligence', 'bi analytics'],
      intent: 'go_intelligence' },
    { keywords: ['go to orders', 'open orders', 'sales orders list'],
      intent: 'go_orders' },
    { keywords: ['mandi rates', 'cotton rates', 'yarn rates', 'market rates'],
      intent: 'go_mandi' },
    { keywords: ['data import wizard', 'open import', 'upload excel', 'import wizard'],
      intent: 'go_import' },
    { keywords: ['backup and restore', 'open backup', 'usb backup'],
      intent: 'go_backup' },
    { keywords: ['system diagnostics', 'open diagnostics', 'health check'],
      intent: 'go_diagnostics' },
    { keywords: ['factory branches', 'open branches'],
      intent: 'go_branches' },
    { keywords: ['system settings', 'open settings', 'app settings'],
      intent: 'go_settings' },
    { keywords: ['cash flow forecast', 'open cashflow'],
      intent: 'go_cashflow' },
    { keywords: ['dispatch terminal', 'open dispatch', 'gate pass list'],
      intent: 'go_dispatch' },
    { keywords: ['mark attendance', 'haazri lagao'],
      intent: 'mark_attendance' },
    { keywords: ['go to purchase', 'open purchase', 'purchases list'],
      intent: 'go_purchase' },
    { keywords: ['open help', 'system help'],
      intent: 'open_help' },
    { keywords: ['go to karigars', 'open karigars', 'karigar list', 'workers list', 'staff list'],
      intent: 'go_karigars' },
    { keywords: ['go to invoices', 'open invoices', 'invoices list', 'view invoices', 'all invoices'],
      intent: 'go_invoices' },
    { keywords: ['go to payroll', 'open payroll', 'payroll list', 'wages list'],
      intent: 'go_payroll' },
    { keywords: ['cctv feeds', 'open cctv', 'security cameras'],
      intent: 'go_cctv' },
    // Actions
    { keywords: ['new invoice', 'create invoice', 'naya bill banao', 'invoice banao'],
      intent: 'new_invoice' },
    { keywords: ['new purchase', 'create purchase'],
      intent: 'new_purchase' },
    { keywords: ['generate payslip', 'print payslip', 'salary slip'],
      intent: 'generate_payslip' },
    { keywords: ['generate qr', 'create barcode', 'print barcode'],
      intent: 'generate_qr' },
    { keywords: ['low stock items', 'reorder alerts'],
      intent: 'low_stock' },
    { keywords: ['overdue invoices', 'unpaid bills', 'aging report'],
      intent: 'overdue_invoices' },
  ];
  
  // Extract period entity
  let period = 'this_month';
  if (text.includes('last month') || text.includes('pichle mahine') || text.includes('previous month')) {
    period = 'last_month';
  }
  
  // Find matching command
  for (const pattern of patterns) {
    if (pattern.keywords.some(kw => text.includes(kw))) {
      const cmd = commands.find(c => c.intent === pattern.intent);
      if (cmd) {
        return { ...cmd, entities: { period } };
      }
    }
  }
  
  return null;
}
