
import { searchKnowledge } from './knowledgeSearch';
import { knowledgeBase, KnowledgeEntry } from './noxis-docs';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestions?: string[];
  relatedEntry?: KnowledgeEntry;
}

const GREETINGS = [
  "Hello! I am your Noxis assistant. I have been trained on all modules from Inventory and Payroll to Security and Production. How can I help you today?",
  "Noxis assistant active. I have A to Z detailed knowledge about this system. What would you like to explore?",
  "Ready to assist. You can ask me about Karigars, Khata, Production, Sales, or even Audit logs."
];

const SYSTEM_OVERVIEW = `
Noxis Hub is a comprehensive Industrial system consisting of several integrated modules:
• **Inventory & Stock**: SKU management, batch tracking, and reorder alerts.
• **Khata (Ledger)**: Double-entry accounting, party balances, and journal entries.
• **Karigars (HR)**: Attendance, payroll, and advances (Peshgi).
• **Sales & Purchase**: Quotations, Invoices, Gate Passes, and POs.
• **Security Cameras**: Integrated site surveillance streams.
• **Document Scanner**: Automated document scanning and mobile syncing.
• **Security**: Role-based access control and detailed audit logging.
`;

const FALLBACK_RESPONSES = [
  "I'm not quite sure about that specific detail. Could you try rephrasing? You can ask about 'batch tracking', 'generating payslips', or 'security logs'.",
  "That falls outside my current local knowledge base. I'm trained on all Noxis Hub operations—try asking about a specific module or how to perform a task.",
  "I couldn't find a direct answer for that. Try asking for a 'system overview' to see what I can help with."
];

const COMMON_QUESTIONS: Record<string, string> = {
  "zoom": "If screen elements appear oversized or cut off, press **Ctrl + 0** (or **Cmd + 0**) to immediately reset your display zoom to 100%. You can also press **Ctrl + -** to zoom out or **Ctrl + +** to zoom in.",
  "ctrl 0": "Pressing **Ctrl + 0** resets the application zoom level to default 100%. Use this whenever screen layouts, tables, or buttons appear zoomed in or overflow the viewport.",
  "shortcuts": "Core Noxis Desktop Shortcuts:\n• **Ctrl + Shift + S**: Open Sentinel AI Assistant\n• **Ctrl + K**: Global Command Palette & Navigation\n• **N**: Open Rapid Production Grid (press N on keyboard outside inputs)\n• **Ctrl + 0**: Reset screen zoom to default 100%\n• **Esc**: Close active modal, dialog, or drawer",
  "intelligence": "Business Intelligence (`/intelligence`) analyzes real-time factory metrics: 30-day moving sales velocity, overdue receivables risk, stockout predictions, and Karigar wage margin leaks.",
  "business intelligence": "The Business Intelligence module (`/intelligence`) generates automated heuristics and insights across Cash Flow, Inventory, Production, Receivables, and Payroll.",
  "import": "You can bulk import existing Excel sheets at **Data Import Wizard** (`/import`). It supports `.xlsx` files for Products & Stock, Karigar workforce, Customer/Supplier accounts, and Opening Balances with smart column auto-mapping.",
  "excel": "To import your old Excel or paper Khata registers into Noxis, go to `/import` (Data Import Wizard). Omnora Labs also provides free personal migration assistance.",
  "peshgi": "Peshgi cash advances are recorded in **Karigars** or through the floor mobile app. When processing weekly payday payroll, all disbursed advances are automatically subtracted from gross piece-rate pay.",
  "piece rate": "Piece-rate wages calculate production output (meters, yards, suits, or maunds) multiplied by unit rate. You can log daily output from the PC or supervisor Android phones without wage disputes.",
  "karigar": "Manage worker master profiles, attendance, piece-rate matrices, Peshgi advances, and printable thermal wage slips under **Karigars** (`/karigars`).",
  "mandi": "Mandi Rates (`/mandi`) monitors live commodity market rates (Cotton Mandi per maund, Yarn 30s per kg, Grey Fabric per meter) so you can compare raw material purchase bills against prevailing mandi prices.",
  "orders": "Sales Orders (`/orders`) lets you record wholesale buyer bookings and production job batches before issuing final invoices. Track status from In Production to Dispatched.",
  "cashflow": "Cash Flow Forecast (`/cashflow`) projects 30-day liquid cash positions by balancing expected customer invoice collections against pending supplier purchases and floor payroll.",
  "internet": "Noxis Hub is built offline-first and runs 100% on your local hard drive and workshop Wi-Fi. Internet is only required for WhatsApp invoice delivery and cloud backups.",
  "load shedding": "Noxis Hub uses Write-Ahead Logging (WAL) with SQLite directly on your local hard drive (`C:\\NoxisData\\Noxis-Local.db`). If WAPDA load shedding or generator switches occur, all transactions remain intact with zero corruption.",
  "offline": "The entire desktop ERP runs locally. All POS sales, Karigar piece-rates, Khata ledgers, and inventory changes save directly to your office PC hard drive.",
  "wifi": "Android companion phones connect via your office Wi-Fi router. Open **Device Pairing** (`/pairing`), scan the QR code on the PC screen, and sync piece-rates without cellular mobile data.",
  "pairing": "To pair supervisor phones, open **Device Pairing** (`/pairing`). Supervisors scan the on-screen QR code using their Android phone connected to the same office Wi-Fi network.",
  "cctv": "Connect up to 6 on-site IP cameras via RTSP in **CCTV Feeds** (`/cctv`). Features motion tripwire monitoring for sensitive inventory or loom entrance areas.",
  "fbr": "Noxis supports Pakistan FBR GST (18%) and UAE VAT (5%). Configure your tax profile in Settings → Regional & Currency, and all sales bills generate compliant invoices with NTN/STRN headers.",
  "tax": "Configure tax rates and compliance under **Tax & Compliance** (`/compliance`) and Settings → Regional & Currency.",
  "branches": "Manage multiple factory sheds, weaving mills, and regional branches under **Settings → Factory Branches** (`/settings/branches`).",
  "diagnostics": "System Diagnostics (`/settings/diagnostics`) tests local SQLite database latency, TCP local server bridges, and background sync health.",
  "backup": "Database backups can be exported anytime under **Settings → Backup & Restore** (`/settings/backup`). We recommend copying backup files to a USB flash drive at the end of each shift.",
  "khata": "Khata Ledger (`/khata`) provides balanced double-entry accounting with party running balances, debit/credit vouchers, and 1-click WhatsApp customer statements.",
  "return": "To handle a sales return, go to Invoices, locate the bill, and create a Credit Note. This restores stock to inventory and credits the customer's ledger.",
  "profit": "Profit & Loss calculations are generated under **Reports → Profit & Loss** (`/reports`). It computes Net Profit by subtracting Cost of Goods Sold (COGS) and Operating Expenses from Total Revenue.",
  "multi-user": "Add cashiers, accountants, and floor managers under **Settings → Staff & Roles** (`/settings/users`) with role-based access controls.",
};

export async function processChatQuery(query: string, history: ChatMessage[]): Promise<ChatMessage> {
  // Simulate local processing delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 700));

  const queryLower = query.toLowerCase();

  // 1. Check for Exact Common Questions
  for (const [key, answer] of Object.entries(COMMON_QUESTIONS)) {
    if (queryLower.includes(key)) {
      return {
        role: 'assistant',
        content: answer,
        timestamp: Date.now(),
        suggestions: ["System Overview", "How to backup?", "More help"]
      };
    }
  }

  // 2. Handle "A to Z" or "overview"
  if (queryLower.includes("overview") || queryLower.includes("a to z") || queryLower.includes("system") || queryLower.includes("everything")) {
    return {
      role: 'assistant',
      content: `I have detailed knowledge of the entire Noxis ecosystem. Here is an A to Z breakdown of what I can help you with:${SYSTEM_OVERVIEW}\n\nYou can also ask me specific 'How to' questions or troubleshooting tips.`,
      timestamp: Date.now(),
      suggestions: ["Mandi help", "Fleet tracking", "CCTV AI Zones"]
    };
  }

  const results = searchKnowledge(query, 3);
  
  if (results.length > 0) {
    const bestMatch = results[0];
    
    // Create a conversational response based on the knowledge entry
    let content = "";
    
    if (queryLower.includes("how") || queryLower.includes("tarika") || queryLower.includes("way") || queryLower.includes("procedure")) {
      content = `To ${bestMatch.title.toLowerCase()}, here is the exact procedure: ${bestMatch.content}`;
    } else if (queryLower.includes("what is") || queryLower.includes("define") || queryLower.includes("kya hai")) {
      content = `${bestMatch.title} is a core feature of the ${bestMatch.category} module. ${bestMatch.content}`;
    } else {
      content = `I found the relevant information for you. ${bestMatch.content}`;
    }

    if (bestMatch.shortcut) {
      content += `\n\n**Quick Shortcut:** \`${bestMatch.shortcut}\``;
    }

    if (bestMatch.route) {
      content += `\n\nI can take you to the **${bestMatch.category}** module if you'd like to perform this action now.`;
    }

    return {
      role: 'assistant',
      content,
      timestamp: Date.now(),
      relatedEntry: bestMatch,
      suggestions: results.slice(1).map(r => r.title)
    };
  }

  // Handle greetings
  if (queryLower.includes("hello") || queryLower.includes("hi") || queryLower.includes("hey")) {
    return {
      role: 'assistant',
      content: GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
      timestamp: Date.now(),
      suggestions: ["System Overview", "How to add Karigar?", "Scan a document"]
    };
  }

  return {
    role: 'assistant',
    content: FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)],
    timestamp: Date.now(),
    suggestions: ["System Overview", "Inventory help", "Security Audit"]
  };
}
