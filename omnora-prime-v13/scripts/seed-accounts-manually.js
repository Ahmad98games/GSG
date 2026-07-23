const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in .env file!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_CHART_OF_ACCOUNTS = [
  // ASSETS
  { account_code: '1001', name: 'Cash in Hand',           type: 'asset',   is_system: true },
  { account_code: '1002', name: 'Cash at Bank',            type: 'asset',   is_system: true },
  { account_code: '1100', name: 'Accounts Receivable',     type: 'asset',   is_system: true },
  { account_code: '1200', name: 'Inventory / Stock',       type: 'asset',   is_system: true },
  { account_code: '1300', name: 'Karigar Advances',        type: 'asset',   is_system: true },
  { account_code: '1500', name: 'Fixed Assets',            type: 'asset',   is_system: true },
  { account_code: '1510', name: 'Accumulated Depreciation', type: 'asset',   is_system: true },
  // LIABILITIES
  { account_code: '2001', name: 'Accounts Payable',        type: 'liability', is_system: true },
  { account_code: '2100', name: 'Tax Payable (Output)',    type: 'liability', is_system: true },
  { account_code: '2101', name: 'Tax Receivable (Input)',  type: 'asset',   is_system: true },
  { account_code: '2200', name: 'Salaries Payable',        type: 'liability', is_system: true },
  { account_code: '2300', name: 'EOBI Payable',            type: 'liability', is_system: true },
  { account_code: '2900', name: 'Owner Loan / Capital',    type: 'liability', is_system: true },
  // EQUITY
  { account_code: '3001', name: 'Owner Capital',           type: 'equity',  is_system: true },
  { account_code: '3100', name: 'Retained Earnings',       type: 'equity',  is_system: true },
  { account_code: '3200', name: 'Current Year Profit/Loss', type: 'equity',  is_system: true },
  // REVENUE
  { account_code: '4001', name: 'Sales Revenue',           type: 'revenue', is_system: true },
  { account_code: '4002', name: 'Other Income',            type: 'revenue', is_system: true },
  { account_code: '4100', name: 'Sales Returns',           type: 'revenue', is_system: true },
  // EXPENSES
  { account_code: '5001', name: 'Cost of Goods Sold',      type: 'expense', is_system: true },
  { account_code: '5100', name: 'Salaries & Wages',        type: 'expense', is_system: true },
  { account_code: '5200', name: 'Rent',                    type: 'expense', is_system: true },
  { account_code: '5300', name: 'Utilities (WAPDA/Gas)',   type: 'expense', is_system: true },
  { account_code: '5400', name: 'Depreciation',            type: 'expense', is_system: true },
  { account_code: '5500', name: 'Freight & Carriage',      type: 'expense', is_system: true },
  { account_code: '5600', name: 'Repairs & Maintenance',   type: 'expense', is_system: true },
  { account_code: '5700', name: 'Printing & Stationery',   type: 'expense', is_system: true },
  { account_code: '5800', name: 'Miscellaneous Expense',   type: 'expense', is_system: true },
];

const businesses = [
  '69467ff4-1b8b-4741-9485-51b6e6fcb575', // dhanraj and ahmad bhai
  'b4a497b4-7fb5-4c92-b019-bdafc4c4d6de'  // Omnora
];

async function run() {
  for (const businessId of businesses) {
    console.log(`Manually seeding accounts for business: ${businessId}`);
    
    // Clean up test/existing entries first
    await supabase
      .from('accounts')
      .delete()
      .eq('business_id', businessId);

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
      console.error(`Failed to insert accounts for ${businessId}:`, error);
    } else {
      console.log(`Successfully inserted ${data.length} accounts for ${businessId}`);
    }
  }
}

run();
