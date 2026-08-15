import { createClient } from '@/lib/supabase/client';

const DEFAULT_CHART_OF_ACCOUNTS = [
  // Assets
  { account_code: '1000', name: 'Cash',                  type: 'asset'     },
  { account_code: '1100', name: 'Accounts Receivable',   type: 'asset'     },
  { account_code: '1200', name: 'Inventory / Stock',     type: 'asset'     },
  { account_code: '1500', name: 'Fixed Assets',          type: 'asset'     },

  // Liabilities
  { account_code: '2000', name: 'Accounts Payable',      type: 'liability' },
  { account_code: '2100', name: 'Tax Payable',           type: 'liability' },
  { account_code: '2200', name: 'Peshgi Payable',        type: 'liability' },

  // Equity
  { account_code: '3000', name: 'Owner Equity',          type: 'equity'    },
  { account_code: '3100', name: 'Retained Earnings',     type: 'equity'    },

  // Revenue
  { account_code: '4001', name: 'Sales Revenue',         type: 'revenue'   },
  { account_code: '4100', name: 'Other Income',          type: 'revenue'   },

  // Cost of Goods Sold
  { account_code: '5000', name: 'Cost of Goods Sold',    type: 'cogs'      },
  { account_code: '5100', name: 'Raw Material Cost',     type: 'cogs'      },

  // Expenses
  { account_code: '6000', name: 'Karigar Wages',         type: 'expense'   },
  { account_code: '6100', name: 'Salary Expense',        type: 'expense'   },
  { account_code: '6200', name: 'Rent Expense',          type: 'expense'   },
  { account_code: '6300', name: 'Utilities',             type: 'expense'   },
  { account_code: '6400', name: 'Transport Expense',     type: 'expense'   },
  { account_code: '6900', name: 'Miscellaneous Expense', type: 'expense'   },
];

export async function seedChartOfAccounts(
  businessId: string
): Promise<{ seeded: number; skipped: number }> {
  try {
    const supabase = createClient();

    // Check if accounts already exist for this business
    const { count } = await supabase
      .from('accounts')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId);

    if (count && count > 0) {
      return { seeded: 0, skipped: count };
    }

    const rows = DEFAULT_CHART_OF_ACCOUNTS.map(acc => ({
      ...acc,
      business_id: businessId,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('accounts')
      .insert(rows)
      .select('id');

    if (error) {
      console.warn('[seedChartOfAccounts] Seeding skipped (non-fatal):', error.message);
      return { seeded: 0, skipped: 0 };
    }

    return { seeded: data?.length || 0, skipped: 0 };
  } catch (err: any) {
    console.warn('[seedChartOfAccounts] Non-fatal error:', err?.message);
    return { seeded: 0, skipped: 0 };
  }
}
