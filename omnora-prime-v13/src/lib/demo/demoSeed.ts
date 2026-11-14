/**
 * Noxis Hub — Demo Seed Data Engine
 *
 * Provides realistic, factory-ready demo data for live software demonstrations.
 * Configured specifically for a Pakistani Textile Mill (Al-Madina Textile Mills, Faisalabad).
 *
 * Strict Non-Destructive Isolation:
 * All records use deterministic 'demo_' ID prefixes and '[DEMO]' tags.
 * clearDemoData() will ONLY remove demo-tagged records, never touching real factory records.
 */

export interface DemoSeedStatus {
  isLoaded: boolean;
  businessName: string;
  skuCount: number;
  partyCount: number;
  karigarCount: number;
  invoiceCount: number;
}

export const DEMO_BUSINESS_ID = 'demo_business_al_madina';

export const DEMO_BUSINESS_PROFILE = {
  id: DEMO_BUSINESS_ID,
  user_id: 'demo_user',
  business_name: 'Al-Madina Textile Mills',
  industry: 'textile',
  base_currency: 'PKR',
  tax_system: 'GST',
  tax_rate: 18.0,
  country_code: 'PK',
  ntn_number: '1425367-8',
  strn_number: '0801987654321',
  phone: '041-8765432',
  email: 'operations@almadinatextiles.pk',
  address: 'Plot 14-B, Small Industrial Estate, Sargodha Road',
  city: 'Faisalabad',
  bank_name: 'Habib Bank Limited (HBL)',
  bank_account_title: 'Al-Madina Textile Mills',
  bank_account_number: '01234567890123',
  invoice_prefix: 'AMT-INV',
  invoice_counter: 21,
  po_prefix: 'AMT-PO',
  po_counter: 10,
  dc_prefix: 'AMT-DC',
  dc_counter: 15,
};

export const DEMO_SKUS = [
  {
    id: 'demo_sku_01',
    business_id: DEMO_BUSINESS_ID,
    name: 'Super Basmati Yarn 30/1',
    sku_code: 'DEMO-YRN-30-1',
    barcode: '896400010011',
    category: 'Yarn',
    unit: 'Bag',
    cost_price: 18500,
    sale_price: 21000,
    qty_on_hand: 145,
    reorder_level: 30,
    description: '[DEMO] Premium 30/1 combed ring-spun weaving yarn',
  },
  {
    id: 'demo_sku_02',
    business_id: DEMO_BUSINESS_ID,
    name: 'Grey Lawn Fabric 68x68',
    sku_code: 'DEMO-FAB-6868',
    barcode: '896400010028',
    category: 'Fabric',
    unit: 'Thaan',
    cost_price: 6200,
    sale_price: 7400,
    qty_on_hand: 280,
    reorder_level: 50,
    description: '[DEMO] 68x68 / 40x40 pure cotton airjet woven lawn',
  },
  {
    id: 'demo_sku_03',
    business_id: DEMO_BUSINESS_ID,
    name: 'Cotton Slub 40s',
    sku_code: 'DEMO-YRN-SLUB40',
    barcode: '896400010035',
    category: 'Yarn',
    unit: 'Bag',
    cost_price: 19800,
    sale_price: 22500,
    qty_on_hand: 90,
    reorder_level: 25,
    description: '[DEMO] Special effect slub yarn for summer apparel',
  },
  {
    id: 'demo_sku_04',
    business_id: DEMO_BUSINESS_ID,
    name: 'PC Combed 24/1',
    sku_code: 'DEMO-YRN-PC24',
    barcode: '896400010042',
    category: 'Yarn',
    unit: 'Bag',
    cost_price: 16500,
    sale_price: 18800,
    qty_on_hand: 320,
    reorder_level: 40,
    description: '[DEMO] 52/48 Polyester-Cotton blended yarn',
  },
  {
    id: 'demo_sku_05',
    business_id: DEMO_BUSINESS_ID,
    name: 'Dyed Twill 20x16',
    sku_code: 'DEMO-FAB-TWL2016',
    barcode: '896400010059',
    category: 'Fabric',
    unit: 'Meter',
    cost_price: 280,
    sale_price: 360,
    qty_on_hand: 1250,
    reorder_level: 200,
    description: '[DEMO] Heavy cotton twill fabric for workwear',
  },
  {
    id: 'demo_sku_06',
    business_id: DEMO_BUSINESS_ID,
    name: 'Cotton Cambric 60s',
    sku_code: 'DEMO-FAB-CAM60',
    barcode: '896400010066',
    category: 'Fabric',
    unit: 'Thaan',
    cost_price: 8500,
    sale_price: 10200,
    qty_on_hand: 110,
    reorder_level: 20,
    description: '[DEMO] High-density 60s lawn cambric for embroidery',
  },
  {
    id: 'demo_sku_07',
    business_id: DEMO_BUSINESS_ID,
    name: 'Melange Yarn 32/1',
    sku_code: 'DEMO-YRN-MEL32',
    barcode: '896400010073',
    category: 'Yarn',
    unit: 'Bag',
    cost_price: 20500,
    sale_price: 23200,
    qty_on_hand: 65,
    reorder_level: 20,
    description: '[DEMO] Heather grey shade combed melange yarn',
  },
  {
    id: 'demo_sku_08',
    business_id: DEMO_BUSINESS_ID,
    name: 'Polyester Filament',
    sku_code: 'DEMO-YRN-POLY-FIL',
    barcode: '896400010080',
    category: 'Yarn',
    unit: 'Kg',
    cost_price: 490,
    sale_price: 580,
    qty_on_hand: 850,
    reorder_level: 150,
    description: '[DEMO] 150D/48F textured filament yarn for selvedge',
  },
  {
    id: 'demo_sku_09',
    business_id: DEMO_BUSINESS_ID,
    name: 'Fancy Jacquard Dobby',
    sku_code: 'DEMO-FAB-JACQ',
    barcode: '896400010097',
    category: 'Fabric',
    unit: 'Meter',
    cost_price: 420,
    sale_price: 550,
    qty_on_hand: 430,
    reorder_level: 60,
    description: '[DEMO] Geometric pattern dobby weave cotton cloth',
  },
  {
    id: 'demo_sku_10',
    business_id: DEMO_BUSINESS_ID,
    name: 'Organic Cotton Poplin',
    sku_code: 'DEMO-FAB-POPLIN',
    barcode: '896400010103',
    category: 'Fabric',
    unit: 'Meter',
    cost_price: 340,
    sale_price: 440,
    qty_on_hand: 680,
    reorder_level: 100,
    description: '[DEMO] GOTS certified 100% organic cotton poplin',
  },
];

export const DEMO_PARTIES = [
  {
    id: 'demo_party_01',
    business_id: DEMO_BUSINESS_ID,
    name: 'Haji Abdul Rehman & Sons (Cloth Market)',
    party_type: 'customer',
    phone: '0300-6612345',
    city: 'Faisalabad',
    address: 'Shop 42, Gol Market, Rail Bazaar, Faisalabad',
    opening_balance: 150000,
    current_balance: 340000,
    balance_nature: 'receivable',
    credit_limit: 1000000,
    credit_terms_days: 30,
    cnic_or_ntn: '33100-8877665-1',
    notes: '[DEMO] Major wholesale fabric dealer',
  },
  {
    id: 'demo_party_02',
    business_id: DEMO_BUSINESS_ID,
    name: 'Tariq Brother Garments (Anarkali)',
    party_type: 'customer',
    phone: '0321-4567890',
    city: 'Lahore',
    address: 'Plaza 18, Bano Bazaar, Anarkali, Lahore',
    opening_balance: 50000,
    current_balance: 185000,
    balance_nature: 'receivable',
    credit_limit: 500000,
    credit_terms_days: 15,
    cnic_or_ntn: '35202-4433221-3',
    notes: '[DEMO] Export apparel manufacturer',
  },
  {
    id: 'demo_party_03',
    business_id: DEMO_BUSINESS_ID,
    name: 'Sitara Fashion Hub (Bolton Market)',
    party_type: 'customer',
    phone: '0333-2198765',
    city: 'Karachi',
    address: 'Cloth Market Building, Bolton Market, M.A Jinnah Road, Karachi',
    opening_balance: 0,
    current_balance: -45000,
    balance_nature: 'payable', // Advance customer credit
    credit_limit: 800000,
    credit_terms_days: 30,
    cnic_or_ntn: '42101-7766554-9',
    notes: '[DEMO] Paid PKR 45,000 in advance for impending shipment',
  },
  {
    id: 'demo_party_04',
    business_id: DEMO_BUSINESS_ID,
    name: 'Kohinoor Spinning Mills Ltd',
    party_type: 'supplier',
    phone: '0301-8654321',
    city: 'Rawalpindi',
    address: 'Industrial Area, GT Road, Gujar Khan, Rawalpindi',
    opening_balance: 200000,
    current_balance: 420000,
    balance_nature: 'payable',
    credit_limit: 2500000,
    credit_terms_days: 45,
    cnic_or_ntn: '0711988-4',
    notes: '[DEMO] Primary raw yarn spinning supplier',
  },
  {
    id: 'demo_party_05',
    business_id: DEMO_BUSINESS_ID,
    name: 'National Dyes & Chemical Corp',
    party_type: 'supplier',
    phone: '0312-9876543',
    city: 'Faisalabad',
    address: 'Chemical Market, Millat Road, Faisalabad',
    opening_balance: 80000,
    current_balance: 135000,
    balance_nature: 'payable',
    credit_limit: 1000000,
    credit_terms_days: 30,
    cnic_or_ntn: '2233445-9',
    notes: '[DEMO] Sizing, processing & reactive dyes supplier',
  },
];

export const DEMO_KARIGARS = [
  {
    id: 'demo_karigar_01',
    business_id: DEMO_BUSINESS_ID,
    name: 'Muhammad Aslam',
    karigar_code: 'KAR-001',
    phone: '0302-7654321',
    cnic: '33100-1234567-1',
    department: 'Weaving Unit 1',
    designation: 'Master Weaver',
    wage_type: 'piece_rate',
    piece_rate: 45.0,
    daily_wage: 0,
    peshgi_balance: 15000,
    joining_date: '2023-01-15',
    notes: '[DEMO] Senior airjet loom operator',
  },
  {
    id: 'demo_karigar_02',
    business_id: DEMO_BUSINESS_ID,
    name: 'Rashid Mehmood',
    karigar_code: 'KAR-002',
    phone: '0322-8765432',
    cnic: '33100-2345678-3',
    department: 'Weaving Unit 1',
    designation: 'Loom Operator',
    wage_type: 'piece_rate',
    piece_rate: 38.0,
    daily_wage: 0,
    peshgi_balance: 0,
    joining_date: '2023-04-10',
    notes: '[DEMO] Sulzer shuttleless specialist',
  },
  {
    id: 'demo_karigar_03',
    business_id: DEMO_BUSINESS_ID,
    name: 'Zahid Bashir',
    karigar_code: 'KAR-003',
    phone: '0345-9876543',
    cnic: '33100-3456789-5',
    department: 'Warping & Sizing',
    designation: 'Warping Expert',
    wage_type: 'piece_rate',
    piece_rate: 42.0,
    daily_wage: 0,
    peshgi_balance: 22000,
    joining_date: '2022-11-01',
    notes: '[DEMO] Warping beam preparation master',
  },
  {
    id: 'demo_karigar_04',
    business_id: DEMO_BUSINESS_ID,
    name: 'Akram Ali',
    karigar_code: 'KAR-004',
    phone: '0306-1234567',
    cnic: '33100-4567890-7',
    department: 'Weaving Unit 2',
    designation: 'Loom Operator',
    wage_type: 'piece_rate',
    piece_rate: 35.0,
    daily_wage: 0,
    peshgi_balance: 0,
    joining_date: '2023-08-20',
    notes: '[DEMO] Night shift loom technician',
  },
  {
    id: 'demo_karigar_05',
    business_id: DEMO_BUSINESS_ID,
    name: 'Ghulam Mustafa',
    karigar_code: 'KAR-005',
    phone: '0313-2345678',
    cnic: '33100-5678901-9',
    department: 'Yarn Godown',
    designation: 'Yarn Stacker',
    wage_type: 'daily_wage',
    piece_rate: 0,
    daily_wage: 1400.0,
    peshgi_balance: 0,
    joining_date: '2023-03-05',
    notes: '[DEMO] Raw cone loading & unloading',
  },
  {
    id: 'demo_karigar_06',
    business_id: DEMO_BUSINESS_ID,
    name: 'Shahid Iqbal',
    karigar_code: 'KAR-006',
    phone: '0334-3456789',
    cnic: '33100-6789012-1',
    department: 'Boiler & Utilities',
    designation: 'Boiler Attendant',
    wage_type: 'daily_wage',
    piece_rate: 0,
    daily_wage: 1600.0,
    peshgi_balance: 0,
    joining_date: '2022-09-12',
    notes: '[DEMO] Certified boiler steam operator',
  },
  {
    id: 'demo_karigar_07',
    business_id: DEMO_BUSINESS_ID,
    name: 'Tariq Jameel',
    karigar_code: 'KAR-007',
    phone: '0307-4567890',
    cnic: '33100-7890123-3',
    department: 'Dyeing & Bleaching',
    designation: 'Dyeing Assistant',
    wage_type: 'daily_wage',
    piece_rate: 0,
    daily_wage: 1500.0,
    peshgi_balance: 0,
    joining_date: '2023-06-01',
    notes: '[DEMO] Chemical bath mixing supervisor',
  },
  {
    id: 'demo_karigar_08',
    business_id: DEMO_BUSINESS_ID,
    name: 'Imtiaz Ahmad',
    karigar_code: 'KAR-008',
    phone: '0344-5678901',
    cnic: '33100-8901234-5',
    department: 'Folding & Packing',
    designation: 'Fabric Inspector',
    wage_type: 'piece_rate',
    piece_rate: 40.0,
    daily_wage: 0,
    peshgi_balance: 0,
    joining_date: '2023-02-18',
    notes: '[DEMO] Final thaan inspection & grading',
  },
];

export const DEMO_PESHGI = [
  {
    id: 'demo_peshgi_01',
    business_id: DEMO_BUSINESS_ID,
    karigar_id: 'demo_karigar_01',
    transaction_type: 'advance',
    amount: 15000,
    transaction_date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    description: '[DEMO] Family medical emergency advance',
    reference: 'VOUCHER-ADV-014',
    running_balance: 15000,
  },
  {
    id: 'demo_peshgi_02',
    business_id: DEMO_BUSINESS_ID,
    karigar_id: 'demo_karigar_03',
    transaction_type: 'advance',
    amount: 22000,
    transaction_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    description: '[DEMO] Home renovation seasonal advance',
    reference: 'VOUCHER-ADV-018',
    running_balance: 22000,
  },
];

export function generateDemoInvoices() {
  const invoices = [];
  const items = [];
  const now = Date.now();

  const sampleConfigs = [
    { customerIdx: 0, status: 'paid', daysAgo: 28, subtotal: 210000, paid: 210000 },
    { customerIdx: 1, status: 'paid', daysAgo: 26, subtotal: 148000, paid: 148000 },
    { customerIdx: 0, status: 'paid', daysAgo: 24, subtotal: 315000, paid: 315000 },
    { customerIdx: 2, status: 'paid', daysAgo: 22, subtotal: 74000, paid: 74000 },
    { customerIdx: 1, status: 'paid', daysAgo: 20, subtotal: 185000, paid: 185000 },
    { customerIdx: 0, status: 'paid', daysAgo: 18, subtotal: 250000, paid: 250000 },
    { customerIdx: 2, status: 'paid', daysAgo: 16, subtotal: 120000, paid: 120000 },
    { customerIdx: 1, status: 'paid', daysAgo: 14, subtotal: 92000, paid: 92000 },
    // Partial Invoices (7)
    { customerIdx: 0, status: 'partial', daysAgo: 12, subtotal: 360000, paid: 200000 },
    { customerIdx: 1, status: 'partial', daysAgo: 10, subtotal: 225000, paid: 100000 },
    { customerIdx: 0, status: 'partial', daysAgo: 9, subtotal: 420000, paid: 250000 },
    { customerIdx: 2, status: 'partial', daysAgo: 7, subtotal: 180000, paid: 100000 },
    { customerIdx: 1, status: 'partial', daysAgo: 6, subtotal: 280000, paid: 150000 },
    { customerIdx: 0, status: 'partial', daysAgo: 5, subtotal: 195000, paid: 100000 },
    { customerIdx: 2, status: 'partial', daysAgo: 4, subtotal: 330000, paid: 200000 },
    // Overdue Invoices (5)
    { customerIdx: 0, status: 'overdue', daysAgo: 30, subtotal: 480000, paid: 0 },
    { customerIdx: 1, status: 'overdue', daysAgo: 25, subtotal: 290000, paid: 50000 },
    { customerIdx: 0, status: 'overdue', daysAgo: 21, subtotal: 375000, paid: 0 },
    { customerIdx: 1, status: 'overdue', daysAgo: 17, subtotal: 160000, paid: 0 },
    { customerIdx: 0, status: 'overdue', daysAgo: 15, subtotal: 440000, paid: 100000 },
  ];

  for (let i = 0; i < sampleConfigs.length; i++) {
    const cfg = sampleConfigs[i];
    const party = DEMO_PARTIES[cfg.customerIdx];
    const invoiceId = `demo_inv_${String(i + 1).padStart(2, '0')}`;
    const invoiceNo = `AMT-INV-2024-${String(i + 1).padStart(3, '0')}`;
    const invDate = new Date(now - cfg.daysAgo * 86400000).toISOString().split('T')[0];
    const dueDate = new Date(now - (cfg.daysAgo - 15) * 86400000).toISOString().split('T')[0];
    const balanceDue = cfg.subtotal - cfg.paid;

    invoices.push({
      id: invoiceId,
      business_id: DEMO_BUSINESS_ID,
      invoice_number: invoiceNo,
      invoice_type: 'invoice',
      party_id: party.id,
      party_name: party.name,
      party_phone: party.phone,
      invoice_date: invDate,
      due_date: dueDate,
      status: cfg.status,
      subtotal: cfg.subtotal,
      discount_amount: 0,
      discount_percent: 0,
      tax_amount: 0,
      tax_rate: 0,
      total_amount: cfg.subtotal,
      amount_paid: cfg.paid,
      balance_due: balanceDue,
      invoice_currency: 'PKR',
      exchange_rate: 1.0,
      notes: `[DEMO] Commercial shipment reference #${i + 1}`,
      client_transaction_id: `demo_tx_${invoiceId}`,
    });

    // Add matching line item
    const sku = DEMO_SKUS[i % DEMO_SKUS.length];
    const qty = Math.max(1, Math.round(cfg.subtotal / sku.sale_price));
    items.push({
      id: `demo_inv_item_${String(i + 1).padStart(2, '0')}`,
      invoice_id: invoiceId,
      business_id: DEMO_BUSINESS_ID,
      sku_id: sku.id,
      description: `${sku.name} - Batch DEMO-2024`,
      quantity: qty,
      unit: sku.unit,
      unit_price: sku.sale_price,
      total_price: cfg.subtotal,
      sort_order: 1,
    });
  }

  return { invoices, items };
}

export function generateDemoKhataEntries() {
  const entries = [];
  const now = Date.now();

  const khataConfigs = [
    { partyIdx: 0, type: 'credit_sale', debit: 340000, credit: 0, desc: 'Credit dispatch: 45 Bags 30/1 Yarn', daysAgo: 25 },
    { partyIdx: 0, type: 'cash_receipt', debit: 0, credit: 150000, desc: 'Bank transfer received via HBL', daysAgo: 20 },
    { partyIdx: 0, type: 'cash_receipt', debit: 0, credit: 90000, desc: 'Cheque cleared #8874102', daysAgo: 12 },
    { partyIdx: 1, type: 'credit_sale', debit: 185000, credit: 0, desc: 'Dispatched 25 Thaans Grey Lawn', daysAgo: 22 },
    { partyIdx: 1, type: 'cash_receipt', debit: 0, credit: 100000, desc: 'Online Raast payment', daysAgo: 14 },
    { partyIdx: 1, type: 'credit_sale', debit: 100000, credit: 0, desc: 'Urgent weekend dispatch', daysAgo: 8 },
    { partyIdx: 2, type: 'cash_receipt', debit: 0, credit: 45000, desc: 'Advance deposit for poplin shipment', daysAgo: 5 },
    { partyIdx: 3, type: 'supplier_bill', debit: 0, credit: 420000, desc: 'Received 100 Cotton Cones from Kohinoor', daysAgo: 28 },
    { partyIdx: 3, type: 'supplier_payment', debit: 200000, credit: 0, desc: 'Direct supplier wire transfer', daysAgo: 18 },
    { partyIdx: 4, type: 'supplier_bill', debit: 0, credit: 135000, desc: 'Dyes & Sizing Chemical Drums arrived', daysAgo: 16 },
    { partyIdx: 4, type: 'supplier_payment', debit: 50000, credit: 0, desc: 'Cross cheque issued #901234', daysAgo: 9 },
    { partyIdx: 0, type: 'credit_sale', debit: 240000, credit: 0, desc: 'Export packing lawn parcel', daysAgo: 4 },
    { partyIdx: 1, type: 'cash_receipt', debit: 0, credit: 50000, desc: 'Cash payment handed to driver', daysAgo: 3 },
    { partyIdx: 3, type: 'supplier_bill', debit: 0, credit: 200000, desc: 'Additional PC Combed consignment', daysAgo: 2 },
    { partyIdx: 4, type: 'supplier_payment', debit: 30000, credit: 0, desc: 'Cash paid on delivery voucher', daysAgo: 1 },
  ];

  for (let i = 0; i < khataConfigs.length; i++) {
    const cfg = khataConfigs[i];
    const party = DEMO_PARTIES[cfg.partyIdx];
    const dateStr = new Date(now - cfg.daysAgo * 86400000).toISOString().split('T')[0];

    entries.push({
      id: `demo_ledger_${String(i + 1).padStart(2, '0')}`,
      business_id: DEMO_BUSINESS_ID,
      party_id: party.id,
      account_code: '4000-TRADE',
      entry_type: cfg.type,
      entry_date: dateStr,
      description: `[DEMO] ${cfg.desc}`,
      debit: cfg.debit,
      credit: cfg.credit,
      reference: `DEMO-REF-${1000 + i}`,
      source_table: 'invoices',
      created_by: 'Demo Manager',
    });
  }

  return entries;
}

export function generateDemoAttendance() {
  const today = new Date().toISOString().split('T')[0];

  // 10 Attendance records: 7 present, 1 half day, 1 absent, 1 on leave
  const attendanceConfigs = [
    { karigarIdx: 0, status: 'present', checkIn: '08:00', checkOut: '17:00', note: '[DEMO] Loom #1 full shift' },
    { karigarIdx: 1, status: 'present', checkIn: '08:05', checkOut: '17:15', note: '[DEMO] Airjet loom shift' },
    { karigarIdx: 2, status: 'present', checkIn: '07:55', checkOut: '17:00', note: '[DEMO] Warping beams completed' },
    { karigarIdx: 3, status: 'present', checkIn: '08:10', checkOut: '17:00', note: '[DEMO] High piece count' },
    { karigarIdx: 4, status: 'present', checkIn: '08:00', checkOut: '17:00', note: '[DEMO] Warehouse on duty' },
    { karigarIdx: 5, status: 'present', checkIn: '07:45', checkOut: '16:45', note: '[DEMO] Boiler operating steady' },
    { karigarIdx: 6, status: 'present', checkIn: '08:00', checkOut: '17:00', note: '[DEMO] Sizing chemicals checked' },
    { karigarIdx: 7, status: 'half', checkIn: '08:00', checkOut: '12:30', note: '[DEMO] Left at 12:30 PM due to fever' },
    // 9th record
    { karigarIdx: 1, status: 'absent', checkIn: null, checkOut: null, note: '[DEMO] Absent without prior notice' },
    // 10th record
    { karigarIdx: 3, status: 'absent', checkIn: null, checkOut: null, note: '[DEMO] Scheduled leave for exam' },
  ];

  return attendanceConfigs.map((cfg, i) => {
    const karigar = DEMO_KARIGARS[cfg.karigarIdx];
    return {
      id: `demo_att_${String(i + 1).padStart(2, '0')}`,
      business_id: DEMO_BUSINESS_ID,
      karigar_id: karigar.id,
      attendance_date: today,
      status: cfg.status,
      check_in_time: cfg.checkIn,
      check_out_time: cfg.checkOut,
      notes: cfg.note,
      marked_by: 'Supervisor Asif',
    };
  });
}

/**
 * Execute demo data insertion in a single atomic SQLite transaction
 */
export function seedDemoDataToSqlite(sqlite: any): { success: boolean; message: string } {
  if (!sqlite) {
    throw new Error('SQLite instance is not available');
  }

  const { invoices, items } = generateDemoInvoices();
  const khataEntries = generateDemoKhataEntries();
  const attendanceRecords = generateDemoAttendance();

  const runTx = sqlite.transaction(() => {
    // 1. Business Profile
    const stmtBiz = sqlite.prepare(`
      INSERT OR REPLACE INTO business_profiles (
        id, user_id, business_name, industry, base_currency, tax_system, tax_rate,
        country_code, ntn_number, strn_number, phone, email, address, city,
        bank_name, bank_account_title, bank_account_number, invoice_prefix,
        invoice_counter, po_prefix, po_counter, dc_prefix, dc_counter
      ) VALUES (
        @id, @user_id, @business_name, @industry, @base_currency, @tax_system, @tax_rate,
        @country_code, @ntn_number, @strn_number, @phone, @email, @address, @city,
        @bank_name, @bank_account_title, @bank_account_number, @invoice_prefix,
        @invoice_counter, @po_prefix, @po_counter, @dc_prefix, @dc_counter
      )
    `);
    stmtBiz.run(DEMO_BUSINESS_PROFILE);

    // 2. SKUs
    const stmtSku = sqlite.prepare(`
      INSERT OR REPLACE INTO skus (
        id, business_id, name, sku_code, barcode, category, unit,
        cost_price, sale_price, qty_on_hand, reorder_level, description
      ) VALUES (
        @id, @business_id, @name, @sku_code, @barcode, @category, @unit,
        @cost_price, @sale_price, @qty_on_hand, @reorder_level, @description
      )
    `);
    for (const sku of DEMO_SKUS) {
      stmtSku.run(sku);
    }

    // 3. Parties
    const stmtParty = sqlite.prepare(`
      INSERT OR REPLACE INTO parties (
        id, business_id, name, party_type, phone, city, address,
        opening_balance, current_balance, balance_nature, credit_limit,
        credit_terms_days, cnic_or_ntn, notes
      ) VALUES (
        @id, @business_id, @name, @party_type, @phone, @city, @address,
        @opening_balance, @current_balance, @balance_nature, @credit_limit,
        @credit_terms_days, @cnic_or_ntn, @notes
      )
    `);
    for (const p of DEMO_PARTIES) {
      stmtParty.run(p);
    }

    // 4. Karigars
    const stmtKarigar = sqlite.prepare(`
      INSERT OR REPLACE INTO karigars (
        id, business_id, name, karigar_code, phone, cnic, department,
        designation, wage_type, piece_rate, daily_wage, peshgi_balance,
        joining_date, notes
      ) VALUES (
        @id, @business_id, @name, @karigar_code, @phone, @cnic, @department,
        @designation, @wage_type, @piece_rate, @daily_wage, @peshgi_balance,
        @joining_date, @notes
      )
    `);
    for (const k of DEMO_KARIGARS) {
      stmtKarigar.run(k);
    }

    // 5. Peshgi Advances
    const stmtPeshgi = sqlite.prepare(`
      INSERT OR REPLACE INTO peshgi_transactions (
        id, business_id, karigar_id, transaction_type, amount,
        transaction_date, description, reference, running_balance
      ) VALUES (
        @id, @business_id, @karigar_id, @transaction_type, @amount,
        @transaction_date, @description, @reference, @running_balance
      )
    `);
    for (const pesh of DEMO_PESHGI) {
      stmtPeshgi.run(pesh);
    }

    // 6. Invoices
    const stmtInv = sqlite.prepare(`
      INSERT OR REPLACE INTO invoices (
        id, business_id, invoice_number, invoice_type, party_id,
        party_name, party_phone, invoice_date, due_date, status,
        subtotal, discount_amount, discount_percent, tax_amount, tax_rate,
        total_amount, amount_paid, balance_due, invoice_currency, exchange_rate,
        notes, client_transaction_id
      ) VALUES (
        @id, @business_id, @invoice_number, @invoice_type, @party_id,
        @party_name, @party_phone, @invoice_date, @due_date, @status,
        @subtotal, @discount_amount, @discount_percent, @tax_amount, @tax_rate,
        @total_amount, @amount_paid, @balance_due, @invoice_currency, @exchange_rate,
        @notes, @client_transaction_id
      )
    `);
    for (const inv of invoices) {
      stmtInv.run(inv);
    }

    // 7. Invoice Items
    const stmtItem = sqlite.prepare(`
      INSERT OR REPLACE INTO invoice_items (
        id, invoice_id, business_id, sku_id, description,
        quantity, unit, unit_price, total_price, sort_order
      ) VALUES (
        @id, @invoice_id, @business_id, @sku_id, @description,
        @quantity, @unit, @unit_price, @total_price, @sort_order
      )
    `);
    for (const it of items) {
      stmtItem.run(it);
    }

    // 8. Khata / Ledger
    const stmtLedger = sqlite.prepare(`
      INSERT OR REPLACE INTO ledger_entries (
        id, business_id, party_id, account_code, entry_type,
        entry_date, description, debit, credit, reference,
        source_table, created_by
      ) VALUES (
        @id, @business_id, @party_id, @account_code, @entry_type,
        @entry_date, @description, @debit, @credit, @reference,
        @source_table, @created_by
      )
    `);
    for (const ent of khataEntries) {
      stmtLedger.run(ent);
    }

    // 9. Attendance
    const stmtAtt = sqlite.prepare(`
      INSERT OR REPLACE INTO attendance_logs (
        id, business_id, karigar_id, attendance_date, status,
        check_in_time, check_out_time, notes, marked_by
      ) VALUES (
        @id, @business_id, @karigar_id, @attendance_date, @status,
        @check_in_time, @check_out_time, @notes, @marked_by
      )
    `);
    for (const att of attendanceRecords) {
      try {
        stmtAtt.run(att);
      } catch {
        // Attendance table has UNIQUE(karigar_id, attendance_date)
      }
    }
  });

  runTx();
  return { success: true, message: 'Al-Madina Textile Mills demo dataset seeded successfully.' };
}

/**
 * Remove only demo-tagged records without touching any user production data
 */
export function clearDemoDataFromSqlite(sqlite: any): { success: boolean; message: string } {
  if (!sqlite) {
    throw new Error('SQLite instance is not available');
  }

  const runTx = sqlite.transaction(() => {
    sqlite.prepare("DELETE FROM invoice_items WHERE invoice_id LIKE 'demo_%' OR business_id = ?").run(DEMO_BUSINESS_ID);
    sqlite.prepare("DELETE FROM invoices WHERE id LIKE 'demo_%' OR business_id = ?").run(DEMO_BUSINESS_ID);
    sqlite.prepare("DELETE FROM peshgi_transactions WHERE id LIKE 'demo_%' OR business_id = ?").run(DEMO_BUSINESS_ID);
    sqlite.prepare("DELETE FROM attendance_logs WHERE id LIKE 'demo_%' OR karigar_id LIKE 'demo_%' OR business_id = ?").run(DEMO_BUSINESS_ID);
    sqlite.prepare("DELETE FROM ledger_entries WHERE id LIKE 'demo_%' OR party_id LIKE 'demo_%' OR business_id = ?").run(DEMO_BUSINESS_ID);
    sqlite.prepare("DELETE FROM skus WHERE id LIKE 'demo_%' OR business_id = ?").run(DEMO_BUSINESS_ID);
    sqlite.prepare("DELETE FROM parties WHERE id LIKE 'demo_%' OR business_id = ?").run(DEMO_BUSINESS_ID);
    sqlite.prepare("DELETE FROM karigars WHERE id LIKE 'demo_%' OR business_id = ?").run(DEMO_BUSINESS_ID);
    sqlite.prepare('DELETE FROM business_profiles WHERE id = ?').run(DEMO_BUSINESS_ID);
  });

  runTx();
  return { success: true, message: 'Demo records removed cleanly.' };
}

/**
 * Client-Side API Dispatchers
 */
export async function loadDemoData(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'load' }),
    });
    const data = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem('noxis_demo_mode_active', 'true');
      localStorage.setItem('noxis_demo_saved_biz_id', localStorage.getItem('noxis_business_id') || '');
      localStorage.setItem('noxis_business_id', DEMO_BUSINESS_ID);
      window.dispatchEvent(new CustomEvent('noxis_demo_mode_changed', { detail: { active: true } }));
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to load demo data' };
  }
}

export async function clearDemoData(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' }),
    });
    const data = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('noxis_demo_mode_active');
      const savedBizId = localStorage.getItem('noxis_demo_saved_biz_id');
      if (savedBizId) {
        localStorage.setItem('noxis_business_id', savedBizId);
        localStorage.removeItem('noxis_demo_saved_biz_id');
      }
      window.dispatchEvent(new CustomEvent('noxis_demo_mode_changed', { detail: { active: false } }));
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to clear demo data' };
  }
}

