
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
  "internet": "Noxis Hub is designed to work 100% offline. You only need internet for Cloud Sync and sending WhatsApp messages.",
  "return": "To handle a return, go to Sales → Invoices, find the invoice, and click 'Credit Note'. This will return the stock to inventory and update the party's ledger.",
  "meters": "To change units (e.g., from Meters to Sacks), go to Settings → Industrial Morphing. Select your industry type, and the entire system will update its terminology automatically.",
  "backup": "The system auto-backups daily to your local drive. You can find these in C:\\Noxis\\Backups. We also recommend enabling Cloud Sync for off-site security.",
  "karigar card": "If a Karigar loses their card, go to Karigars, select the worker, and click 'Regenerate QR'. This will invalidate the old card and issue a new one.",
  "profit": "Profit is calculated in Reports → Profit & Loss. It subtracts your Cost of Goods Sold (COGS) and Expenses from your Total Revenue.",
  "multi-user": "Yes, you can add more users in Settings → Users. Each user can have different permissions (e.g., restricted access to Khata).",
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

    if (bestMatch.shortcuts && bestMatch.shortcuts.length > 0) {
      content += `\n\n**Quick Shortcut:** \`${bestMatch.shortcuts[0]}\``;
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
