// src/lib/sentinel/sentinelBrain.ts
// ─────────────────────────────────────────────────────────────────────────────
// NOXIS SENTINEL DEEP BRAIN v2.0
// 100% Offline Multi-Tier Reasoning, Mistake Correction & Practical Auto-Pilot
// All existing interfaces, exports, and function signatures PRESERVED EXACTLY.
// Only knowledge depth and coverage expanded.
// ─────────────────────────────────────────────────────────────────────────────

export interface PracticalAction {
  label: string;
  route: string;
  description?: string;
  shortcut?: string;
  actionType?: 'navigate' | 'modal' | 'command';
  title?: string;
  steps?: string[];
  actionId?: string;
}

export interface BrainResponse {
  answer: string;
  thoughtProcess?: string;
  correctionTip?: string;
  practicalAction?: PracticalAction;
  suggestions: string[];
  moduleBadge?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1 — MISTAKE CORRECTION ENGINE
// Detects when user is doing something wrong and corrects with the right way.
// Covers every major operational mistake in Pakistani textile & factory context.
// ─────────────────────────────────────────────────────────────────────────────

interface CorrectionPattern {
  triggers: string[];
  correctedConcept: string;
  tip: string;
  route: string;
  actionLabel: string;
}

const COMMON_MISTAKES: CorrectionPattern[] = [
  // ── INVOICE / BILL MISTAKES ──
  {
    triggers: [
      'delete bill', 'bill delete', 'bill ghalat hogya',
      'invoice galat ban gai', 'wrong amount in bill',
      'paise zyada likh diye', 'bill cancel karna', 'invoice mitana',
      'bill kat do', 'invoice delete', 'ghalat rate likh di',
    ],
    correctedConcept: 'Credit Note / Sales Return',
    tip: 'Industrial accounting me finalized bill ko direct delete nahi kiya jata — warna audit trail kharab hoti hai aur tax record bhi bigarta hai. Iski jagah "Credit Note" issue karein ya Khata Reversal dalein taake customer ka balance aur stock dono auto-adjust ho jayein. Purana bill sirf void ho ga, delete nahi.',
    route: '/invoices',
    actionLabel: 'Open Invoices & Issue Credit Note',
  },
  {
    triggers: [
      'bill me rate ghalat', 'rate change karna', 'item ka rate theek karna',
      'wrong price on invoice', 'bill ki price badalni hai',
    ],
    correctedConcept: 'Invoice Amendment via Credit Note',
    tip: 'Posted invoice ki price directly edit nahi hoti. Pehle usi raqam ka Credit Note issue karein, phir correct rate par naya invoice banayein. Is tariqay se audit log bhi mehfooz rehta hai.',
    route: '/invoices',
    actionLabel: 'Issue Credit Note & Reissue Invoice',
  },

  // ── KARIGAR / PESHGI MISTAKES ──
  {
    triggers: [
      'karigar ke paise kat gaye', 'peshgi ghalat kaat li',
      'advance wrong', 'karigar balance minus', 'mazdoor ka pesa ghalat',
      'karigar ki peshgi zyada kat gai', 'ulta kaat liya',
    ],
    correctedConcept: 'Peshgi Adjustment / Reversal Voucher',
    tip: 'Agar karigar ki peshgi ghalat deduct ho gai hai to Karigars → Peshgi Ledger me ja kar "Peshgi Reversal" voucher post karein. System woh raqam wapis karigar ke credit me daal dega aur agley payday par adjust ho jaye ga.',
    route: '/karigars',
    actionLabel: 'Go to Karigar Peshgi Ledger',
  },
  {
    triggers: [
      'karigar ne kam kiya', 'production log galat', 'meters ghalat likhe',
      'units wrong enter', 'production ghalat darj hogya',
    ],
    correctedConcept: 'Production Log Correction',
    tip: 'Aaj ka production log same day me edit ho sakta hai. Kal ke baad ke production records ko sirf manager ya owner role edit kar sakta hai, aur edit ka audit trail automatically ban jata hai.',
    route: '/karigars',
    actionLabel: 'Edit Production Log',
  },

  // ── CASH / GALLA MISTAKES ──
  {
    triggers: [
      'galla tally nahi ho raha', 'cash match nahi ho raha',
      'cash difference', 'paise kam hain', 'drawer difference',
      'galla kam nikla', 'naqad zyada ho gaya', 'counting mismatch',
    ],
    correctedConcept: 'Daily Munshi Z-Report Audit',
    tip: 'Galla mismatch ki sabse aam waja: non-invoiced chotay kharchay (chai, rickshaw, stationery, bijli bill) jo cash se nikale gaye the. Daily Z-Report open karein, "Petty Expense" section verify karein aur missing entries add karein. Phir physical cash se dobara tally karein.',
    route: '/reports',
    actionLabel: 'Open Daily Z-Report Cash Audit',
  },
  {
    triggers: [
      'petty cash', 'chhuti expense', 'chota kharcha', 'chai pani',
      'miscellaneous expense', 'rickshaw', 'stationery kharcha',
    ],
    correctedConcept: 'Petty Cash Voucher',
    tip: 'Har chhota cash kharcha "Petty Cash Voucher" se record karna zaroori hai warna galla tally nahi hota. Finance → Petty Cash me ja kar daily entries dalein taake month-end par koi surprise na ho.',
    route: '/finance',
    actionLabel: 'Open Petty Cash Register',
  },

  // ── CHEQUE / BANK MISTAKES ──
  {
    triggers: [
      'cheque bounce', 'check bounce', 'cheque wapis agya',
      'bank ne cheque wapis kardiya', 'dishonour', 'dishonor cheque',
      'cheque clear nahi hua',
    ],
    correctedConcept: 'Cheque Dishonour & Khata Debit Reversal',
    tip: 'Cheque bounce hone par seedha cash wapas na lein. Pehle Khata → Cheques tab me ja kar cheque ko "Mark Bounced" karein. System automatically: (1) Customer ka udhar wapis charha deta hai, (2) Bank penalty fee add karta hai, (3) WhatsApp notice bhejta hai.',
    route: '/khata',
    actionLabel: 'Mark Cheque as Bounced',
  },
  {
    triggers: [
      'bank entry ghalat', 'bank me amount ghalat', 'wrong bank entry',
      'bank reconciliation', 'bank statement match nahi',
    ],
    correctedConcept: 'Bank Reconciliation & Journal Correction',
    tip: 'Bank me ghalat entry hone par Journal Voucher (JV) se reversal post karein. Phir correct entry dalein. Bank Reconciliation module me CSV statement import kar ke system entries se auto-match karein.',
    route: '/khata',
    actionLabel: 'Open Bank Reconciliation',
  },

  // ── STOCK / INVENTORY MISTAKES ──
  {
    triggers: [
      'stock minus ho gaya', 'inventory negative', 'maal minus dikhta hai',
      'stock ghalat', 'qty wrong', 'thaan ghalat darj', 'meters ghalat',
    ],
    correctedConcept: 'Stock Adjustment Voucher',
    tip: 'Negative stock hone ki wajah ya to ghalat invoice ya opening balance ki ghalat entry hoti hai. Inventory → Stock Adjustments me ja kar "Manual Adjustment" voucher post karein aur sahi qty darj karein. Reason me "Correction" likhein taake audit trail saaf rahe.',
    route: '/inventory',
    actionLabel: 'Open Stock Adjustment Console',
  },
  {
    triggers: [
      'maal wapis aaya', 'return maal', 'supplier ne maal wapas liya',
      'purchase return', 'maal reject hua', 'maal ghalat aaya',
    ],
    correctedConcept: 'Purchase Return / Debit Note',
    tip: 'Supplier ka maal wapis karne par "Purchase Return" ya "Debit Note" issue karein. Ye automatically stock se maal minus karega aur supplier ke khate me credit daal dega. Seedhi entry mat karo.',
    route: '/purchase',
    actionLabel: 'Create Purchase Return (Debit Note)',
  },

  // ── DISPLAY / UI MISTAKES ──
  {
    triggers: [
      'screen bari ho gai', 'buttons bahir nikal gae', 'zoom out kaise karun',
      'layout zoom', 'font bara ho gaya', 'sab kuch bada dikh raha hai',
      'layout toot gaya', 'screen cut off', 'buttons nazar nahi aa rahay',
    ],
    correctedConcept: 'Display Zoom Reset (Ctrl + 0)',
    tip: 'Aapka screen zoom 100% se barh gaya hai. Keyboard par Ctrl + 0 (zero) dabayein — screen foran original size par aa jaye gi. Ctrl + Minus ( - ) se zoom out aur Ctrl + Plus ( + ) se zoom in hota hai.',
    route: '/dashboard',
    actionLabel: 'Go to Dashboard (Zoom Reset)',
  },

  // ── GATE PASS / SECURITY MISTAKES ──
  {
    triggers: [
      'chowkidar ko rate pata chal gya', 'guard ko rate na dikhe',
      'parcha print', 'chori ka darr', 'loader ne rate dekha',
      'maal ka rate mat dikhao', 'confidential slip',
    ],
    correctedConcept: 'Confidential Gate Pass — Price Hidden',
    tip: 'Sales invoice gate par mat dein — us me rate hote hain. Dispatch → Gate Pass mode se "Parcha / No Price Slip" print karein. Isme sirf Nag, Thaan, Gaz aate hain, rate 100% chuppe rehte hain. Guard barcode scan kar ke verify karta hai — duplicate pass instant reject hota hai.',
    route: '/dispatch',
    actionLabel: 'Print Confidential Gate Pass',
  },

  // ── PAYROLL MISTAKES ──
  {
    triggers: [
      'payslip ghalat', 'salary wrong', 'mazdoori ghalat nikli',
      'payroll mistake', 'overtime nahi add hua', 'bonus bhool gaya',
    ],
    correctedConcept: 'Payroll Adjustment Before Finalizing',
    tip: 'Payroll finalize hone se pehle individual karigar ki entry edit ho sakti hai. Finalize ke baad adjustment voucher issue karna hoga. Karigars → Payroll → [Month] → Edit Entry se changes karein.',
    route: '/karigars',
    actionLabel: 'Edit Payroll Entry',
  },

  // ── DATA ENTRY MISTAKES ──
  {
    triggers: [
      'duplicate entry', 'dobara darj', 'same bill do baar', 'double invoice',
      'duplicate customer', 'party dobara ban gai',
    ],
    correctedConcept: 'Duplicate Detection & Merge',
    tip: 'Duplicate invoices automatically detect hoti hain via idempotency system. Duplicate party merge karne ke liye Parties → [Party] → Merge Duplicate option use karein. Duplicate invoice ko void karein, delete nahi.',
    route: '/parties',
    actionLabel: 'Manage & Merge Duplicate Parties',
  },

  // ── OPENING BALANCE MISTAKES ──
  {
    triggers: [
      'opening balance ghalat', 'shuru ka balance wrong', 'pehle din ka hisab',
      'old balance enter karna', 'purana udhar dalein',
    ],
    correctedConcept: 'Opening Balance Correction via Journal Voucher',
    tip: 'Opening balance ghalat ho jaye to seedha edit mat karein (warna accounting equation bigad sakti hai). Settings → Opening Balances me ja kar Journal Voucher se reversal post karein aur correct amount dalein. DR = CR zaroori hai.',
    route: '/settings',
    actionLabel: 'Go to Opening Balances',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2 — COMPREHENSIVE DOMAIN KNOWLEDGE
// Full A to Z operational knowledge for Pakistani textile, wholesale, factory.
// Every module covered with Urdu explanation + practical steps.
// ─────────────────────────────────────────────────────────────────────────────

interface DomainTopic {
  keywords: string[];
  title: string;
  module: string;
  explanationUrdu: string;
  practicalSteps: string[];
  action: PracticalAction;
  followUps: string[];
}

const DOMAIN_KNOWLEDGE: DomainTopic[] = [

  // ══════════════════════════════════════════
  // SYSTEM OVERVIEW & WELCOME
  // ══════════════════════════════════════════
  {
    keywords: [
      'hi', 'hello', 'salam', 'assalam', 'shuru', 'start', 'pehli baar',
      'guide', 'kya karta hai', 'help', 'overview', 'a to z', 'kya hai',
      'noxis kya hai', 'system overview', 'modules kya hain', 'features',
    ],
    title: 'Noxis Industrial Hub — Complete System Guide',
    module: 'System Intelligence',
    explanationUrdu: `Main Noxis Sentinel AI hun — aapke poore karobar ka digital munshi. Main inhe sambhalata hun:

🏭 **Factory & Production:** Karigar piece-rate, attendance, peshgi, payroll, loom production logs
📦 **Inventory & Stock:** SKU management, batch tracking, expiry alerts, reorder points
📒 **Khata Ledger:** Double-entry accounting, party balances, cheques, bank reconciliation
🧾 **Billing & Sales:** POS counter, invoices, quotations, credit notes, sales returns
🚚 **Dispatch & Logistics:** Gate pass, bilty tracking, delivery challans
📊 **Financial Reports:** P&L, trial balance, aging, cash flow, Z-report
👁️ **CCTV & Security:** IP camera feeds, motion alerts, gate barcode verification
📱 **Mobile Floor App:** Android companion for supervisors — attendance, production, stock scan

Noxis 100% offline chalti hai — internet sirf WhatsApp aur cloud backup ke liye chahiye.`,
    practicalSteps: [
      '1. Setup → Apna business profile, tax settings aur currency configure karein',
      '2. Inventory → Apna maal/kapra SKU banayein aur opening stock dalein',
      '3. Parties → Grahakon aur suppliers ke accounts banayein',
      '4. Karigars → Workers add karein, piece rate set karein',
      '5. POS ya Invoices → Pehla bill banayein',
    ],
    action: {
      label: 'Open Business Dashboard',
      route: '/dashboard',
      description: 'Go to main operations console',
    },
    followUps: [
      'Inventory me maal kaise dalein?',
      'Karigar ki peshgi kaise set karein?',
      'Khata me udhar kaise likhein?',
      'Pehla bill kaise banayein?',
      'Mobile app kaise connect karein?',
    ],
  },

  // ══════════════════════════════════════════
  // ══════════════════════════════════════════
  // B2B SALES INVOICES & WHOLESALE BILLING
  // ══════════════════════════════════════════
  {
    keywords: [
      'invoice', 'invoices', 'bill banana', 'invoice banana', 'sales invoice',
      'b2b bill', 'tax invoice', 'commercial invoice', 'naya bill', 'challan bill',
      'grahak ka bill', 'customer invoice', 'invoice create', 'sale bill',
      'wholesale bill', 'credit bill', 'invoice new', 'new invoice',
      'mujhe invoice banana nahi ata', 'invoice kaise banayein',
    ],
    title: 'B2B Sales Invoices & Wholesale Billing',
    module: 'Invoices & Billing',
    explanationUrdu: `Noxis me **Sales Invoices** aur **POS Counter** do bilkul mukhtalif aur alag modules hain:

• **Sales Invoices (/invoices/new)**: Formal B2B Wholesale & Tax Invoicing:
  - Customer / Party ka running Khata account select hota hai
  - Thaan, Gaz, Meters, ya Suits ki detail, unit price aur fabric quality add hoti hai
  - Udhar (Credit terms 15/30/60 days), Bank Cheque ya Cash deal set hoti hai
  - Pakistan FBR GST (18%) ya UAE VAT (5%) compliant NTN/STRN invoices banti hain
  - Formal A4 invoice print, delivery challan, aur 1-click WhatsApp customer statement nikalta hai
  - Finalize karne par stock godown se minus hota hai aur customer ke Khate me automatic debit entry chali jati hai.

• **POS Counter (/pos)**: Retail cash counter aur barcode scanning ke liye fast thermal parchi desk hai.`,
    practicalSteps: [
      '1. Sales Invoice Console open karein (/invoices/new)',
      '2. Customer / Party dropdown se buyer select karein ya naya grahak darj karein',
      '3. Fabric item / SKU chunein, Thaan/Gaz count aur negotiated unit rate enter karein',
      '4. Payment terms set karein (Udhar/Credit, Cheque, ya Cash)',
      '5. "Finalize Invoice" dabayein — stock foran deduct hoga aur Party ke Khata Ledger me entry post ho jayegi',
    ],
    action: {
      label: 'Create Wholesale Sales Invoice',
      route: '/invoices/new',
      description: 'Open B2B sales invoice creation console',
      shortcut: 'Ctrl+K → Invoices',
    },
    followUps: [
      'Customer ka udhar balance invoice par kaise dikhta hai?',
      'Sales return ya credit note kaise banayein?',
      'FBR tax invoice header kaise print karein?',
      'Invoice customer ko WhatsApp par kaise bhejein?',
      'Delivery challan gate pass ke sath kaise link hota hai?',
    ],
  },

  // ══════════════════════════════════════════
  // POS — BILLING COUNTER
  // ══════════════════════════════════════════
  {
    keywords: [
      'pos', 'pos counter', 'thermal bill', 'parchi', 'counter sale', 'retail sale',
      'cash counter', 'barcode scan', 'quick sale', 'f10', 'cart', 'cashier desk',
    ],
    title: 'POS Billing Counter — Thermal Invoice Engine',
    module: 'Sales & Billing',
    explanationUrdu: `Noxis POS Counter fastest possible billing ke liye banaya gaya hai:

**Keyboard Shortcuts:**
• **F2** — Search bar focus (item dhundo)
• **F10** — Sale complete karo (payment)
• **Barcode scan** — Auto-item add, zero typing

**Bill Types:**
• Cash bill — naqad raqam, foran settled
• Credit bill — party ke khate me udhar charh jata hai
• Split payment — cash + bank + credit mixture

**After Sale:**
• 58mm/80mm thermal receipt auto-print
• WhatsApp invoice ek click me customer ko
• PDF A4 formal invoice
• Stock automatically deduct ho jata hai`,
    practicalSteps: [
      'POS Counter open karein (sidebar → POS)',
      'Item ka naam ya barcode type karein ya scan karein',
      'Quantity set karein, discount lagayein agar chahiye',
      'Payment method chunein (Cash / Bank / Credit)',
      'F10 dabayein ya "Complete Sale" click karein',
      'Thermal receipt print hogi, WhatsApp button se customer ko bhejein',
    ],
    action: {
      label: 'Open POS Counter',
      route: '/pos',
      description: 'Start billing customers immediately',
      shortcut: 'Ctrl+K → POS',
    },
    followUps: [
      'Split payment kaise karein?',
      'Customer ka udhar bill kaise banayein?',
      'Discount kaise lagayein?',
      'Thermal printer kaise connect karein?',
      'Bill ke baad WhatsApp kaise karein?',
    ],
  },

  // ══════════════════════════════════════════
  // INVENTORY & STOCK
  // ══════════════════════════════════════════
  {
    keywords: [
      'inventory', 'stock', 'maal', 'item', 'sku', 'kapra', 'thaan',
      'product', 'barcode', 'reorder', 'low stock', 'expiry', 'batch',
      'maal add karna', 'naya item', 'stock khatam', 'maal khatam',
      'stock adjustment', 'physical count', 'stock opning',
    ],
    title: 'Inventory & Stock Management — Complete Guide',
    module: 'Inventory',
    explanationUrdu: `Noxis Inventory module textile aur factory ke liye khaas taur par banaya gaya hai:

**Kya kya manage hota hai:**
• SKU / Item master with barcode
• Batch numbers aur expiry tracking
• Multiple units of measure (Meter, Yard, Thaan, Maund, Kg, Pcs)
• Reorder levels — automatically alert aata hai
• Opening stock import (Excel se)
• Physical stock count verification

**Stock Alerts:**
🔴 Out of stock — bilkul khatam
🟡 Low stock — reorder level cross ho gaya
🟠 Expiry alert — 30 din ke andar expire hoga

**Stock kahan se ghata hai:**
Every POS sale ya invoice post karne se stock automatically deduct hota hai. Manual adjustments ke liye Stock Adjustment voucher use karein.`,
    practicalSteps: [
      'Inventory → "New Item" button dabayein',
      'Item ka naam, unit, aur cost/sale price dalein',
      'Barcode dalein (agar hai) ya system auto-generate karega',
      'Opening stock quantity darj karein',
      'Reorder level set karein (alert ke liye)',
      'Save karein — ab yeh item billing me available hai',
    ],
    action: {
      label: 'Open Inventory Manager',
      route: '/inventory',
      description: 'Add items, check stock, manage batches',
    },
    followUps: [
      'Excel se bulk items import kaise karein?',
      'Batch tracking kya hota hai?',
      'Stock khatam hone par alert kaise lagayein?',
      'Physical stock count kaise karein?',
      'Maal wapis aaye to stock kaise badhe ga?',
    ],
  },

  // ══════════════════════════════════════════
  // KHATA LEDGER & ACCOUNTING
  // ══════════════════════════════════════════
  {
    keywords: [
      'khata', 'ledger', 'udhar', 'wasooli', 'party', 'beopari', 'jama',
      'naam', 'debit', 'credit', 'balance', 'hisab', 'muhasba', 'accounts',
      'double entry', 'journal', 'voucher', 'trial balance', 'p&l',
      'profit loss', 'balance sheet', 'receivable', 'payable',
    ],
    title: 'Khata Dual-Entry Ledger — Complete Accounting Guide',
    module: 'Khata Accounting',
    explanationUrdu: `Noxis Khata sirf aam bahi nahi — yeh full double-entry accounting system hai:

**Party Types:**
• Customer (Grahak) — jo aapse khareedta hai
• Supplier (Baekaar/Supplier) — jisse aap khareedte hain
• Both — jo dono hain

**Voucher Types:**
📝 Sales Receipt — customer ne cash/cheque diya
📝 Purchase Payment — supplier ko payment ki
📝 Journal Entry — manual correction ya adjustment
📝 Bank Transfer — account se account
📝 Cheque — pending clearance track hota hai

**Reports (sab ek jagah):**
• Party Ledger Statement → WhatsApp par bhejna
• Trial Balance → DR = CR check
• Profit & Loss → actual munafa
• Balance Sheet → total karobar ki haisiyat
• Aging Report → kitna purana udhar hai`,
    practicalSteps: [
      'Khata → "Post Transaction" dabayein',
      'Party select karein (customer ya supplier)',
      'Transaction type chunein (Receipt / Payment / Journal)',
      'Raqam aur date darj karein',
      'Reference number likhin (cheque number ya bill #)',
      'Save karein — balance foran update ho jata hai',
      '"Send Statement" se customer ko WhatsApp par hisab bhejein',
    ],
    action: {
      label: 'Open Khata Ledger',
      route: '/khata',
      description: 'View balances, post vouchers, send statements',
    },
    followUps: [
      'Customer ko WhatsApp par hisab kaise bhejein?',
      'Cheque record kaise karein?',
      'Trial balance kaise check karein?',
      'Profit aur loss report kaise nikalein?',
      'Old udhar ka kya karein?',
    ],
  },

  // ══════════════════════════════════════════
  // KARIGARS, PESHGI & PAYROLL
  // ══════════════════════════════════════════
  {
    keywords: [
      'karigar', 'mazdoor', 'peshgi', 'advance', 'piece rate', 'khaddi',
      'loom', 'wages', 'hafta', 'payday', 'attendance', 'haazri',
      'payslip', 'salary', 'production log', 'worker', 'floor',
      'eobi', 'overtime', 'bonus', 'deduction',
    ],
    title: 'Karigar Master, Piece-Rate & Payroll Engine',
    module: 'Workforce & Factory Floor',
    explanationUrdu: `Factory aur karkhane me sab se zyada jhagra karigar ki mazdoori par hota hai. Noxis ne yeh problem permanently hal kar di hai:

**Mazdoori ka tarika:**
• Piece Rate — har unit (meter/thaan/suit) par fix rate
• Daily Wage — din ki fix rate
• Monthly Salary — mahana fix pay

**Peshgi System (Cash Advances):**
• Har peshgi separately record hoti hai
• Payday par automatically gross se minus ho jati hai
• Peshgi ledger per-karigar dikhta hai

**Attendance (3 tarikay):**
1. PC se manual mark (P/A/Half)
2. Mobile app se supervisor floor par mark karay
3. Biometric terminal se auto-import

**Payday Process:**
1. Month end par "Generate Payroll" dabayein
2. System har karigar ki net pay calculate karega
3. Bulk thermal payslips print karein
4. EOBI deduction automatically apply hota hai

**Production Log:**
Supervisor mobile app se ya PC se daily production enter karo — meter, thaan, suit. Automatically piece-rate ka hisab lagta hai.`,
    practicalSteps: [
      'Karigars → "New Karigar" button dabayein',
      'Name, CNIC, phone aur mazdoori type set karein',
      'Piece rate ya daily wage amount dalein',
      'Attendance daily mark karein (PC ya mobile se)',
      'Peshgi dene par "Disburse Peshgi" dabayein',
      'Month end: "Generate Payroll" → review → payslips print',
    ],
    action: {
      label: 'Open Karigars Console',
      route: '/karigars',
      description: 'Manage workers, attendance, peshgi and payroll',
    },
    followUps: [
      'Mobile app se attendance kaise mark hoti hai?',
      'EOBI kaise set karein?',
      'Overtime kaise add karein?',
      'Peshgi ka hisab kaise dekhein?',
      'Bulk payslips kaise print karein?',
    ],
  },

  // ══════════════════════════════════════════
  // PURCHASE ORDERS & SUPPLIERS
  // ══════════════════════════════════════════
  {
    keywords: [
      'purchase', 'khareed', 'supplier', 'po', 'purchase order', 'grn',
      'goods received', 'maal aaya', 'purchase bill', 'supplier payment',
      'murabba', 'raw material', 'yarn purchase', 'fabric purchase',
    ],
    title: 'Purchase Orders & Supplier Management',
    module: 'Purchase & Procurement',
    explanationUrdu: `Purchasing module me procurement ka poora cycle manage hota hai:

**Purchase Cycle:**
1. **Purchase Order (PO)** — pehle order bhejo supplier ko
2. **GRN (Goods Received Note)** — maal aane par receive karo
3. **Purchase Bill** — supplier ka bill record karo
4. **Payment** — payment karo, Khata me credit ho jata hai

**Partial Receiving:**
Agar pura maal nahi aaya to partial GRN daal do — jo aaya wo stock me jayega, baqi pending rahega.

**3-Way Matching:**
Noxis automatically PO vs GRN vs Bill match karta hai. Agar quantities ya rates me farq ho to alert aata hai.

**Supplier Ledger:**
Har supplier ka running balance Khata me track hota hai — advance diya, bill aaya, payment hui — sab clear dikhta hai.`,
    practicalSteps: [
      'Purchases → "New Purchase Order" dabayein',
      'Supplier select karein aur items add karein',
      'Maal aane par "Receive Goods (GRN)" dabayein',
      'Received quantity confirm karein',
      'Supplier ka bill no. aur amount dalein',
      'Payment dene par Khata me payment post karein',
    ],
    action: {
      label: 'Open Purchases & PO Console',
      route: '/purchase',
      description: 'Create purchase orders, receive goods, manage suppliers',
    },
    followUps: [
      'Supplier ko advance payment kaise dein?',
      'Maal wapis karne ka kya tariqa hai?',
      'Purchase bill aur invoice me kya farq hai?',
      'Supplier ka udhar kaise check karein?',
    ],
  },

  // ══════════════════════════════════════════
  // DISPATCH & BILTY / GATE PASS
  // ══════════════════════════════════════════
  {
    keywords: [
      'bilty', 'bilti', 'cargo', 'adda', 'transport', 'faisal movers',
      'tcs', 'leopard', 'kiraya', 'to pay', 'to-pay', 'nag', 'dispatch',
      'gate pass', 'parcha', 'challan', 'delivery', 'send maal',
      'maal bhejo', 'inter-city', 'freight',
    ],
    title: 'Dispatch, Bilty & Gate Pass — Logistics Engine',
    module: 'Dispatch & Logistics',
    explanationUrdu: `Wholesale textile me maal bhejne ka poora system:

**Bilty / Cargo Tracking:**
• Adda ka naam (Faisal Movers, Niazi, Khan Goods) darj karo
• Bilty number aur Nag/Thaan count enter karo
• Kiraya "To-Pay" ya "Paid" select karo
• Customer ko auto-WhatsApp: "Aapka maal book ho gaya, Bilty # XXX"

**Gate Pass / Parcha (Anti-Theft):**
• Loader aur guard ko sales rate nahi dikhna chahiye
• "Parcha" print karo — sirf Nag/Gaz/Thaan, zero prices
• Guard barcode scan karta hai gate par
• Duplicate pass try hone par instant red alarm

**Delivery Challan:**
Customer ke liye formal delivery document jisme items, quantities, aur delivery address hoti hai.

**Dispatch Status Tracking:**
Har dispatch order ka status track hota hai:
Prepared → Loaded → In Transit → Delivered`,
    practicalSteps: [
      'Dispatch → "New Dispatch Order" dabayein',
      'Invoice select karein jo bhejni hai',
      'Vehicle number aur driver details dalein',
      'Bilty booking ke liye "Book Bilty" tab open karein',
      'Parcha print ke liye "No-Price Gate Pass" dabayein',
      'Guard gate par barcode scan kar ke verify karay',
    ],
    action: {
      label: 'Open Dispatch & Bilty Terminal',
      route: '/dispatch',
      description: 'Create gate passes, book bilties, track deliveries',
    },
    followUps: [
      'Customer ko bilty WhatsApp kaise karein?',
      'Delivery confirm hone par kya karein?',
      'Maal wapis aaye to kya process hai?',
      'Multiple deliveries ek invoice me kaise karein?',
    ],
  },

  // ══════════════════════════════════════════
  // DAILY Z-REPORT & CLOSING
  // ══════════════════════════════════════════
  {
    keywords: [
      'z report', 'z-report', 'munshi', 'daily audit', 'sham ka hisab',
      'dokan band', 'closing report', 'galla', 'cash drawer', 'end of day',
      'roz ka hisab', 'daily closing', 'dukan band karna',
    ],
    title: 'Daily Munshi Z-Report — End of Day Audit',
    module: 'Financial Reports',
    explanationUrdu: `Rozana dukan ya factory band karte waqt Munshi Z-Report nikalein — yeh hera-pheri rokti hai:

**Z-Report me kya hota hai:**
💰 Aaj ki Total Net Sales
🏦 Cash jo drawer me hona chahiye
💳 Bank/Raast receipts
📊 Udhar wasooli (collections)
💼 Karigaron ko di gayi peshgi
📋 Kul pending market udhar
🧾 Total invoices count

**Automatic Calculations:**
• Opening cash + net sales - expenses = closing cash
• Agar physical cash is se kam ho to "shortage" flag
• Agar zyada ho to "surplus" flag

**Owner Report:**
Ek click me owner ke WhatsApp par poori daily summary jati hai — chahe wo factory me na ho.

**Month-End:**
30 din ki sari Z-reports combine kar ke monthly audit hoti hai.`,
    practicalSteps: [
      'Reports → "Daily Z-Report" card dabayein',
      'Date confirm karein (aaj ki)',
      'Cash drawer me actual cash count karein',
      'Physical amount enter karein',
      'System difference calculate karega (surplus/shortage)',
      '"Send to Owner WhatsApp" button dabayein',
      'Sign off karein — report lock ho jati hai',
    ],
    action: {
      label: 'Open Daily Z-Report Console',
      route: '/reports',
      description: 'Run end-of-day audit and send owner summary',
    },
    followUps: [
      'Galla short nikle to kya karein?',
      'Monthly report kaise nikalein?',
      'Owner ko daily WhatsApp kaise setup karein?',
      'Cash shortage ka hisab kaise theek karein?',
    ],
  },

  // ══════════════════════════════════════════
  // CHEQUE MANAGEMENT
  // ══════════════════════════════════════════
  {
    keywords: [
      'cheque', 'check', 'clearing', 'bank cheque', 'pending cheque',
      'post dated', 'PDC', 'cheque deposit', 'cheque collect',
      'cheque register', 'cheque book',
    ],
    title: 'Cheque Management — Pending Clearance & Bounce Handling',
    module: 'Khata Banking',
    explanationUrdu: `Pakistani textile wholesale me cheque payments common hain. Noxis complete cheque lifecycle manage karta hai:

**Cheque Lifecycle:**
1. Customer cheque deta hai → "Pending Clearance" me jata hai
2. Bank me submit karo → status "Submitted" ho jata hai
3. Clear hone par → 1-click "Mark Cleared" → customer balance update
4. Bounce hone par → "Mark Bounced" → udhar wapis, penalty add, WhatsApp notice

**Post-Dated Cheques (PDC):**
Future date ke cheques automatically pending me rehte hain aur date aane par alert milta hai.

**Cheque Register:**
Sare pending, cleared, aur bounced cheques ek jagah nazar aate hain — date wise, party wise filter karein.

**Bank Reconciliation:**
Month end par bank statement CSV import karein — system automatically Noxis entries se match karta hai.`,
    practicalSteps: [
      'Khata → "Cheques" tab open karein',
      '"New Cheque" dabayein',
      'Customer select karein, cheque number aur date dalein',
      'Amount aur bank name enter karein',
      'Clearance date aane par "Mark Clear" dabayein',
      'Bounce hone par "Mark Bounced" → penalty auto-add',
    ],
    action: {
      label: 'Open Cheques Register',
      route: '/khata',
      description: 'Manage pending, cleared and bounced cheques',
    },
    followUps: [
      'PDC cheque kaise record karein?',
      'Cheque bounce hone par WhatsApp kaise bhejein?',
      'Bank reconciliation kaise karein?',
      'Cheque penalty kaise set karein?',
    ],
  },

  // ══════════════════════════════════════════
  // CCTV & SECURITY
  // ══════════════════════════════════════════
  {
    keywords: [
      'cctv', 'camera', 'security', 'surveillance', 'ip camera',
      'rtsp', 'motion', 'alert', 'live feed', 'recording', 'hikvision',
      'dahua', 'motion detection', 'chori', 'guard monitoring',
    ],
    title: 'CCTV Security Feeds — Live Monitoring & Motion Alerts',
    module: 'Security & Surveillance',
    explanationUrdu: `Noxis me directly CCTV feeds integrate ho jaati hain — alag software ki zaroorat nahi:

**Kya kya ho sakta hai:**
• 6 tak IP cameras connect karein (Pro/Elite tier)
• RTSP protocol — Hikvision, Dahua, Reolink sab support
• Live HD feeds browser me dekho
• Motion tripwire alerts — sensitive areas ke liye
• Event recording — jab motion detect ho
• Transaction linking — sale ke waqt ki clip invoice se link hoti hai

**Gate Security:**
CCTV + Gate Pass barcode scan milein to chori practically impossible ho jati hai.

**Remote Viewing:**
Factory se bahar ho to mobile ya laptop par secure link se live feed dekho.

**Alert Types:**
🚨 Motion detected in warehouse (after hours)
🚨 Gate barcode scan failed
🚨 Duplicate pass attempt`,
    practicalSteps: [
      'CCTV → "Add Camera" dabayein',
      'Camera ka IP address aur RTSP URL dalein',
      'Username aur password enter karein',
      '"Test Connection" se verify karein',
      'Camera name aur location set karein (e.g. Gate, Warehouse)',
      'Motion zones configure karein',
    ],
    action: {
      label: 'Open CCTV Security Console',
      route: '/cctv',
      description: 'Connect cameras, view live feeds, set motion alerts',
    },
    followUps: [
      'Camera ka RTSP URL kaise find karein?',
      'Motion alert ka WhatsApp kaise setup karein?',
      'Transaction ke waqt automatic clip kaise save ho?',
      'Remote viewing kaise karein?',
    ],
  },

  // ══════════════════════════════════════════
  // MOBILE APP & DEVICE PAIRING
  // ══════════════════════════════════════════
  {
    keywords: [
      'mobile', 'android', 'phone', 'pairing', 'pair', 'qr code',
      'supervisor', 'floor app', 'wifi', 'connect', 'device',
      'mobile attendance', 'mobile production', 'sync', 'offline sync',
    ],
    title: 'Android Mobile Companion — Floor Operations',
    module: 'Mobile & Device Management',
    explanationUrdu: `Noxis Mobile App supervisors aur karigars ke liye floor par kaam karne ki azadi deta hai:

**Mobile App Capabilities:**
• Attendance mark karna (finger tap — P/A/Half)
• Production units log karna (meters/thaan)
• Barcode scan se inventory check
• Customer khata balance dekhna
• Messages receive karna PC Hub se
• POS billing (cashier role)

**Connection (No Internet Needed):**
PC aur phone same Wi-Fi router se connect hon — bas. Internet nahi chahiye.

**Pairing Process (sirf ek baar):**
1. PC par Settings → Device Pairing open karein
2. QR code screen par aata hai
3. Phone par Noxis app open karein → "Pair with Hub"
4. QR scan karein — connected!

**Roles on Mobile:**
• Owner — sab kuch
• Supervisor — production aur attendance
• Cashier — billing only
• Security — gate pass scan only

**Offline on Mobile:**
Net band ho tab bhi mobile kaam karta hai — entries queue me jati hain aur connection aane par sync ho jati hain.`,
    practicalSteps: [
      'Android phone par Noxis Mobile app install karein (APK)',
      'PC aur phone ek hi Wi-Fi par connect karein',
      'PC → Settings → Device Pairing → QR code dekho',
      'Phone → "Pair with Hub" → QR scan karein',
      'Role assign karein (Supervisor / Cashier)',
      'Test: phone par attendance mark karo, PC par check karo',
    ],
    action: {
      label: 'Open Device Pairing Console',
      route: '/pairing',
      description: 'Pair Android phones and manage device roles',
    },
    followUps: [
      'Kitne phones connect ho sakte hain?',
      'Mobile app offline kaise kaam karta hai?',
      'Phone ka role kaise change karein?',
      'Phone sync nahi ho raha to kya karein?',
      'Pairing revoke kaise karein?',
    ],
  },

  // ══════════════════════════════════════════
  // REPORTS & ANALYTICS
  // ══════════════════════════════════════════
  {
    keywords: [
      'report', 'analysis', 'analytics', 'profit', 'munafa', 'loss',
      'nuqsan', 'trial balance', 'balance sheet', 'aging', 'cashflow',
      'cash flow', 'forecast', 'p&l', 'monthly report', 'yearly report',
      'business intelligence', 'intelligence', 'foresight',
    ],
    title: 'Financial Reports & Business Intelligence',
    module: 'Financial Reports & Analytics',
    explanationUrdu: `Noxis me sab reports ek jagah hain — real-time aur accurate:

**Financial Reports:**
📊 **Profit & Loss (P&L)** — Total Revenue - COGS - Expenses = Net Profit
⚖️ **Trial Balance** — Sare accounts ka DR/CR — balanced hona chahiye
📋 **Balance Sheet** — Total assets vs liabilities vs equity
🕐 **Aging Report** — Kitna udhar kitne dino se pending hai (0-30, 31-60, 60+)
💵 **Cash Flow** — 30-din ki projected liquid cash position

**Operational Reports:**
📦 Stock Valuation Report
👥 Karigar Payroll Summary
🧾 Sales Register (date wise)
📑 Purchase Register
🔄 Stock Movement Log

**Business Intelligence:**
• Overdue receivables risk score
• Stockout prediction (kaunsa item khatam hone wala hai)
• Karigar productivity comparison
• Top selling items
• Customer ranking (sabse zyada purchase)

**Export Options:**
• PDF print ya save
• Excel download
• WhatsApp report send`,
    practicalSteps: [
      'Reports section me jayein',
      'Date range select karein',
      'Report type chunein (P&L / Aging / Stock etc)',
      'Generate karein',
      'PDF/Excel export ya WhatsApp send karein',
    ],
    action: {
      label: 'Open Reports & Analytics',
      route: '/reports',
      description: 'View P&L, aging, cash flow and all business reports',
    },
    followUps: [
      'Monthly munafa kaise pata karein?',
      'Kaun sa grahak sabse zyada udhar deta hai?',
      'Stock khatam hone ki prediction kaise kaam karti hai?',
      'Excel me report kaise download karein?',
    ],
  },

  // ══════════════════════════════════════════
  // MANDI RATES
  // ══════════════════════════════════════════
  {
    keywords: [
      'mandi', 'cotton', 'yarn', 'rate', 'soot', 'kapas', 'grey',
      'maund', 'bhao', 'commodity', 'market rate', 'yarn price',
      'cotton price', 'fabric rate check',
    ],
    title: 'Mandi Rates — Live Commodity Price Monitor',
    module: 'Market Intelligence',
    explanationUrdu: `Pakistani textile ka sab se zyada nuksaan galat rate par maal khareedne se hota hai. Mandi Rates module is se bachata hai:

**Kya track karta hai:**
• Cotton (per maund) — Mandi Faiz, Lahore, Karachi
• Yarn 30s/40s/60s (per kg ya per bag)
• Grey Fabric (per meter)
• Synthetic Yarn rates

**Iska Faida:**
Jab supplier aapko maal bechne aaye to pehle Mandi Rate check karein. Agar supplier ka rate mandi se zyada hai to negotiate karein.

**Alert System:**
Rate significant change aane par automatic notification milti hai.`,
    practicalSteps: [
      'Mandi Rates screen par jayein',
      'Aaj ki cotton aur yarn rates check karein',
      'Supplier ke bill se compare karein',
      'Difference calculate kar ke negotiate karein',
    ],
    action: {
      label: 'View Mandi Commodity Rates',
      route: '/mandi',
      description: 'Check live textile commodity market prices',
    },
    followUps: [
      'Mandi rate alert kaise lagayein?',
      'Purchase bill verify kaise karein?',
      'Rate history kaise dekhein?',
    ],
  },

  // ══════════════════════════════════════════
  // OFFLINE ENGINE & POWER CUT SAFETY
  // ══════════════════════════════════════════
  {
    keywords: [
      'offline', 'internet', 'load shedding', 'light chali gai', 'generator',
      'bijli', 'wifi', 'data safe', 'wal', 'power cut', 'wapda',
      'corrupt', 'data loss', 'crash', 'system band ho gaya',
    ],
    title: 'Zero-Cloud Offline Engine & Power Cut Protection',
    module: 'System Architecture',
    explanationUrdu: `Noxis Hub Pakistan ke electric supply aur internet conditions ke liye khaas taur par design kiya gaya hai:

**Power Cut Protection:**
• SQLite Write-Ahead Logging (WAL) use hota hai
• Agar bijli achanak band ho — zero data loss
• Agla startup par system khud repair ho jata hai
• Koi corruption impossible hai

**Offline-First Architecture:**
• Sab kuch local hard drive par
• Internet sirf WhatsApp aur cloud backup ke liye
• POS, billing, attendance — sab offline kaam karta hai
• Phone bhi offline kaam karta hai — sync queue me jata hai

**Backup Strategy:**
• Daily: Ctrl+S ya "Create Backup" → USB drive par
• Weekly: Cloud backup (optional)
• Month end: Full backup + offsite copy

**Data Location:**
C:\\NoxisData\\Noxis-Local.db

**Agar System Crash Ho Jaye:**
Backup se restore: Settings → Backup → Restore → file select karein`,
    practicalSteps: [
      'Har shift ke baad: Settings → Backup → "Create Instant Backup"',
      'Backup file USB drive par copy karein',
      'Cloud backup: Settings → Cloud → Enable (optional)',
      'Restore: Settings → Backup → Restore → backup file select',
    ],
    action: {
      label: 'Open Backup & Safety Settings',
      route: '/settings/backup',
      description: 'Create backups and verify data safety',
    },
    followUps: [
      'Automatic backup kaise set karein?',
      'Backup restore kaise karein?',
      'Data kahan save hota hai?',
      'Cloud backup kaise setup karein?',
    ],
  },

  // ══════════════════════════════════════════
  // DATA IMPORT & MIGRATION
  // ══════════════════════════════════════════
  {
    keywords: [
      'import', 'excel', 'purana data', 'old data', 'migration',
      'transfer', 'bulk upload', 'csv', 'old system', 'tally import',
      'quickbooks', 'data lana', 'pehle ka data',
    ],
    title: 'Data Import Wizard — Migrate Old Records',
    module: 'Data Migration',
    explanationUrdu: `Pehle ka saara data Noxis me la sakte hain — haath se entry ki zaroorat nahi:

**Kya import ho sakta hai:**
• Products / Items / SKUs (Excel .xlsx)
• Customer aur Supplier accounts
• Opening balances (Khata carry-forward)
• Karigar roster (workers list)
• Existing stock quantities

**Excel Format:**
System auto-column mapping karta hai — aapka format match na bhi hota ho to bhi smart mapping se kaam ho jata hai.

**Free Migration Help:**
Omnora Labs ki team pehli migration me free help karti hai — WhatsApp par batayein aur hum aapka Excel theek karke import karwa dete hain.

**Tally / QuickBooks se:**
Export karein CSV me, phir Noxis Import Wizard se upload karein.`,
    practicalSteps: [
      'Settings → Data Import Wizard (/import)',
      'Import type chunein (Products / Parties / Stock)',
      'Excel file upload karein',
      'Column mapping verify karein',
      'Preview check karein',
      '"Import Now" dabayein',
    ],
    action: {
      label: 'Open Data Import Wizard',
      route: '/import',
      description: 'Import Excel data, migrate from old systems',
    },
    followUps: [
      'Excel template kahan se milega?',
      'Opening balance import kaise hoti hai?',
      'Import me error aaye to kya karein?',
      'Tally se data kaise transfer karein?',
    ],
  },

  // ══════════════════════════════════════════
  // KEYBOARD SHORTCUTS
  // ══════════════════════════════════════════
  {
    keywords: [
      'shortcuts', 'keyboard', 'hotkey', 'ctrl', 'command palette',
      'fast kaise karein', 'quick navigation', 'f2', 'f10',
      'ctrl k', 'sentinel open', 'fast billing',
    ],
    title: 'Keyboard Shortcuts — Speed Up Everything',
    module: 'System Navigation',
    explanationUrdu: `Noxis me mouse se bilkul kaam na ho — sirf keyboard se poori system chalao:

**Global Shortcuts:**
• **Ctrl + K** — Command Palette (koi bhi page instantly kholo)
• **Ctrl + Shift + S** — Sentinel AI Assistant open karo
• **Ctrl + 0** — Screen zoom reset to 100%
• **Esc** — Koi bhi dialog/modal band karo

**POS Counter:**
• **F2** — Search item (focus search bar)
• **F10** — Complete sale (payment)
• **Barcode scan** — Auto-add item
• **N** — Rapid Production Grid (keyboard shortcut outside inputs)

**Navigation:**
• Ctrl+K phir type karein: "pos", "inventory", "khata" etc

**Pro Tip:**
Ctrl+K shortcut sabse powerful hai — kisi bhi module tak bina mouse ke 2 seconds me pohoncho.`,
    practicalSteps: [
      'Ctrl + K dabayein — command palette khulta hai',
      'Type karein jahan jana hai (e.g. "invoice")',
      'Enter dabayein — foran pohnch jao',
    ],
    action: {
      label: 'Open Command Palette',
      route: '/dashboard',
      shortcut: 'Ctrl+K',
      description: 'Navigate anywhere in 2 keystrokes',
      actionType: 'command',
    },
    followUps: [
      'POS me fast billing kaise karein?',
      'Screen zoom ghalat ho to kya karein?',
      'Sentinel AI kaise open karein?',
    ],
  },

  // ══════════════════════════════════════════
  // WHATSAPP INTEGRATION
  // ══════════════════════════════════════════
  {
    keywords: [
      'whatsapp', 'wa', 'message', 'send invoice', 'statement send',
      'customer message', 'bill bhejo', 'hisab bhejo', 'reminder',
      'payment reminder', 'overdue reminder', 'notification',
    ],
    title: 'WhatsApp Integration — Instant Business Communication',
    module: 'Communications',
    explanationUrdu: `Noxis me WhatsApp ek click se kaam karta hai — alag app switch karne ki zaroorat nahi:

**Kya send ho sakta hai:**
📄 Invoice / Bill — formatted message with item details
📒 Khata Statement — customer ka running balance
💰 Payment Reminder — polite overdue notice
📦 Bilty Confirmation — maal dispatch ki intimation
📊 Daily Z-Report — owner ko closing summary
🎫 Gate Pass notification — maal roana confirmation

**Format:**
Sab messages properly formatted, professional, aur easy-to-read hote hain — aapko likha kuch nahi padta.

**Bulk Reminders:**
Aging report se overdue customers select karo — ek click me sab ko reminder chali jati hai.

**Note:**
WhatsApp ka use internet chahiye. Offline hone par message queue me jata hai aur net aane par automatically jata hai.`,
    practicalSteps: [
      'Koi bhi invoice open karein',
      '"WhatsApp" button dabayein',
      'Customer ka number auto-fill ho jata hai',
      'Message preview dikho — send karein',
      'Bulk: Aging Report → Select All Overdue → Bulk Remind',
    ],
    action: {
      label: 'Open Aging & WhatsApp Reminders',
      route: '/khata',
      description: 'Send statements and payment reminders via WhatsApp',
    },
    followUps: [
      'Overdue customers ko bulk reminder kaise bhejein?',
      'WhatsApp message format customize kaise karein?',
      'Daily Z-report auto-send kaise setup karein?',
    ],
  },

  // ══════════════════════════════════════════
  // INDUSTRIAL CALCULATORS (FABRIC, GSM, COSTING)
  // ══════════════════════════════════════════
  {
    keywords: [
      'calculator', 'calculators', 'gsm', 'fabric consumption', 'consumption',
      'kapra calculation', 'costing calculator', 'fabric calculation', 'yarn calculation',
      'meter calculate', 'weight calculate', 'gsm calculator', 'industrial calculator',
    ],
    title: 'Industrial Fabric & Costing Calculators',
    module: 'Industrial Calculators',
    explanationUrdu: `Industrial Calculators floor supervisors aur production managers ke liye banaye gaye hain taake bina kisi manual ghalati ke accurate calculation ho sakay:

**1. Fabric Consumption Calculator:**
• Har suit, shirt ya piece ke liye kitne meter ya kg kapra darkaar hoga.
• Cutting wastage percentage include kar ke final required fabric batata hai.

**2. GSM & Fabric Weight Converter:**
• Fabric ki width, length (meters/yards) aur GSM darj karein.
• Pure thaan ya roll ka exact weight (kg) seconds me maloom karein.

**3. Garment Costing & Markup Engine:**
• Raw material cost + karigar piece-rate mazdoori + overheads calculate karein.
• Desired profit percentage add karein — system final selling price aur net margin nikal kar deta hai.`,
    practicalSteps: [
      'Left Sidebar me "Operations" ke andar "Industrial Calculators" open karein',
      'Jo calculation karni ho (Consumption, GSM, Costing) wo tab select karein',
      'Required values (Width, GSM, Qty) darj karein',
      'System foran live calculated result generate kar dega',
    ],
    action: {
      label: 'Open Industrial Calculators',
      route: '/calculators',
      description: 'Perform instant fabric, GSM and costing calculations',
      actionType: 'navigate',
    },
    followUps: [
      'Fabric GSM kaise check hota hai?',
      '1 dozen suits par kitna kapra lagta hai?',
      'Unit costing me overheads kaise add karein?',
    ],
  },

  // ══════════════════════════════════════════
  // BATCH TRACKING & TRACEABILITY ENGINE
  // ══════════════════════════════════════════
  {
    keywords: [
      'batch', 'batches', 'batch tracking', 'lot', 'lot tracking',
      'costing engine', 'batch costing', 'production batch', 'thaka', 'lot number',
      'traceability', 'lot trace',
    ],
    title: 'Batch Tracking & Traceability Engine',
    module: 'Production & Batches',
    explanationUrdu: `Batch Tracking module factory ke har production lot ko shuru se aakhir tak track karta hai:

**Kya kya track hota hai:**
• **Raw Material Lot:** Kahan se kapra ya yarn aya, kis vendor ka tha.
• **Floor Processing:** Kis loom ya karigar ne is batch par kaam kiya.
• **Piece-Rate Wage Mapping:** Har unit ki labour cost batch ke sath link hoti hai.
• **Batch Unit Costing:** Actual raw material + mazdoori + bijli/overheads mila kar 1 piece ka actual cost nikalta hai.
• **1-Click CSV Export:** Pure batch ki costing breakdown export karein.`,
    practicalSteps: [
      'Operations → "Batch Tracking" (/production/batches) open karein',
      'Naya batch create karein aur Lot Number assign karein',
      'Material allocate karein aur assigned karigars select karein',
      'Production complete hone par "Batch Summary & Costing" export karein',
    ],
    action: {
      label: 'Open Batch Tracking & Costing',
      route: '/production/batches',
      description: 'Manage production lots and view batch costing breakdown',
      actionType: 'navigate',
    },
    followUps: [
      'Naya batch kaise shuru karein?',
      'Batch costing CSV kaise export karein?',
      'Karigar labor cost batch me kaise link hoti hai?',
    ],
  },

  // ══════════════════════════════════════════
  // FORESIGHT AI (PREDICTIVE FACTORY INSIGHTS)
  // ══════════════════════════════════════════
  {
    keywords: [
      'foresight', 'prediction', 'ai insight', 'future cashflow',
      'predictive', 'ai predictions', 'ai forecast', 'risk alert',
    ],
    title: 'Foresight AI — Predictive Factory Intelligence',
    module: 'Foresight AI',
    explanationUrdu: `Foresight AI aapke factory data ko analyze kar ke anay walay hafton ki predictions karta hai:

**Core Predictions:**
• **Cash Flow Horizon:** Aglay 30 dino me kab cash short hone ka khatra hai aur kitni recovery expected hai.
• **Stockout Warnings:** Kaunsa fabric ya yarn kitne dino me khatam hone wala hai.
• **Karigar Productivity:** Kaunsa karigar consistent kaam kar raha hai aur kahan bottleneck ban rahi hai.`,
    practicalSteps: [
      'Operations → "Foresight AI" (/foresight) open karein',
      '30-Day Predictive Timeline review karein',
      'Risk alerts par click kar ke suggested preventive action lein',
    ],
    action: {
      label: 'Open Foresight AI',
      route: '/foresight',
      description: 'Explore AI predictions for cashflow and stockout risks',
      actionType: 'navigate',
    },
    followUps: [
      'Stockout prediction kaise kaam karti hai?',
      'Cash shortfall ka alert kab milta hai?',
    ],
  },

  // ══════════════════════════════════════════
  // SETTINGS & CONFIGURATION
  // ══════════════════════════════════════════
  {
    keywords: [
      'settings', 'setup', 'config', 'tax', 'gst', 'vat', 'currency',
      'fbr', 'ntn', 'strn', 'uae tax', 'business profile', 'logo',
      'company name', 'branches', 'multi branch', 'users', 'roles',
      'multi user', 'staff', 'password', 'pin', 'lock',
    ],
    title: 'Settings & System Configuration',
    module: 'System Configuration',
    explanationUrdu: `Noxis puri tarah configure ho sakti hai aapke karobar ke mutabiq:

**Business Profile:**
• Company name, logo, address
• Tax number (NTN/STRN Pakistan, TRN UAE)
• Invoice prefix (INV-2025-XXXX)
• Bank details (invoice footer ke liye)

**Tax Configuration:**
• Pakistan: GST 18% (FBR)
• UAE: VAT 5% (FTA compliant)
• Custom rates bhi set ho sakte hain

**Multi-User / Staff Roles:**
• Owner — full access
• Manager — limited financial access
• Accountant — khata aur reports
• Cashier — POS billing only
• Floor Supervisor — karigar aur production
• Viewer — sirf dekhna

**Multi-Branch:**
Ek license me multiple factories/sheds manage karein — alag P&L per branch.

**Security:**
• PIN lock (5 ghalat attempts par lockout)
• Auto-lock timeout
• Audit log — har action record hota hai`,
    practicalSteps: [
      'Settings → Business Profile → apna info fill karein',
      'Settings → Tax & Compliance → rate set karein',
      'Settings → Staff & Roles → users add karein',
      'Settings → Factory Branches → agar multiple locations hain',
    ],
    action: {
      label: 'Open System Settings',
      route: '/settings',
      description: 'Configure business profile, tax, users and branches',
    },
    followUps: [
      'FBR GST kaise set karein?',
      'Naya staff member kaise add karein?',
      'Multiple branches kaise manage karein?',
      'PIN lock kaise lagayein?',
      'Logo kaise upload karein?',
    ],
  },

  // ══════════════════════════════════════════
  // AUDIT LOG & SYSTEM SECURITY
  // ══════════════════════════════════════════
  {
    keywords: [
      'audit', 'log', 'history', 'kisi ne kiya', 'kaun ne kiya',
      'track changes', 'who deleted', 'change log', 'trail',
      'security log', 'user activity', 'suspicious',
    ],
    title: 'Audit Log — Complete Activity Tracking',
    module: 'Security & Compliance',
    explanationUrdu: `Noxis me sab kuch record hota hai — koi bhi action chupaaya nahi ja sakta:

**Audit Log me kya record hota hai:**
• Har invoice create / edit / delete
• Har payment post
• Stock adjustment
• Karigar peshgi
• User login/logout
• Settings change
• Role changes

**Per-Entry info:**
• User name (kaun ne kiya)
• Time & date (kab kiya)
• Device (kahan se kiya — PC ya phone)
• Old value vs New value (kya change hua)

**Use Cases:**
• Koi item delete kiya — kaun ne, kab
• Rate change ki gayi — pehle kya tha, ab kya hai
• Cash short nikla — kya koi voucher delete kiya
• Staff accountability

**Export:**
Audit log PDF ya Excel me export ho sakta hai — legal cases ya internal review ke liye.`,
    practicalSteps: [
      'Settings → Audit Log open karein',
      'Date range ya user filter lagayein',
      'Specific action search karein',
      'Export karein agar record chahiye',
    ],
    action: {
      label: 'Open Audit Log Console',
      route: '/audit',
      description: 'View all system activity and user actions',
    },
    followUps: [
      'Deleted entry recover ho sakti hai?',
      'Specific user ki activity kaise filter karein?',
      'Audit log print kaise karein?',
    ],
  },

  // ── 7-DAY TRIAL & FREE FOREVER TRANSITION ──
  {
    keywords: [
      'trial', 'free trial', '7 days trial', 'trial khatam', 'trial expire',
      'kya software ruk jayega', 'license expired', 'free forever', 'trial policy',
      'trial duration', 'trial engine', 'license renewal',
    ],
    title: '7-Day Free Trial & Free Forever Transition Policy',
    module: 'License & Compliance',
    explanationUrdu: `Noxis Hub ka 7-Day Trial boht transparent aur customer-friendly hai:

**1. Pehle 7 Din (100% Pro/Elite Unlocked):**
Customer ko software ki har ek advance capability milti hai — Multi-branch, Android Mobile LAN Sync, CCTV monitoring, Foresight AI, aur Unlimited Invoicing.

**2. 7 Din Khatam Hone Ke Baad (Free Forever Mode):**
Software **kabhi bhi customer ki dukan ya counter ka kaam nahi rokayga**!
• POS Counter, Basic Invoicing, aur Khata Ledger aazad chalta rahega.
• Customer ka aik rupay ka bhi hisaab ya purana record delete ya lock nahi hoga.
• Advanced features (Multi-device mobile sync, CCTV feeds, AI forecasting) par upgrade prompt show hoga.

**3. Anti-Tampering Engine:**
Trial NTP Network Time, Monotonic Session Clock aur SQLite Database Birthtime se secure hai — computer ki date/time peechay karne se trial tamper nahi hota.`,
    practicalSteps: [
      'Left Sidebar me "Settings" → "License & Plans" open karein',
      'Aapko trial ke baqaya din aur status clearly dikhega',
      'Jab bhi customer pay kare, "Activate License" par click karein aur 25-digit key paste karein',
      '1 second me baghair kisi data loss ke permanent Pro/Elite tier activate ho jata hai',
    ],
    action: {
      label: 'Check License & Trial Status',
      route: '/settings/license',
      description: 'View remaining trial days, features matrix, and license activation',
    },
    followUps: [
      'License key kahan se milegi?',
      'Trial ke baad data to nahi urr jayega?',
      'Offline rehte hue license activate kaise karein?',
    ],
  },

  // ── POWER CUT & RESILIENCE ENGINE (ZERO-LOSS AUTO-RECOVERY) ──
  {
    keywords: [
      'power cut', 'light chali gai', 'bijli band', 'shutdown', 'data corrupt',
      'data save', 'resume screen', 'draft recovery', 'pc off', 'computer band',
      'crash recovery', 'unsaved bill', 'recovery modal',
    ],
    title: 'Zero-Loss Resilience Engine & Power-Cut Auto-Recovery',
    module: 'System Resilience',
    explanationUrdu: `Pakistani market me load-shedding aur ungraceful shutdown sabse aam masla hai. Noxis Hub me dual-layer data protection hai:

**1. SQLite WAL Engine (Database Level):**
Write-Ahead Logging technology har transaction ko atomic banati hai. Agar entry save karte waqt switch band ho jaye, database corrupt nahi hota — restart par automatic auto-heal hota hai.

**2. Active Form Draft Protection (Screen Level):**
Aap bill bana rahe the aur light chali gayi?
• System 1200ms ke andar aapka customer name, items, qty aur unit price background me preserve karta hai.
• Default blank form kabhi bhi purane draft ko overwrite nahi kar sakta.
• Jaise hi PC dobara on karenge, **"Session Auto-Recovery Activated"** modal show hoga.
• **"Restore"** dabate hi aapki aadhi likhi invoice / cart bilkul wahi pe wapis open ho jayegi!`,
    practicalSteps: [
      'Ungraceful shutdown ke baad app re-open karein',
      'Screen par "Session Auto-Recovery" modal display hoga',
      'Pending draft ke aagay "Restore ->" button dabayein',
      'Form aapke customer name aur line items ke sath instantly ready milega',
    ],
    action: {
      label: 'Open Invoices & Resume Work',
      route: '/invoices/new',
      description: 'Experience instant draft recovery and zero-loss form persistence',
    },
    followUps: [
      'Draft kitne din tak mehfooz rehta hai?',
      'Agar draft nahi chahiye to discard kaise karein?',
      'POS counter cart bhi restore hoti hai?',
    ],
  },

  // ── EXCEL BULK IMPORT (1,000 - 5,000 ROWS) ──
  {
    keywords: [
      'excel import', 'excel se data', '1000 row', '2000 row', '5000 row',
      'purana data shift', 'csv import', 'bulk import', 'excel file upload',
      'tally import', 'items import kaise karein', 'excel template',
    ],
    title: 'Excel & CSV Bulk Import (1,000 to 5,000+ Rows)',
    module: 'Data Migration Wizard',
    explanationUrdu: `Agar customer ke paas 1,000 se 5,000 rows ka inventory ya customer data Excel/CSV me mojood hai, to Noxis Hub usko smoothly import kar leta hai:

**1. Streamlined Processing:**
Chunk-based background processing use hoti hai taake browser ya app freeze/hang na ho.

**2. Smart Column Auto-Mapping:**
Aapki sheet ke columns (Product Name, SKU Code, Sale Price, Purchase Cost, Opening Stock, Unit) ko Noxis khud pehchan leta hai.

**3. Pre-Import Validation & Preview:**
Import button dabane se pehle system duplicate SKUs aur missing prices highlight karta hai taake ghalat data na chala jaye.`,
    practicalSteps: [
      'Left Sidebar me "Settings" → "Import Data" (/import) open karein',
      'Template download karein ya apni existing Excel (.xlsx) ya CSV file drag-and-drop karein',
      'Columns verify karein (Name, SKU, Price, Stock)',
      '"Validate & Preview" par click karein',
      '"Import All" dabayein — 2,000 items 10 se 15 second me import ho jayenge',
    ],
    action: {
      label: 'Open Data Import Wizard',
      route: '/import',
      description: 'Upload Excel or CSV sheets with 1,000-5,000+ products or parties',
    },
    followUps: [
      'Sample Excel template kahan se milega?',
      'Duplicate SKU aa jaye to kya hota hai?',
      'Parties aur Khata balances bhi Excel se aate hain?',
    ],
  },

  // ── POS COUNTER VS B2B SALES INVOICES ──
  {
    keywords: [
      'pos vs invoice', 'invoice banana nahi ata', 'pos alag hai',
      'counter bill vs invoice', 'wholesale bill', 'fark kya hai',
      'pos kab use karein', 'invoice kab use karein',
    ],
    title: 'POS Counter vs B2B Wholesale Invoices (Kab Kya Use Karein?)',
    module: 'Sales & Billing Architecture',
    explanationUrdu: `Noxis Hub me dukan aur wholesale dono ke liye alag alag screens hain:

**1. POS Counter (/pos) — Retail & Fast Walk-in:**
• Retail dukan ke customer jo cash/card de kar 10 second me samaan le jate hain.
• Barcode scanner aur touch screen support.
• 3-inch Thermal Receipt printer ke liye optimized.
• Keyboard shortcuts (F2 search, F10 complete sale, Enter add).

**2. B2B Sales Invoice (/invoices/new) — Wholesale & Credit Parties:**
• Registered khata parties jinhe 15 ya 30 din ke udhaar (credit) par maal bhejna ho.
• A4 / Letterhead standard invoice with Tax, Discount, aur Terms.
• Gate pass aur bilty tracking ke sath connected.`,
    practicalSteps: [
      'Retail walk-in sale ke liye: Left Menu me "POS Counter" (/pos) open karein',
      'Khata / Wholesale customer ke bill ke liye: "Invoices" → "New Invoice" (/invoices/new) open karein',
      'Customer select karein, items aur rates darj karein, aur Save / WhatsApp karein',
    ],
    action: {
      label: 'Open B2B Sales Invoice Form',
      route: '/invoices/new',
      description: 'Create detailed wholesale bills with credit terms, taxes, and A4 print',
    },
    followUps: [
      'Retail POS me thermal receipt kaise print hoti hai?',
      'Customer ko WhatsApp par invoice kaise bhejein?',
      'Invoice par signature aur stamp kaise lagayein?',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIER 3 — SMART KEYWORD SCORING ENGINE
// Weighted scoring: longer/specific keywords score higher
// Multi-keyword matches accumulate score for best topic selection
// ─────────────────────────────────────────────────────────────────────────────

function scoreTopic(topic: DomainTopic, lower: string): number {
  let score = 0;
  for (const kw of topic.keywords) {
    if (lower.includes(kw)) {
      // Longer keywords = more specific = higher weight
      const weight = kw.length > 6 ? 4 : kw.length > 3 ? 2 : 1;
      score += weight;
    }
  }
  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 4 — CONTEXTUAL FOLLOW-UP DETECTOR
// Detects when user is asking a follow-up to a previous concept
// ─────────────────────────────────────────────────────────────────────────────

const FOLLOWUP_PATTERNS: Record<string, string> = {
  'kaise': 'how',
  'kya': 'what',
  'kyun': 'why',
  'kab': 'when',
  'kahan': 'where',
  'kaun': 'who',
  'batao': 'explain',
  'samjhao': 'explain',
  'detail': 'detail',
  'aur': 'more',
  'phir': 'next',
};

function detectFollowUp(lower: string): boolean {
  return Object.keys(FOLLOWUP_PATTERNS).some(p => lower.startsWith(p) || lower.includes(` ${p} `));
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORTED FUNCTION — SIGNATURE PRESERVED EXACTLY
// ─────────────────────────────────────────────────────────────────────────────

export function querySentinelBrain(rawInput: string): BrainResponse {
  const input = rawInput.trim();
  const lower = input.toLowerCase();

  // ── TIER 1: MISTAKE CORRECTION (highest priority) ──
  for (const m of COMMON_MISTAKES) {
    if (m.triggers.some(t => lower.includes(t))) {
      return {
        answer: `**⚠️ Sahih Tariqa (Correction):**\n\n${m.tip}`,
        thoughtProcess: `Detected operational mistake: ${m.correctedConcept}`,
        correctionTip: `✅ Behtareen tariqa: "${m.correctedConcept}" use karein.`,
        practicalAction: {
          label: m.actionLabel,
          route: m.route,
          description: 'Let me take you there to fix this right now',
          actionType: 'navigate',
          title: `Fix: ${m.correctedConcept}`,
          steps: [
            `1. Open ${m.actionLabel}`,
            `2. Apply recommended correction: ${m.correctedConcept}`,
            `3. Verify balances and save adjustment`
          ],
          actionId: m.correctedConcept.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        },
        suggestions: [
          'Iska practical step-by-step tariqa kya hai?',
          'Audit trail kya hoti hai aur kyun zaroori hai?',
          'Agar phir ghalat ho jaye to kya karein?',
          'Related vouchers kaise banate hain?',
        ],
        moduleBadge: '⚠️ Smart Correction',
      };
    }
  }

  // ── TIER 2: DOMAIN KNOWLEDGE (weighted scoring) ──
  let bestTopic: DomainTopic | null = null;
  let highestScore = 0;

  for (const topic of DOMAIN_KNOWLEDGE) {
    const score = scoreTopic(topic, lower);
    if (score > highestScore) {
      highestScore = score;
      bestTopic = topic;
    }
  }

  if (bestTopic && highestScore > 0) {
    const stepsBlock = bestTopic.practicalSteps.length > 0
      ? `\n\n---\n**📋 Amali Qadam (Practical Steps):**\n${bestTopic.practicalSteps.join('\n')}`
      : '';

    return {
      answer: `${bestTopic.explanationUrdu}${stepsBlock}`,
      thoughtProcess: `Matched topic: ${bestTopic.title} (score: ${highestScore})`,
      practicalAction: {
        ...bestTopic.action,
        title: bestTopic.title,
        steps: bestTopic.practicalSteps.length > 0 ? bestTopic.practicalSteps : [
          `1. Open ${bestTopic.action.label || bestTopic.module}`,
          `2. Follow the on-screen inputs for this module`,
          `3. Save record to update local SQLite ledger`
        ],
        actionId: bestTopic.module.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      },
      suggestions: bestTopic.followUps,
      moduleBadge: bestTopic.module,
    };
  }

  // ── TIER 3: INTELLIGENT FALLBACK with contextual guidance ──
  const isFollowUp = detectFollowUp(lower);

  return {
    answer: isFollowUp
      ? `Aapka sawal samajh aaya. Thoda aur detail dijiye taake main bilkul sahi jawab de sakun.\n\nYa niche diye gaye common topics me se koi chunein:`
      : `Main aapki madad karne ke liye taiyar hun! Noxis Hub me ye sab manage hota hai:\n\n📦 **Inventory & Stock** — Maal aur items\n📒 **Khata** — Grahakoon ka udhar aur hisab\n👥 **Karigars** — Mazdoori, peshgi, payroll\n🧾 **Billing** — POS counter aur invoices\n🚚 **Dispatch** — Gate pass aur bilty\n📊 **Reports** — Munafa aur audit\n\nAp mujhse koi bhi sawal pooch sakte hain — Urdu ya English dono me.`,
    thoughtProcess: 'General fallback with contextual discovery',
    practicalAction: {
      label: 'Open Business Intelligence',
      route: '/intelligence',
      description: 'Explore live factory and sales analytics',
      actionType: 'navigate',
    },
    suggestions: [
      'Pehla bill kaise banayein?',
      'Karigar ki mazdoori kaise set karein?',
      'Customer ka udhar kaise check karein?',
      'Daily Z-report kya hoti hai?',
      'Mobile app kaise connect karein?',
      'Stock khatam hone ki warning kaise milti hai?',
    ],
    moduleBadge: '🧠 Sentinel Intelligence',
  };
}