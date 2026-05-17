import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export type SentinelCommand = {
  intent: string;
  entities: Record<string, string>;
  action: (router: AppRouterInstance, entities: Record<string, string>) => void;
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
  
  // Intent matching — keyword patterns
  const patterns: Array<{
    keywords: string[];
    intent: string;
    entities?: Record<string, string>;
  }> = [
    // Reports
    { keywords: ['profit', 'loss', 'p&l', 'pnl', 'munafa', 'nuqsan', 'report'],
      intent: 'profit_loss' },
    { keywords: ['trial balance', 'trial', 'balance sheet'],
      intent: 'trial_balance' },
    { keywords: ['cash flow', 'cashflow', 'liquidity', 'nakdi'],
      intent: 'cash_flow' },
    // Navigation  
    { keywords: ['stock', 'inventory', 'maal', 'kitna', 'check stock', 'how much'],
      intent: 'go_inventory' },
    { keywords: ['dashboard', 'home', 'ghar', 'main page', 'back to start'],
      intent: 'go_dashboard' },
    { keywords: ['settings', 'config', 'tarteeb', 'change setting'],
      intent: 'go_settings' },
    { keywords: ['cashflow', 'cash position', 'nakdi', 'paisa kitna'],
      intent: 'go_cashflow' },
    { keywords: ['dispatch', 'delivery', 'bhejna', 'shipment'],
      intent: 'go_dispatch' },
    { keywords: ['attendance', 'haazri', 'kaun aya', 'who came'],
      intent: 'mark_attendance' },
    { keywords: ['purchase', 'kharidna', 'order', 'supplier'],
      intent: 'go_purchase' },
    { keywords: ['help', 'madad', 'how', 'kaise', 'kya karna'],
      intent: 'open_help' },
    { keywords: ['karigar', 'worker', 'staff', 'mazdoor', 'employees'],
      intent: 'go_karigars' },
    { keywords: ['invoice', 'bill', 'receipt', 'raseed', 'billing'],
      intent: 'go_invoices' },
    { keywords: ['payroll', 'salary', 'tankhwa', 'wages', 'pay'],
      intent: 'go_payroll' },
    { keywords: ['cctv', 'camera', 'security', 'sentinel', 'monitor'],
      intent: 'go_cctv' },
    // Actions
    { keywords: ['new invoice', 'create invoice', 'naya bill', 'invoice banao'],
      intent: 'new_invoice' },
    { keywords: ['new purchase', 'order', 'kharid', 'purchase'],
      intent: 'new_purchase' },
    { keywords: ['payslip', 'pay slip', 'salary slip', 'tankhwa slip'],
      intent: 'generate_payslip' },
    { keywords: ['qr code', 'qr', 'barcode'],
      intent: 'generate_qr' },
    { keywords: ['low stock', 'reorder', 'khatam', 'running out'],
      intent: 'low_stock' },
    { keywords: ['overdue', 'unpaid', 'baqi', 'outstanding', 'aging'],
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
