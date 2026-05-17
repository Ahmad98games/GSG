
export type KnowledgeEntry = {
  id: string
  title: string
  category: string
  tags: string[]
  content: string     // explanation text
  route?: string      // navigate to this page
  action?: string     // what action to trigger
  shortcuts?: string[] // keyboard shortcuts
  related?: string[]  // related entry IDs
}

export const knowledgeBase: KnowledgeEntry[] = [
  {
    id: 'payroll-run',
    title: 'Run monthly payroll',
    category: 'Payroll',
    tags: [
      'payroll', 'run payroll', 'salary',
      'tankhwa', 'wages', 'monthly payroll',
      'payroll help', 'how to pay workers',
      'calculate salary', 'pay workers',
      'payroll karo', 'tankhwa calculate',
      'worker payment', 'staff payment'
    ],
    content: 'To run payroll: Go to Payroll module, click Run Payroll Period button. Select the month. The system automatically pulls attendance records and production logs. Review each worker earnings, advance deductions, and net payable. Click Confirm to finalize.',
    route: '/payroll',
    shortcuts: ['Go to Payroll → Run Payroll Period'],
  },
  {
    id: 'payroll-advance',
    title: 'Give advance (Peshgi) to worker',
    category: 'Payroll',
    tags: [
      'peshgi', 'advance', 'loan', 'worker loan',
      'give advance', 'peshgi do', 'advance karo',
      'worker advance', 'karigar peshgi',
      'salary advance', 'emergency money'
    ],
    content: 'To give a Peshgi: Press Space and select Give Advance. Or go to Karigars, select the worker, go to Advances tab, click New Advance. Enter amount and reason. The advance is automatically deducted from next payroll.',
    route: '/karigars',
    shortcuts: ['Space → Give Advance'],
  },
  {
    id: 'production-log',
    title: 'Log daily production',
    category: 'Production',
    tags: [
      'production', 'log production', 'piece entry',
      'units produced', 'production log',
      'karigar production', 'daily output',
      'production karo', 'piece rate entry',
      'factory output', 'manufacturing log',
      'how many units', 'pieces produced'
    ],
    content: 'To log production: Press Space and select Log Production. Or go to Production module. Select the Karigar, enter units produced, select grade (A/B/C/Rejected). The system calculates earnings automatically based on piece rate.',
    route: '/production',
    shortcuts: ['Space → Log Production'],
  },
  {
    id: 'invoice-create',
    title: 'Create a new invoice',
    category: 'Invoices',
    tags: [
      'invoice', 'new invoice', 'create invoice',
      'bill', 'billing', 'sell', 'sale',
      'invoice banao', 'bill banao', 'naya invoice',
      'customer invoice', 'sales invoice',
      'how to invoice', 'invoice karo'
    ],
    content: 'To create an invoice: Click New Invoice in the Invoices section. Select the customer, add items by searching SKU names. Set quantity and price. Click Finalize and Post to save. The ledger updates automatically.',
    route: '/invoices/new',
    shortcuts: ['N key on invoices page'],
  },
  {
    id: 'stock-add',
    title: 'Add or adjust stock quantity',
    category: 'Inventory',
    tags: [
      'add stock', 'stock update', 'adjust stock',
      'quantity update', 'maal add karo',
      'stock badao', 'inventory update',
      'how to add stock', 'stock received',
      'goods received', 'stock adjust'
    ],
    content: 'To add stock: Go to Inventory, click on the product, select Adjust Stock. Enter quantity to add or the new total. All adjustments are logged in the audit trail automatically.',
    route: '/inventory',
    shortcuts: ['Space → Adjust Stock'],
  },
  {
    id: 'report-view',
    title: 'View financial reports',
    category: 'Reports',
    tags: [
      'report', 'reports', 'financial report',
      'profit loss', 'balance sheet',
      'trial balance', 'sales report',
      'view reports', 'monthly report',
      'rport dikhao', 'financial summary',
      'profit kya hai', 'revenue report'
    ],
    content: 'To view reports: Go to Reports module. Choose from Profit and Loss, Balance Sheet, Trial Balance, Aging Report, Tax Return, or Export Center. Select the date range and the report generates automatically.',
    route: '/reports',
  },
  {
    id: 'cashflow-view',
    title: 'Check cash flow and cash position',
    category: 'Cashflow',
    tags: [
      'cashflow', 'cash flow', 'cash position',
      'nakdi', 'paisa kitna', 'how much cash',
      'liquidity', 'cash balance', 'money',
      'cash forecast', '90 day forecast',
      'shortfall', 'cash alert'
    ],
    content: 'To check cash flow: Go to Cashflow module. See current cash position, 30 and 90 day forecast. Red alerts show projected shortfalls. Green shows healthy position.',
    route: '/cashflow',
  },
  {
    id: 'karigar-add',
    title: 'Add a new worker or Karigar',
    category: 'Karigars',
    tags: [
      'add karigar', 'new worker', 'register worker',
      'karigar add', 'naya karigar', 'worker register',
      'staff add', 'employee add', 'hire worker',
      'how to add karigar', 'worker register karo'
    ],
    content: 'To add a Karigar: Go to Karigars module, click Add Karigar. Enter name, phone number, wage type (piece rate, daily, or monthly) and the rate. The system auto-generates a Karigar code.',
    route: '/karigars',
  },
  {
    id: 'party-add',
    title: 'Add a customer or supplier',
    category: 'Parties',
    tags: [
      'add party', 'new customer', 'add customer',
      'add supplier', 'new supplier', 'party add',
      'customer register', 'naya customer',
      'buyer add', 'vendor add', 'client add',
      'business contact add'
    ],
    content: 'To add a party: Go to Parties module, click Add Party. Select type (Customer or Supplier). Enter name, phone, and credit limit. The system tracks all transactions with this party automatically.',
    route: '/parties',
  },
  {
    id: 'purchase-order',
    title: 'Create a purchase order',
    category: 'Purchase',
    tags: [
      'purchase order', 'buy material',
      'order from supplier', 'kharid', 'purchase karo',
      'material order', 'raw material buy',
      'supplier order', 'po create', 'order material'
    ],
    content: 'To create a purchase order: Go to Purchase module, click New Purchase Order. Select the supplier, add items with quantities and rates. The system calculates totals. Click Issue to send the order.',
    route: '/purchase/new',
  },
  {
    id: 'settings-open',
    title: 'Open settings',
    category: 'Settings',
    tags: [
      'settings', 'setting', 'configuration',
      'setup', 'tarteeb', 'preferences',
      'business settings', 'system settings',
      'how to change settings', 'configure noxis'
    ],
    content: 'Settings are in the bottom of the left sidebar. Click Settings to access: Business Profile, Regional settings, Appearance (themes), Language, Updates, and System Info.',
    route: '/settings',
  },
  {
    id: 'lens-scan',
    title: 'Scan a document or bill',
    category: 'Lens',
    tags: [
      'scan', 'ocr', 'scan bill', 'scan invoice',
      'document scan', 'scan document',
      'bill scan', 'read document',
      'scan receipt', 'bill upload',
      'scan karo', 'bill padhna'
    ],
    content: 'To scan a document: Go to Noxis Lens. Drop an image file or take a photo with your phone. The system reads the document and extracts party name, amount, and invoice number automatically.',
    route: '/lens',
  },
  {
    id: 'theme-change',
    title: 'Change colors or theme',
    category: 'Settings',
    tags: [
      'theme', 'color', 'change color',
      'dark mode', 'light mode', 'appearance',
      'theme change', 'color scheme', 'looks',
      'interface color', 'ctrl t'
    ],
    content: 'To change theme: Press Ctrl+T anywhere in the app. Or go to Settings, Appearance tab. Choose from 20 industrial themes. The interface changes instantly.',
    route: '/settings',
    shortcuts: ['Ctrl + T'],
  },
  {
    id: 'language-change',
    title: 'Switch to Urdu or other language',
    category: 'Settings',
    tags: [
      'language', 'urdu', 'zaban', 'urdu karo',
      'switch language', 'language change',
      'aurdoo', 'hindi', 'change language',
      'local language', 'rtl'
    ],
    content: 'To switch language: Click EN in the top header bar and select your language. Urdu switches the entire interface to Nastaliq script with right-to-left layout. Numbers stay in English for clarity.',
    shortcuts: ['EN | اردو toggle in header'],
  },
  {
    id: 'cctv-setup',
    title: 'Set up security cameras',
    category: 'CCTV',
    tags: [
      'cctv', 'camera', 'security camera',
      'add camera', 'setup camera', 'rtsp',
      'surveillance', 'monitor', 'camera add',
      'security setup', 'cctv connect'
    ],
    content: 'To add a camera: Go to CCTV module, click Camera Settings. Click Add Camera. Enter camera name, IP address, and port. The system auto-builds the RTSP URL. Click Test Connection to verify before saving.',
    route: '/cctv',
  },
  {
    id: 'whatsapp-send',
    title: 'Send invoice or summary via WhatsApp',
    category: 'WhatsApp',
    tags: [
      'whatsapp', 'send whatsapp', 'share invoice',
      'whatsapp karo', 'invoice bhejo',
      'send message', 'notification send',
      'daily summary whatsapp', 'summary send'
    ],
    content: 'To send via WhatsApp: Open any invoice and click Send via WhatsApp. For daily summary, go to Dashboard and click WhatsApp Summary button. The system opens WhatsApp with a pre-filled message ready to send.',
  },
  {
    id: 'generator-payslip',
    title: 'Generate salary slip',
    category: 'Generators',
    tags: [
      'salary slip', 'payslip', 'pay slip',
      'tankhwa slip', 'salary receipt',
      'generate payslip', 'worker payslip',
      'print salary', 'payslip banao'
    ],
    content: 'To generate a salary slip: Go to Generators, select Salary Slip. Choose the worker and month. The slip auto-fills with earnings, deductions, and net payable. Print or send via WhatsApp.',
    route: '/generators/payslip',
  },
  {
    id: 'converter-use',
    title: 'Use converters and calculators',
    category: 'Tools',
    tags: [
      'converter', 'calculator', 'convert',
      'currency convert', 'weight convert',
      'fabric calculator', 'gsm calculate',
      'emi calculate', 'margin calculate',
      'tools', 'utility'
    ],
    content: 'Converters are in the Tools section of the sidebar. Available: Currency, Weight, Fabric Length, GSM, Margin/Markup, Piece Rate, Container Load, and EMI Calculator. All work offline without internet.',
    route: '/converters',
  },

  // PRODUCTION
  {
    id: 'prod-batch',
    title: 'Track production batches',
    category: 'Production',
    tags: ['batch tracking', 'production', 'manufacturing',
           'lot number', 'batch number', 'maal bano',
           'production tracking'],
    content: 'Go to Production → Batches. Click + New Batch. Select the product and quantity. The system generates a unique Batch ID. You can track raw material consumption and finished goods output for each batch.',
    route: '/production/batches',
  },
  {
    id: 'prod-wastage',
    title: 'Record production wastage',
    category: 'Production',
    tags: ['wastage', 'scrap', 'loss',
           'production loss', 'kharaab maal', 'zaya'],
    content: 'During batch closing, enter the wastage quantity. The system calculates the yield percentage. High wastage triggers an alert for the floor manager to inspect machines or material quality.',
    route: '/production',
  },

  // SALES & DISTRIBUTION
  {
    id: 'sale-quotation',
    title: 'Create a sales quotation',
    category: 'Sales',
    tags: ['quotation', 'estimate', 'price quote',
           'sales order', 'rate list', 'estimate do'],
    content: 'Go to Sales → Quotations. Click + Create Quote. Add products and apply special discounts. You can convert an approved quotation into a Sales Invoice with one click.',
    route: '/sales/quotations',
  },
  {
    id: 'sale-gatepass',
    title: 'Generate a Gate Pass',
    category: 'Sales',
    tags: ['gate pass', 'dispatch', 'loading',
           'delivery note', 'gate entry', 'maal nikalo'],
    content: 'Go to Logistics → Gate Pass. Select the Invoice or Sales Order. The Gate Pass lists the driver name, vehicle number, and items to be loaded. It must be signed by the security guard upon exit.',
    route: '/logistics/gate-pass',
  },

  // PURCHASE & SOURCING
  {
    id: 'pur-order',
    title: 'Create a Purchase Order (PO)',
    category: 'Purchase',
    tags: ['purchase order', 'po', 'order material',
           'supplier order', 'raw material', 'order do'],
    content: 'Go to Purchase → Orders. Click + New PO. Select the supplier and items. Once approved, the PO can be emailed to the supplier. When material arrives, use "Receive Items" to update stock.',
    route: '/purchase/orders',
  },

  // AUDIT & SECURITY
  {
    id: 'audit-logs',
    title: 'View system audit logs',
    category: 'Security',
    tags: ['audit logs', 'activity log', 'history',
           'who changed', 'track changes', 'hisaab check'],
    content: 'Admin users can go to Settings → Audit Logs. This shows every action taken in the system: who created which invoice, when a stock was adjusted, and any deleted entries. Essential for accountability.',
    route: '/settings/audit',
  },
  {
    id: 'sec-roles',
    title: 'Manage user permissions',
    category: 'Security',
    tags: ['permissions', 'user roles', 'access control',
           'security settings', 'user add', 'password change'],
    content: 'Go to Settings → Users. You can define roles like "Accountant", "Manager", or "Operator". Each role has specific permissions for viewing, creating, or deleting data across different modules.',
    route: '/settings/users',
  },

  // DATA & EXPORT
  {
    id: 'data-backup',
    title: 'Manual database backup',
    category: 'Data',
    tags: ['backup', 'database', 'save data',
           'export database', 'backup lo', 'data safe'],
    content: 'The system auto-backups every 24 hours. For manual backup, go to Settings → Data Management → Backup Now. It creates an encrypted .noxis file that can be restored on any device.',
    route: '/settings/data',
  },
  {
    id: 'data-excel',
    title: 'Export data to Excel/CSV',
    category: 'Data',
    tags: ['excel export', 'csv', 'spreadsheet',
           'download data', 'excel nikalo', 'report export'],
    content: 'Almost every table in Noxis (Invoices, Inventory, Karigars) has an Export button at the top right. Click it to download the current view as an Excel or CSV file for external analysis.',
  },

  // MANDI (Grain/Rice Market)
  {
    id: 'mandi-bardan',
    title: 'Track Bardan (Bags) inventory',
    category: 'Mandi',
    tags: ['bardan', 'bags', 'bori', 'empty bags',
           'mandi stock', 'bardan tracking', 'bora'],
    content: 'Go to Mandi → Bardan. Track different types of bags (Jute, PP, etc.). The system monitors Bardan issued to commission agents and returned from the field. Essential for accurate rice/grain stock calculation.',
    route: '/mandi/bardan',
  },
  {
    id: 'mandi-commission',
    title: 'Manage Mandi Commission Agents',
    category: 'Mandi',
    tags: ['commission', 'arhti', 'agent',
           'mandi agents', 'commission tracking', 'arhat'],
    content: 'Go to Mandi → Agents. You can set commission percentages for different agents. The system automatically calculates commission during purchase entries and updates the agent\'s ledger.',
    route: '/mandi/agents',
  },

  // FLEET & LOGISTICS
  {
    id: 'fleet-fuel',
    title: 'Monitor vehicle fuel logs',
    category: 'Fleet',
    tags: ['fuel', 'diesel', 'petrol', 'mileage',
           'vehicle fuel', 'fuel consumption', 'tel ka kharcha'],
    content: 'Go to Fleet → Fuel Logs. Enter vehicle number, liters filled, and current odometer reading. The system calculates KM/Liter efficiency and alerts if fuel consumption is unusually high (potential theft or maintenance issue).',
    route: '/fleet/fuel',
  },
  {
    id: 'fleet-maintenance',
    title: 'Track vehicle maintenance',
    category: 'Fleet',
    tags: ['maintenance', 'service', 'oil change',
           'tyre change', 'truck repair', 'gari check'],
    content: 'Go to Fleet → Maintenance. Set reminders for oil changes, insurance renewals, and fitness certificates. The system notifies the transport manager before any vehicle becomes non-compliant.',
    route: '/fleet',
  },

  // KITCHEN & CANTEEN
  {
    id: 'kitchen-meals',
    title: 'Plan worker meals and canteen',
    category: 'Kitchen',
    tags: ['canteen', 'meals', 'food', 'mess',
           'worker food', 'canteen inventory', 'khana'],
    content: 'Go to Kitchen → Meal Plan. Record daily consumption of ration (flour, oil, pulses). The system calculates cost per meal and syncs with Karigar attendance to ensure food wastage is minimized.',
    route: '/kitchen',
  },

  // MEDICAL & HEALTH
  {
    id: 'med-incidents',
    title: 'Record medical incidents',
    category: 'Medical',
    tags: ['medical', 'accident', 'first aid',
           'injury', 'worker health', 'dispensary', 'chot'],
    content: 'Go to Medical → Incident Reports. Document any workplace injuries or health issues. Track medicine issued from the factory dispensary and maintain health records for all industrial workers.',
    route: '/medical',
  },

  // CLIENT PORTAL & PAYMENTS
  {
    id: 'portal-invite',
    title: 'Invite customers to Client Portal',
    category: 'Portal',
    tags: ['client portal', 'invite customer', 'online statement',
           'customer access', 'portal invite', 'online hisaab'],
    content: 'Go to Parties → [Select Customer] → Portal Settings. Click Send Invite. The customer receives an email to set up their password. They can then view their statements and pay invoices online.',
    route: '/portal-manager',
  },
  {
    id: 'portal-payment',
    title: 'Process online portal payments',
    category: 'Portal',
    tags: ['online payment', 'stripe', 'jazzcash',
           'easypaisa', 'credit card', 'paisa wasool'],
    content: 'Customers can pay via Stripe, JazzCash, or EasyPaisa through their portal. Once payment is successful, the Hub automatically records a credit entry in their ledger and notifies the accountant.',
  },

  // SECURITY & AI MONITORING
  {
    id: 'sec-ai-zones',
    title: 'Configure Security Zones',
    category: 'Security',
    tags: ['detection zones', 'security zones', 'intrusion',
           'camera zones', 'ai camera', 'khatra alert'],
    content: 'Go to CCTV → Security Zones. Draw polygons on the camera feed to define restricted areas. The system will only trigger alerts if a person or vehicle enters these specific zones during locked hours.',
    route: '/cctv/security-zones',
  },
  {
    id: 'sec-guardian',
    title: 'Guardian Authorization',
    category: 'Security',
    tags: ['guardian', 'remote auth', 'owner approval',
           '2fa', 'security approval', 'malik approval'],
    content: 'High-value actions (like deleting a large invoice) trigger a Guardian Auth Request. The owner receives a notification on their mobile phone and must approve the action before it completes on the Hub.',
  },

  // TROUBLESHOOTING
  {
    id: 'ts-pairing',
    title: 'Fix mobile pairing issues',
    category: 'Support',
    tags: ['pairing failed', 'connection error', 'offline phone',
           'qr not scanning', 'wifi error', 'pair nahi ho raha'],
    content: '1. Ensure both phone and Hub are on the same Wi-Fi. 2. Check if Windows Firewall is blocking Port 8080. 3. Restart the Sync Engine from Settings → Network.',
  },
  // INDUSTRIAL MORPHING ENGINE (A to Z)
  {
    id: 'morph-textile',
    title: 'Textile (Kapra) Sector Configuration',
    category: 'Industries',
    tags: ['textile', 'kapra', 'meter', 'thaan', 'karigar', 'weaving', 'dyeing'],
    content: 'In Textile mode, the system uses "Meters" as primary unit and "Thaan" as secondary. Workers are called "Karigars". Active modules include Weaving, Dyeing, and Piece-rate Payroll. Dashboard highlights batch status and karigar efficiency.',
  },
  {
    id: 'morph-leather',
    title: 'Leather (Chamra) Sector Configuration',
    category: 'Industries',
    tags: ['leather', 'chamra', 'sqft', 'skin', 'artisan', 'tanning'],
    content: 'In Leather mode, the system uses "SQFT" as primary unit and "Skin" as secondary. Workers are called "Artisans". Active modules include Tanning and Quality Control. Dashboard tracks grade distribution (A/B/C grade hides).',
  },
  {
    id: 'morph-pharma',
    title: 'Pharma (Medical) Sector Configuration',
    category: 'Industries',
    tags: ['pharma', 'medical', 'medicine', 'unit', 'pack', 'doctor', 'chemist', 'expiry'],
    content: 'In Pharma mode, the system tracks "Medicine Stock" using Units and Packs. Workers are "Doctors/Chemists". Key modules: Expiry Tracker and Compliance. Dashboard alerts for near-expiry batches and sales flow.',
  },
  {
    id: 'morph-auto',
    title: 'Auto Parts Sector Configuration',
    category: 'Industries',
    tags: ['auto parts', 'spare parts', 'piece', 'box', 'technician', 'workshop'],
    content: 'In Auto Parts mode, stock is called "Spare Parts" (Pieces/Boxes). Workers are "Technicians". Key modules: Compatibility Map and Workshop Management. Dashboard tracks the order pipeline and low-stock spare parts.',
  },
  {
    id: 'morph-rice',
    title: 'Rice (Chawal) Sector Configuration',
    category: 'Industries',
    tags: ['rice', 'chawal', 'sack', 'kg', 'farmer', 'mill', 'milling', 'moisture'],
    content: 'In Rice mode, stock is managed in "Sacks" and "KG". Workers are "Mill Operators". Key modules: Milling, Moisture Lab, and Procurement. Dashboard monitors moisture levels and milling yield percentage.',
  },
  {
    id: 'morph-wholesale',
    title: 'Wholesale (Kiryana) Sector Configuration',
    category: 'Industries',
    tags: ['wholesale', 'kiryana', 'carton', 'piece', 'store keeper', 'bulk stock'],
    content: 'In Wholesale mode, stock is "Bulk Stock" (Cartons/Pieces). Workers are "Store Keepers". Key modules: Bulk Orders and Central Ledger. Dashboard tracks fast-moving items and credit aging (who owes money).',
  },
  {
    id: 'morph-stone',
    title: 'Stone (Marble) Sector Configuration',
    category: 'Industries',
    tags: ['stone', 'marble', 'sqft', 'slab', 'stone cutter', 'cutting', 'polishing'],
    content: 'In Marble mode, the system tracks "Block Inventory" in SQFT and Slabs. Workers are "Stone Cutters". Key modules: Cutting, Polishing, and Wastage Tracking. Dashboard analyzes block utilization and slab yield.',
  },

  // SYSTEM ARCHITECTURE (v13.0.0)
  {
    id: 'sys-stack',
    title: 'Noxis Technical Stack',
    category: 'Technical',
    tags: ['tech stack', 'electron', 'nextjs', 'typescript', 'supabase', 'sqlite', 'v13'],
    content: 'Noxis v13 is built using Electron (Shell), Next.js (Renderer), and TypeScript. It uses a Hybrid-Storage model: Local SQLite (Encrypted) for real-time operations and Supabase (PostgreSQL) for Cloud Sync and backup.',
  },
  {
    id: 'sys-storage',
    title: 'Hybrid Data Storage Logic',
    category: 'Technical',
    tags: ['storage', 'sqlite', 'postgres', 'encryption', 'data security'],
    content: 'All critical data (Ledger, Stock, Karigars) is first saved to an encrypted local SQLite database (NOXIS-local.db). The Sync Engine then pushes these changes to the Supabase Cloud in the background when internet is available.',
  },

  // DEPLOYMENT & SETUP
  {
    id: 'setup-hw',
    title: 'Hardware Prerequisites',
    category: 'Setup',
    tags: ['hardware', 'requirements', 'ups', 'network', 'main computer'],
    content: 'Recommended: Windows 10/11 Pro, Stable local network, and a UPS with 30 min backup to prevent database corruption during power cuts.',
  },
  {
    id: 'setup-deploy',
    title: 'System Deployment Procedure',
    category: 'Setup',
    tags: ['deployment', 'installation', 'binary', 'env config'],
    content: '1. Extract binary to C:\\NoxisHub. 2. Configure .env.local with Supabase keys. 3. Run connectivity tests. 4. Start Hub Service. Avoid running from Downloads folder due to permission restrictions.',
  },
  // FINANCE & ACCOUNTING (A to Z)
  {
    id: 'fin-ledger',
    title: 'Central Ledger Management',
    category: 'Finance',
    tags: ['ledger', 'khata', 'accounting', 'debit', 'credit', 'trial balance'],
    content: 'The Central Ledger tracks all value movement using double-entry logic. You can filter by Date Range or Account Head. Every entry is linked to a Source Document (Invoice/Voucher) for easy auditing. Use "Export Trial Balance" for external verification.',
    route: '/khata',
  },
  {
    id: 'fin-imbalance',
    title: 'Resolving Ledger Imbalance',
    category: 'Finance',
    tags: ['imbalance', 'ledger error', 'accounting issue', 'out of sync'],
    content: 'If the ledger does not balance, check for manually edited database entries or interrupted sync processes. Ensure that "Auto-post to Ledger" is enabled in your module settings (Stock/Payroll/Sales).',
  },

  // INDUSTRIAL KPIs
  {
    id: 'kpi-dashboard',
    title: 'Industrial Dashboard Widgets',
    category: 'Analytics',
    tags: ['kpi', 'dashboard', 'widgets', 'analytics', 'efficiency'],
    content: 'Dashboard widgets vary by industry: "Moisture Levels" for Rice, "Grade Distribution" for Leather, "Expiry Alerts" for Pharma, and "Karigar Efficiency" for Textile. These provide real-time operational visibility.',
    route: '/dashboard',
  },

  // ADVANCED RECOVERY
  {
    id: 'ts-advanced-recovery',
    title: 'Advanced System Recovery',
    category: 'Support',
    tags: ['recovery', 'fix system', 'force resync', 'db corruption'],
    content: 'In case of severe data corruption: 1. Stop Hub service. 2. Backup and clear local cache. 3. Restart with the --refresh flag to force a full re-sync from the Cloud.',
  },
  {
    id: 'ts-sync',
    title: 'Resolve Cloud Sync errors',
    category: 'Support',
    tags: ['sync error', 'data not uploading', 'red icon',
           'internet offline', 'sync fail', 'upload nahi ho raha'],
    content: 'Check the Sync Queue in Settings → Data Management. If items are "failed", check your internet connection and click "Retry Failed Syncs". Ensure your Cloud Subscription is active.',
    route: '/settings/data',
  },
]
