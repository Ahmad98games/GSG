// src/lib/sentinel/chatEngine.ts
// ─────────────────────────────────────────────────────────────────────────────
// NOXIS SENTINEL CHAT ENGINE v2.0
// All existing imports, types, exports, and function signatures PRESERVED EXACTLY.
// Backend logic flow preserved. Knowledge depth and intelligence massively expanded.
// ─────────────────────────────────────────────────────────────────────────────

import { searchKnowledge } from './knowledgeSearch';
import { knowledgeBase, KnowledgeEntry } from './noxis-docs';

// ── PRESERVED EXACTLY — ChatMessage type ──
export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestions?: string[];
  relatedEntry?: KnowledgeEntry;
  practicalAction?: {
    label: string;
    route: string;
    description?: string;
    title?: string;
    steps?: string[];
    actionId?: string;
  };
  correctionTip?: string;
  moduleBadge?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPANDED GREETING POOL
// More variety — feels alive, not robotic
// ─────────────────────────────────────────────────────────────────────────────

const GREETINGS = [
  "Hello! Main Noxis Sentinel hun — aapke poore karobar ka digital munshi. Inventory se le kar karigar payroll tak, Khata se CCTV tak — sab mere ilm me hai. Kya maloom karna chahte hain?",
  "Noxis Sentinel active. Bilkul A to Z information mojood hai — POS billing, karigar mazdoori, cheque management, gate pass, bilty, mandi rates — sab kuch. Poochhiye.",
  "Ready to assist. Aap mujhse kisi bhi module ke baare me pooch sakte hain — Karigars, Khata, Production, Sales, CCTV, ya Audit logs. Main Urdu aur English dono samajhta hun.",
  "Assalam o Alaikum! Main Noxis Sentinel hun. Aapke factory ya dukan ka koi bhi masla batayein — billing, mazdoori, udhar, stock, ya cheque bounce — har cheez ka hal mojood hai.",
  "Noxis AI ready. Main sirf jawab nahi deta — sahi kaam ka sahi tariqa bhi batata hun. Kya masla hai aaj?",
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPANDED SYSTEM OVERVIEW
// Rich, comprehensive description of all modules
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_OVERVIEW = `
Noxis Hub ek mukammal industrial ERP system hai jo in modules par mushtamil hai:

• **POS & Billing:** Thermal invoice, barcode scan, split payment, WhatsApp bill
• **Inventory & Stock:** SKU management, batch tracking, expiry alerts, reorder
• **Khata (Ledger):** Double-entry accounting, cheques, bank reconciliation
• **Karigars (HR):** Attendance, piece-rate payroll, peshgi advances, payslips
• **Sales & Purchase:** Quotations, invoices, purchase orders, GRN, returns
• **Dispatch & Bilty:** Gate pass, cargo tracking, delivery challans
• **CCTV Security:** IP cameras, motion alerts, transaction-linked clips
• **Mobile Floor App:** Android companion — attendance, production, scan
• **Reports & BI:** P&L, aging, cash flow, trial balance, Z-report
• **Security:** RBAC roles, audit log, PIN lock, CCTV + barcode gate
`;

// ─────────────────────────────────────────────────────────────────────────────
// EXPANDED FALLBACK RESPONSES
// More helpful, contextual, never dead-end
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_RESPONSES = [
  "Yeh sawal thoda aur detail chahta hai. Aap in me se kuch pooch sakte hain: 'batch tracking kya hai', 'payslip kaise print karein', 'galla tally nahi ho raha', ya 'cheque bounce par kya karein'.",
  "Yeh topic mere local knowledge base ke bahar hai. Lekin main Noxis Hub ke har operation ke baare me jaanta hun — kisi module ka naam batayein ya apna masla likh dein.",
  "Seedha jawab nahi mila. 'System overview' type karein aur dekho main kya kya kar sakta hun — ya koi specific masla batayein.",
  "Thoda aur wazahat dijiye. Misal ke taur par: 'karigar ki peshgi kaise kaatein', 'gate pass me price kyun nahi dikhti', ya 'stock minus kaise ho gaya'.",
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPANDED COMMON QUESTIONS MAP
// All original keys PRESERVED. Additional keys added.
// ─────────────────────────────────────────────────────────────────────────────

const COMMON_QUESTIONS: Record<string, string> = {
  // ── ORIGINAL KEYS PRESERVED EXACTLY ──
  "zoom": "Agar screen elements oversized ya cut off dikh rahay hain, Ctrl + 0 (ya Cmd + 0) dabayein — zoom foran 100% par reset ho jata hai. Ctrl + - se zoom out aur Ctrl + + se zoom in hota hai.",
  "ctrl 0": "**Ctrl + 0** dabane se application zoom level default 100% par reset ho jata hai. Jab bhi tables, buttons ya layout zoom-in ya overflow lage — yeh shortcut instantly kaam karta hai.",
  "shortcuts": `Core Noxis Desktop Shortcuts:\n• **Ctrl + Shift + S**: Sentinel AI Assistant kholo\n• **Ctrl + K**: Global Command Palette & Navigation\n• **N**: Rapid Production Grid (keyboard shortcut, outside inputs)\n• **Ctrl + 0**: Screen zoom 100% par reset\n• **F2**: POS me search bar focus\n• **F10**: POS sale complete (payment)\n• **Esc**: Active modal, dialog ya drawer band karo`,
  "intelligence": "Business Intelligence (`/intelligence`) real-time factory metrics analyze karta hai: 30-din ki moving sales velocity, overdue receivables risk, stockout predictions, aur Karigar wage margin leaks.",
  "business intelligence": "Business Intelligence module (`/intelligence`) automated heuristics generate karta hai: Cash Flow, Inventory, Production, Receivables, aur Payroll across all modules.",
  "import": "Purana Excel data import karne ke liye **Data Import Wizard** (`/import`) use karein. `.xlsx` files support karta hai: Products & Stock, Karigar list, Customer/Supplier accounts, aur Opening Balances — smart column auto-mapping ke saath.",
  "excel": "Purana Excel ya paper Khata import karne ke liye `/import` par jao (Data Import Wizard). Omnora Labs team bhi free personal migration help deti hai.",
  "peshgi": "Peshgi cash advances **Karigars** module ya floor mobile app se record hoti hain. Weekly payday payroll process karte waqt sari disbursed advances automatically gross piece-rate pay se minus ho jati hain.",
  "piece rate": "Piece-rate wages production output (meters, yards, suits, ya maunds) ko unit rate se multiply kar ke calculate hoti hain. PC se ya supervisor Android phones se daily output log karo — wage disputes practically impossible ho jaate hain.",
  "karigar": "Worker master profiles, attendance, piece-rate matrices, Peshgi advances, aur printable thermal wage slips **Karigars** (`/karigars`) me manage hote hain.",
  "mandi": "Mandi Rates (`/mandi`) live commodity market rates monitor karta hai — Cotton Mandi per maund, Yarn 30s per kg, Grey Fabric per meter. Supplier ke purchase bill ko prevailing mandi rates se compare karein.",
  "orders": "Sales Orders (`/orders`) wholesale buyer bookings aur production job batches record karne deta hai — final invoice se pehle. Status track: In Production → Dispatched.",
  "cashflow": "Cash Flow Forecast (`/cashflow`) 30-din ki liquid cash positions project karta hai — expected customer invoice collections minus pending supplier purchases aur floor payroll.",
  "internet": "Noxis Hub offline-first hai aur 100% local hard drive aur workshop Wi-Fi par chalta hai. Internet sirf WhatsApp invoice delivery aur cloud backups ke liye chahiye.",
  "load shedding": "Noxis Hub SQLite Write-Ahead Logging (WAL) use karta hai directly local hard drive par (`C:\\NoxisData\\Noxis-Local.db`). WAPDA load shedding ya generator switch hone par bhi ek rupaye ka hisab zaya nahi hota aur database corrupt nahi hota.",
  "offline": "Poora desktop ERP locally chalata hai. Sare POS sales, Karigar piece-rates, Khata ledgers, aur inventory changes directly PC hard drive par save hote hain.",
  "wifi": "Android companion phones office Wi-Fi router ke zariye connect hote hain. **Device Pairing** (`/pairing`) open karein, PC screen par QR code scan karein, aur cellular mobile data ke bina piece-rates sync karein.",
  "pairing": "Supervisor phones pair karne ke liye **Device Pairing** (`/pairing`) open karein. Supervisors same office Wi-Fi network par Android phone se on-screen QR code scan kartey hain.",
  "cctv": "CCTV Feeds (`/cctv`) me up to 6 on-site IP cameras RTSP se connect karein. Motion tripwire monitoring sensitive inventory ya loom entrance areas ke liye.",
  "fbr": "Noxis Pakistan FBR GST (18%) aur UAE VAT (5%) support karta hai. Settings → Regional & Currency me tax profile configure karein — sare sales bills compliant invoices generate karte hain NTN/STRN headers ke saath.",
  "tax": "Tax rates aur compliance **Tax & Compliance** (`/compliance`) aur Settings → Regional & Currency me configure karein.",
  "branches": "Multiple factory sheds, weaving mills, aur regional branches **Settings → Factory Branches** (`/settings/branches`) me manage karein.",
  "diagnostics": "System Diagnostics (`/settings/diagnostics`) local SQLite database latency, TCP local server bridges, aur background sync health test karta hai.",
  "backup": "Database backups anytime **Settings → Backup & Restore** (`/settings/backup`) se export ho sakta hai. Har shift ke end par backup file USB flash drive par copy karo.",
  "khata": "Khata Ledger (`/khata`) balanced double-entry accounting deta hai — party running balances, debit/credit vouchers, aur 1-click WhatsApp customer statements.",
  "return": "Sales return handle karne ke liye Invoices me jayein, bill locate karein, aur Credit Note create karein. Yeh automatically stock inventory me restore karta hai aur customer ke ledger me credit dalta hai.",
  "profit": "Profit & Loss calculations **Reports → Profit & Loss** (`/reports`) me generate hoti hain. Net Profit = Total Revenue - Cost of Goods Sold (COGS) - Operating Expenses.",
  "multi-user": "Cashiers, accountants, aur floor managers add karein **Settings → Staff & Roles** (`/settings/users`) me — role-based access controls ke saath.",

  // ── ADDITIONAL KEYS (new, additive only) ──
  "aging": "Aging Report (`/reports`) dikhata hai kitna udhar kitne dino se pending hai — 0-30 days, 31-60 days, 60+ days. Overdue customers ko directly is report se bulk WhatsApp reminder bhejo.",
  "trial balance": "Trial Balance (`/reports`) sare accounts ka DR aur CR balance dikhata hai — Total DR = Total CR hona chahiye. Agar match na kare to koi ghalat entry hai.",
  "balance sheet": "Balance Sheet (`/reports`) poore karobar ki financial position dikhati hai — Total Assets = Liabilities + Equity. Quarterly ya yearly nikalein.",
  "gst": "Pakistan GST 18% FBR compliant hai Noxis me. Settings → Tax & Compliance me NTN aur STRN number dalein. Har invoice par automatically print hoga.",
  "vat": "UAE VAT 5% FTA compliant hai Noxis me. TRN number Settings me dalein. Sales invoices automatically VAT calculate karein ge aur VAT-201 return ke liye data ready hoga.",
  "gate pass": "Gate Pass (`/dispatch`) me price-free slip print hoti hai — sirf Nag/Thaan/Gaz counts, zero rates. Guard barcode scan karta hai. Duplicate pass instant reject hota hai.",
  "bilty": "Bilty booking (`/dispatch`) me cargo adda ka naam, bilty number, aur kiraya (To-Pay/Paid) record karo. Customer ko automatic WhatsApp intimation chali jati hai.",
  "z report": "Daily Munshi Z-Report (`/reports`) end-of-day audit karta hai — net sales, cash drawer balance, collections, peshgi disbursements. Owner ko WhatsApp par auto-send ho sakta hai.",
  "cheque bounce": "Cheque bounce hone par Khata → Cheques → Mark Bounced. Customer ka udhar wapis charh jata hai, penalty add hoti hai, WhatsApp notice auto-send hota hai.",
  "credit note": "Credit Note issue karne ke liye Invoices → [Bill] → Issue Credit Note. Stock restore ho jata hai, customer balance adjust hota hai, audit trail mehfooz rehti hai.",
  "stock adjustment": "Stock ghalat hone par Inventory → Stock Adjustments → New Adjustment. Reason likhein (Correction/Physical Count). Audit log me record rehta hai.",
  "petty cash": "Petty cash (chai, rickshaw, stationery) Finance → Petty Cash me record karein — warna galla tally nahi hota daily Z-report me.",
  "payroll": "Month-end payroll: Karigars → Payroll → Generate. System automatically attendance × piece-rate calculate karta hai, peshgi minus karta hai, net pay dikhata hai. Bulk payslips print karein.",
  "eobi": "EOBI deduction Karigars me har worker ke liye set hoti hai. Payroll generate karte waqt automatically minus ho jati hai.",
  "bank reconciliation": "Bank statement CSV import karein: Khata → Bank Reconciliation. System automatically Noxis entries se match karta hai — unmatched items flag ho jaate hain.",
  "duplicate": "Duplicate party: Parties → [Party] → Merge Duplicate. Duplicate invoice: void karein, delete nahi. System idempotency se automatically duplicate transactions block karta hai.",
  "audit log": "Audit Log (`/audit-log`) me sab kuch record hai — kaun ne kya kiya, kab, kahan se. Delete bhi log hoti hai. Legal cases ya internal accountability ke liye export karein.",
  "opening balance": "Opening balances Settings → Opening Balances me enter karein. Agar ghalat ho jaye to Journal Voucher se correct karein — seedha edit mat karein.",
  "forecast": "30-din ka cash flow forecast (`/cashflow`) automatically calculate hota hai — expected collections minus upcoming supplier payments aur payroll.",
  "command palette": "Ctrl + K dabayein — Command Palette khulega. Type karein module ka naam aur Enter — bina mouse ke kisi bhi page par 2 seconds me pohoncho.",
  "sentinel": "Sentinel AI (Ctrl+Shift+S ya sidebar me) aapka 24/7 business assistant hai — module guidance, mistake correction, aur step-by-step practical help Urdu aur English dono me.",
};

// ─────────────────────────────────────────────────────────────────────────────
// INTELLIGENCE LAYER — Context Analysis
// Analyzes conversation history for better contextual answers
// ─────────────────────────────────────────────────────────────────────────────

interface ConversationContext {
  lastModule?: string;
  lastTopic?: string;
  questionCount: number;
  hasAskedAbout: Set<string>;
}

function analyzeContext(history: ChatMessage[]): ConversationContext {
  const ctx: ConversationContext = {
    questionCount: history.filter(m => m.role === 'user').length,
    hasAskedAbout: new Set(),
  };

  // Extract what topics have been discussed
  for (const msg of history) {
    if (msg.moduleBadge) {
      ctx.lastModule = msg.moduleBadge;
    }
    if (msg.role === 'user') {
      const lower = msg.content.toLowerCase();
      if (lower.includes('karigar') || lower.includes('peshgi')) {
        ctx.hasAskedAbout.add('karigars');
        ctx.lastTopic = 'karigars';
      }
      if (lower.includes('khata') || lower.includes('ledger') || lower.includes('udhar')) {
        ctx.hasAskedAbout.add('khata');
        ctx.lastTopic = 'khata';
      }
      if (lower.includes('inventory') || lower.includes('stock') || lower.includes('maal')) {
        ctx.hasAskedAbout.add('inventory');
        ctx.lastTopic = 'inventory';
      }
      if (lower.includes('bill') || lower.includes('invoice') || lower.includes('pos')) {
        ctx.hasAskedAbout.add('billing');
        ctx.lastTopic = 'billing';
      }
    }
  }

  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ANSWER LAYER — Instant responses for common questions
// Checks COMMON_QUESTIONS map first (fastest path)
// ─────────────────────────────────────────────────────────────────────────────

function checkCommonQuestions(lower: string): string | null {
  // Direct key match
  for (const [key, answer] of Object.entries(COMMON_QUESTIONS)) {
    if (lower.includes(key)) {
      return answer;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GREETING DETECTOR
// Detects if the user is just saying hello
// ─────────────────────────────────────────────────────────────────────────────

const GREETING_TRIGGERS = [
  'hi ', 'hello', 'salam', 'assalam', 'hey', 'hii', 'helo',
  'good morning', 'good evening', 'subah', 'shaam',
];

function isGreeting(lower: string): boolean {
  const trimmed = lower.trim();
  return GREETING_TRIGGERS.some(g => trimmed === g.trim() || trimmed.startsWith(g));
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM OVERVIEW DETECTOR
// ─────────────────────────────────────────────────────────────────────────────

const OVERVIEW_TRIGGERS = [
  'overview', 'system overview', 'modules', 'kya karta hai', 'features',
  'sab kuch batao', 'full guide', 'a to z',
];

function isOverviewRequest(lower: string): boolean {
  return OVERVIEW_TRIGGERS.some(t => lower.includes(t));
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART SUGGESTIONS GENERATOR
// Context-aware follow-up suggestions based on conversation history
// ─────────────────────────────────────────────────────────────────────────────

function generateSmartSuggestions(
  ctx: ConversationContext,
  currentModuleBadge?: string
): string[] {
  const suggestions: string[] = [];

  // If we know what they are working on, suggest related questions
  if (ctx.lastTopic === 'karigars' || currentModuleBadge?.includes('Karigar')) {
    suggestions.push(
      'Peshgi kaise disburse karein?',
      'Month-end payroll kaise generate karein?',
      'Mobile se attendance kaise mark hoti hai?',
      'EOBI deduction kaise set karein?',
    );
  } else if (ctx.lastTopic === 'khata' || currentModuleBadge?.includes('Khata')) {
    suggestions.push(
      'Cheque bounce hone par kya karein?',
      'Customer ko WhatsApp statement kaise bhejein?',
      'Trial balance kaise check karein?',
      'Bank reconciliation kaise karein?',
    );
  } else if (ctx.lastTopic === 'inventory' || currentModuleBadge?.includes('Inventory')) {
    suggestions.push(
      'Batch tracking kya hota hai?',
      'Stock khatam hone par alert kaise milta hai?',
      'Physical count kaise karein?',
      'Excel se bulk items import kaise karein?',
    );
  } else if (ctx.lastTopic === 'billing' || currentModuleBadge?.includes('Sales')) {
    suggestions.push(
      'Credit bill kaise banayein?',
      'Discount kaise lagayein?',
      'WhatsApp par invoice kaise bhejein?',
      'Sales return kaise process karein?',
    );
  } else {
    // Default discovery suggestions
    suggestions.push(
      'POS me barcode scan kaise kaam karta hai?',
      'Daily galla tally kaise karein?',
      'Karigar ki peshgi kaise record karein?',
      'Customer ka udhar kaise check karein?',
    );
  }

  return suggestions.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORTED FUNCTION — SIGNATURE PRESERVED EXACTLY
// ─────────────────────────────────────────────────────────────────────────────

import { querySentinelBrain, BrainResponse } from '../sentinel/sentinelBrain';

function getActionForCommonQuestion(lower: string): { label: string; route: string; description?: string; title?: string; steps?: string[]; actionId?: string } | undefined {
  if (lower.includes('cheque')) return { label: 'Open Cheques Register', route: '/khata', description: 'Manage and clear cheques', title: 'Cheque Management & Bounce Handling', steps: ['1. Go to Khata -> Cheques tab', '2. Locate pending or bounced cheque', '3. Click Mark Cleared or Mark Bounced to adjust party running balance'], actionId: 'cheque_management' };
  if (lower.includes('karigar') || lower.includes('peshgi') || lower.includes('piece rate')) return { label: 'Open Karigars Console', route: '/karigars', description: 'Manage workers, attendance and peshgi', title: 'Karigar Management & Peshgi Advances', steps: ['1. Open Karigars master console', '2. Select worker to record daily production or peshgi cash advance', '3. Advance is automatically recorded and deducted from weekly payroll'], actionId: 'karigar_peshgi' };
  if (lower.includes('calculator') || lower.includes('gsm')) return { label: 'Open Industrial Calculators', route: '/calculators', description: 'Calculate fabric consumption and GSM' };
  if (lower.includes('batch')) return { label: 'Open Batch Tracking & Costing', route: '/production/batches', description: 'Track lots and batch costing' };
  if (lower.includes('khata') || lower.includes('aging') || lower.includes('ledger')) return { label: 'Open Khata Ledger', route: '/khata', description: 'View ledgers and balances' };
  if (lower.includes('inventory') || lower.includes('stock')) return { label: 'Open Inventory', route: '/inventory', description: 'Check stock levels and items', title: 'Inventory & Stock Management', steps: ['1. View all active SKUs, batches, and warehouse locations', '2. Click Stock Adjustment or Add New Item', '3. Update counts to reflect physical factory count'], actionId: 'inventory_stock' };
  if (lower.includes('bill') || lower.includes('invoice') || lower.includes('pos')) return { label: 'Open Invoices', route: '/invoices/new', description: 'Create and view invoices', title: 'Creating a Sales Invoice', steps: ['1. Select or search customer/party name', '2. Add items, quantity, and piece-rate price', '3. Select payment method (Cash/Credit) and finalize'], actionId: 'new_invoice' };
  if (lower.includes('purchase')) return { label: 'Open Purchases', route: '/purchase', description: 'Manage purchase orders' };
  if (lower.includes('payroll') || lower.includes('tankhwa') || lower.includes('eobi')) return { label: 'Open Payroll & Wages', route: '/payroll', description: 'Process wages and payroll' };
  if (lower.includes('gate pass') || lower.includes('bilty') || lower.includes('dispatch')) return { label: 'Open Dispatch Terminal', route: '/dispatch', description: 'Manage gate passes and bilty' };
  if (lower.includes('cctv')) return { label: 'Open CCTV Feeds', route: '/cctv', description: 'Monitor cameras' };
  if (lower.includes('mandi')) return { label: 'View Mandi Rates', route: '/mandi', description: 'View live commodity rates' };
  if (lower.includes('backup')) return { label: 'Open Backup & Safety', route: '/settings/backup', description: 'Backup database' };
  if (lower.includes('import') || lower.includes('excel')) return { label: 'Open Import Wizard', route: '/import', description: 'Import data from Excel' };
  if (lower.includes('diagnostics')) return { label: 'Open Diagnostics', route: '/settings/diagnostics', description: 'Check system health' };
  if (lower.includes('report') || lower.includes('profit') || lower.includes('z report') || lower.includes('trial') || lower.includes('balance sheet')) return { label: 'Open Reports & Analytics', route: '/reports', description: 'View financial statements' };
  if (lower.includes('audit')) return { label: 'Open Audit Log', route: '/audit', description: 'Review system activity' };
  if (lower.includes('tax') || lower.includes('fbr') || lower.includes('gst') || lower.includes('vat')) return { label: 'Open Tax & Compliance', route: '/compliance', description: 'Configure tax settings' };
  if (lower.includes('settings') || lower.includes('branches') || lower.includes('multi-user')) return { label: 'Open Settings', route: '/settings', description: 'Configure system settings' };
  if (lower.includes('foresight')) return { label: 'Open Foresight AI', route: '/foresight', description: 'View AI predictions' };
  return { label: 'Open Business Intelligence', route: '/intelligence', description: 'Explore live factory analytics' };
}

export async function processChatQuery(
  query: string,
  history: ChatMessage[] = []
): Promise<ChatMessage> {

  // ── Simulate 150ms local CPU inference (PRESERVED) ──
  await new Promise(resolve => setTimeout(resolve, 150));

  const lower = query.trim().toLowerCase();

  // ── Analyze conversation context ──
  const ctx = analyzeContext(history);

  // ── LAYER 0: Greeting handler ──
  if (isGreeting(lower) && ctx.questionCount === 0) {
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    return {
      role: 'assistant',
      content: greeting,
      timestamp: Date.now(),
      suggestions: [
        'Inventory me maal kaise dalein?',
        'Karigar ki peshgi kaise set karein?',
        'Pehla bill kaise banayein?',
        'System overview dikhao',
      ],
      moduleBadge: '🤖 Sentinel AI',
    };
  }

  // ── LAYER 0B: System overview ──
  if (isOverviewRequest(lower)) {
    return {
      role: 'assistant',
      content: `**Noxis Hub — Complete System Overview**\n${SYSTEM_OVERVIEW}`,
      timestamp: Date.now(),
      suggestions: [
        'POS billing kaise shuru karein?',
        'Karigar payroll kaise kaam karta hai?',
        'Khata ledger kya hai?',
        'Mobile app kaise connect karein?',
      ],
      practicalAction: {
        label: 'Open Business Dashboard',
        route: '/dashboard',
        description: 'Start from the main operations console',
      },
      moduleBadge: '📋 System Overview',
    };
  }

  // ── LAYER 1: Sentinel Deep Brain (Primary Multi-Tier Intelligence & Auto-Pilot) ──
  const brainRes: BrainResponse = querySentinelBrain(query);

  if (
    brainRes.thoughtProcess &&
    !brainRes.thoughtProcess.includes('General conversational fallback')
  ) {
    // Brain found a high-quality match, practical steps, or operational correction
    const contextualSuggestions = brainRes.suggestions?.length
      ? brainRes.suggestions
      : generateSmartSuggestions(ctx, brainRes.moduleBadge);

    return {
      role: 'assistant',
      content: brainRes.answer,
      timestamp: Date.now(),
      suggestions: contextualSuggestions,
      practicalAction: brainRes.practicalAction,
      correctionTip: brainRes.correctionTip,
      moduleBadge: brainRes.moduleBadge,
    };
  }

  // ── LAYER 2: Quick answers from COMMON_QUESTIONS map (with smart Auto-Pilot practicalAction) ──
  const quickAnswer = checkCommonQuestions(lower);
  if (quickAnswer) {
    const smartSuggestions = generateSmartSuggestions(ctx);
    const action = getActionForCommonQuestion(lower);
    return {
      role: 'assistant',
      content: quickAnswer,
      timestamp: Date.now(),
      suggestions: smartSuggestions,
      practicalAction: action,
      moduleBadge: '⚡ Quick Answer',
    };
  }

  // ── LAYER 3: Local docs database search (PRESERVED) ──
  const searchResults = searchKnowledge(query, 2);
  if (searchResults.length > 0) {
    const top = searchResults[0];
    let extra = `\n\n**Category:** ${top.category}`;
    if (top.shortcut) extra += ` | **Shortcut:** \`${top.shortcut}\``;

    const docSuggestions = [
      ...searchResults.slice(1).map(s => s.title),
      ...generateSmartSuggestions(ctx, top.category),
    ].slice(0, 4);

    return {
      role: 'assistant',
      content: `${top.content}${extra}`,
      timestamp: Date.now(),
      relatedEntry: top,
      practicalAction: top.route
        ? {
            label: top.action_label || `Go to ${top.category}`,
            route: top.route,
          }
        : undefined,
      suggestions: docSuggestions,
      moduleBadge: top.category,
    };
  }

  // ── LAYER 4: Intelligent fallback (PRESERVED — improved) ──
  const fallback = FALLBACK_RESPONSES[
    Math.floor(Math.random() * FALLBACK_RESPONSES.length)
  ];

  const fallbackSuggestions = generateSmartSuggestions(ctx, brainRes.moduleBadge);

  return {
    role: 'assistant',
    content: brainRes.answer || fallback,
    timestamp: Date.now(),
    suggestions: fallbackSuggestions.length
      ? fallbackSuggestions
      : brainRes.suggestions,
    practicalAction: brainRes.practicalAction,
    moduleBadge: brainRes.moduleBadge || '🧠 Sentinel Intelligence',
  };
}