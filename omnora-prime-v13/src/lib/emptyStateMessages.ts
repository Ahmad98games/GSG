import { BusinessProfile } from '@/store/BusinessProfileStore';

export type PageContext = 'inventory' | 'karigars' | 'invoices' | 'production' | 'purchase' | 'sales';

export interface EmptyStateContext {
  persona: (BusinessProfile & { workerTermPlural?: string; workerTerm?: string }) | null;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  isNewBusiness: boolean;
  dayOfWeek: string;
  monthWeek: 'first' | 'middle' | 'last';
}

export function getEmptyStateMessage(page: PageContext, context: EmptyStateContext) {
  const { persona, timeOfDay, isNewBusiness, dayOfWeek, monthWeek } = context;
  const industry = persona?.industry_key || 'wholesale';
  const isTextile = industry.includes('textile') || industry.includes('apparel');

  const messages: Record<PageContext, { title: string; body: string; action: string }> = {
    inventory: {
      title: "Your stock register is empty",
      body: isTextile 
        ? `Start by adding your fabric and thread SKUs. Most textile factories have 50-200 SKUs.`
        : `Add your first product to start tracking stock. Real-time inventory prevents shrinkage.`,
      action: "Add First SKU"
    },
    karigars: {
      title: `No ${persona?.workerTermPlural || 'Karigars'} registered yet`,
      body: isTextile
        ? `A typical textile unit has 20-150 Karigars. Start with your senior operators.`
        : `Register your workforce to track attendance and payroll automatically.`,
      action: `Register First ${persona?.workerTerm || 'Karigar'}`
    },
    invoices: {
      title: monthWeek === 'first' ? "No invoices this month yet" : "Invoicing queue empty",
      body: `Create your first invoice to start tracking receivables and maintain cash flow.`,
      action: "Create Invoice"
    },
    production: {
      title: timeOfDay === 'morning' ? "No production logged today" : "Production floor quiet",
      body: `Tap the + button to log your first entry of the day and monitor efficiency.`,
      action: "Log Production"
    },
    purchase: {
      title: "No purchase orders found",
      body: "Track your procurement by creating your first purchase order for raw materials.",
      action: "Create Purchase Order"
    },
    sales: {
      title: "Sales history is empty",
      body: "Record your first sale to start building your customer revenue profiles.",
      action: "Record Sale"
    }
  };

  // Special overrides
  if (dayOfWeek === 'Monday' && page === 'inventory' && isTextile) {
    messages.inventory.body = "Monday morning stock-take? Start by adding your fabric and thread SKUs. Most textile factories have 50-200 SKUs.";
  }

  return messages[page] || {
    title: "No data found",
    body: "Get started by adding your first record to this section.",
    action: "Add New"
  };
}
