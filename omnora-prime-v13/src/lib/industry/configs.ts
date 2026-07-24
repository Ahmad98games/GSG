export type IndustryKey =
  | 'textile'
  | 'rice'
  | 'medical'
  | 'auto'
  | 'garment'
  | 'food'
  | 'general'

export interface IndustryConfig {
  key: IndustryKey
  displayName: string
  emoji: string
  description: string
  defaultLandingRoute: string

  // ── Terminology ──
  // What each concept is called in this industry
  terms: {
    worker: string           // Karigar / Worker / Employee / Pharmacist
    workers: string          // Karigars / Workers / Staff / Team
    advance: string          // Peshgi / Advance / Loan / Float
    item: string             // Fabric / Medicine / Part / Ingredient
    items: string            // Fabrics / Medicines / Parts / Ingredients
    itemCode: string         // SKU / Batch No / Part No / Item Code
    production: string       // Production / Dispensing / Assembly / Processing
    productionUnit: string   // Pieces / Vials / Units / Kg / Yards
    invoice: string          // Invoice / Prescription / Work Order / Bill
    invoices: string         // Invoices / Prescriptions / Work Orders / Bills
    dispatch: string         // Dispatch / Delivery / Shipment / Fulfillment
    ledger: string           // Khata / Ledger / Account / Register
    supplier: string         // Supplier / Wholesaler / Vendor / Distributor
    customer: string         // Customer / Patient / Client / Buyer
    batch: string            // Batch / Lot / Run / Pack
    qualityGrade: string     // Grade / Quality / Class / Standard
    warehouseAction: string  // Received / Dispensed / Assembled / Processed
    reportTitle: string      // Production Report / Dispensing Log / Assembly Log
  }

  // ── Sidebar navigation labels ──
  sidebar: {
    dashboard: string
    inventory: string
    workers: string
    production: string
    invoices: string
    parties: string
    ledger: string
    payroll: string
    dispatch: string
    reports: string
    purchase: string
  }

  // ── Features shown/hidden per industry ──
  features: {
    pieceRateWages: boolean      // textile, garment
    peshgiAdvances: boolean      // textile, garment, rice
    batchTracking: boolean       // medical, food, rice
    expiryManagement: boolean    // medical, food
    yieldTracking: boolean       // rice, food
    variantTracking: boolean     // garment (size/color)
    vinTracking: boolean         // auto parts
    coldChainLogging: boolean    // medical, food
    qualityGrading: boolean      // textile, garment, rice
    prescriptionMode: boolean    // medical
    weightBasedUnits: boolean    // rice, food
    laborLawCompliance: boolean  // all, but rules differ
    cctvSentinel: boolean        // all
  }

  // ── Default units for this industry ──
  defaultUnits: string[]

  // ── Pay types most common in this industry ──
  defaultPayTypes: ('piece_rate' | 'daily' | 'monthly')[]

  // ── Color accent for this industry in UI ──
  // Textile is blue, Medical is emerald,
  // Auto is amber, etc.
  accentColor: string
  accentColorDim: string
}

// ─────────────────────────────────────
// TEXTILE — the original, most complete
// ─────────────────────────────────────
const textile: IndustryConfig = {
  key: 'textile',
  displayName: 'Textile Mill',
  emoji: '🧵',
  description: 'Fabric production, karigar piece-rate wages, peshgi advances',
  defaultLandingRoute: '/production/grid',
  accentColor: '#60A5FA',
  accentColorDim: 'rgba(96,165,250,0.1)',
  terms: {
    worker: 'Karigar',
    workers: 'Karigars',
    advance: 'Peshgi',
    item: 'Fabric',
    items: 'Fabrics',
    itemCode: 'SKU Code',
    production: 'Production',
    productionUnit: 'Pieces',
    invoice: 'Invoice',
    invoices: 'Invoices',
    dispatch: 'Dispatch',
    ledger: 'Khata',
    supplier: 'Supplier',
    customer: 'Customer',
    batch: 'Batch',
    qualityGrade: 'Grade',
    warehouseAction: 'Received',
    reportTitle: 'Production Report',
  },
  sidebar: {
    dashboard: 'Dashboard',
    inventory: 'Stock',
    workers: 'Karigars',
    production: 'Production',
    invoices: 'Invoices',
    parties: 'Parties',
    ledger: 'Khata',
    payroll: 'Payroll',
    dispatch: 'Dispatch',
    reports: 'Reports',
    purchase: 'Purchase',
  },
  features: {
    pieceRateWages: true,
    peshgiAdvances: true,
    batchTracking: false,
    expiryManagement: false,
    yieldTracking: false,
    variantTracking: false,
    vinTracking: false,
    coldChainLogging: false,
    qualityGrading: true,
    prescriptionMode: false,
    weightBasedUnits: false,
    laborLawCompliance: true,
    cctvSentinel: true,
  },
  defaultUnits: ['meters', 'yards', 'kg', 'rolls', 'pieces'],
  defaultPayTypes: ['piece_rate', 'daily', 'monthly'],
}

// ─────────────────────────────────────
// RICE MILL
// ─────────────────────────────────────
const rice: IndustryConfig = {
  key: 'rice',
  displayName: 'Rice Mill',
  emoji: '🌾',
  description: 'Paddy milling, yield tracking, weight-based inventory',
  defaultLandingRoute: '/dashboard',
  accentColor: '#C5A059',
  accentColorDim: 'rgba(197,160,89,0.1)',
  terms: {
    worker: 'Mazdoor',
    workers: 'Mazdoor',
    advance: 'Peshgi',
    item: 'Rice / Paddy',
    items: 'Rice Stock',
    itemCode: 'Batch No',
    production: 'Milling',
    productionUnit: 'Bags / Kg',
    invoice: 'Sales Bill',
    invoices: 'Sales Bills',
    dispatch: 'Delivery',
    ledger: 'Khata',
    supplier: 'Paddy Supplier',
    customer: 'Dealer / Buyer',
    batch: 'Lot',
    qualityGrade: 'Quality',
    warehouseAction: 'Received (Paddy)',
    reportTitle: 'Milling Report',
  },
  sidebar: {
    dashboard: 'Dashboard',
    inventory: 'Stock',
    workers: 'Mazdoor',
    production: 'Milling',
    invoices: 'Sales Bills',
    parties: 'Parties',
    ledger: 'Khata',
    payroll: 'Payroll',
    dispatch: 'Delivery',
    reports: 'Reports',
    purchase: 'Paddy Purchase',
  },
  features: {
    pieceRateWages: false,
    peshgiAdvances: true,
    batchTracking: true,
    expiryManagement: false,
    yieldTracking: true,
    variantTracking: false,
    vinTracking: false,
    coldChainLogging: false,
    qualityGrading: true,
    prescriptionMode: false,
    weightBasedUnits: true,
    laborLawCompliance: true,
    cctvSentinel: true,
  },
  defaultUnits: ['kg', 'bags', 'maund', 'ton'],
  defaultPayTypes: ['daily', 'monthly'],
}

// ─────────────────────────────────────
// MEDICAL / PHARMACY / PHARMA
// ─────────────────────────────────────
const medical: IndustryConfig = {
  key: 'medical',
  displayName: 'Medical / Pharmacy',
  emoji: '💊',
  description: 'Medicine inventory, expiry tracking, prescription dispensing',
  defaultLandingRoute: '/pos',
  accentColor: '#10B981',
  accentColorDim: 'rgba(16,185,129,0.1)',
  terms: {
    worker: 'Pharmacist',
    workers: 'Staff',
    advance: 'Salary Advance',
    item: 'Medicine',
    items: 'Medicines',
    itemCode: 'Batch No',
    production: 'Dispensing',
    productionUnit: 'Units / Strips',
    invoice: 'Prescription Bill',
    invoices: 'Prescription Bills',
    dispatch: 'Fulfillment',
    ledger: 'Account',
    supplier: 'Distributor',
    customer: 'Patient / Client',
    batch: 'Batch',
    qualityGrade: 'Class',
    warehouseAction: 'Stock Received',
    reportTitle: 'Dispensing Log',
  },
  sidebar: {
    dashboard: 'Dashboard',
    inventory: 'Medicines',
    workers: 'Staff',
    production: 'Dispensing',
    invoices: 'Prescription Bills',
    parties: 'Patients & Suppliers',
    ledger: 'Accounts',
    payroll: 'Salaries',
    dispatch: 'Fulfillment',
    reports: 'Reports',
    purchase: 'Stock Purchase',
  },
  features: {
    pieceRateWages: false,
    peshgiAdvances: false,
    batchTracking: true,
    expiryManagement: true,
    yieldTracking: false,
    variantTracking: false,
    vinTracking: false,
    coldChainLogging: true,
    qualityGrading: false,
    prescriptionMode: true,
    weightBasedUnits: false,
    laborLawCompliance: true,
    cctvSentinel: true,
  },
  defaultUnits: ['strips', 'bottles', 'vials', 'units', 'packs'],
  defaultPayTypes: ['monthly'],
}

// ─────────────────────────────────────
// AUTO PARTS
// ─────────────────────────────────────
const auto: IndustryConfig = {
  key: 'auto',
  displayName: 'Auto Parts',
  emoji: '🔧',
  description: 'Parts inventory, work orders, vehicle service tracking',
  defaultLandingRoute: '/pos',
  accentColor: '#F59E0B',
  accentColorDim: 'rgba(245,158,11,0.1)',
  terms: {
    worker: 'Mechanic',
    workers: 'Mechanics',
    advance: 'Advance',
    item: 'Part',
    items: 'Parts',
    itemCode: 'Part No',
    production: 'Workshop Jobs',
    productionUnit: 'Units',
    invoice: 'Work Order',
    invoices: 'Work Orders',
    dispatch: 'Delivery',
    ledger: 'Account',
    supplier: 'Parts Vendor',
    customer: 'Customer / Fleet',
    batch: 'Lot',
    qualityGrade: 'Grade',
    warehouseAction: 'Parts Received',
    reportTitle: 'Job Card Report',
  },
  sidebar: {
    dashboard: 'Dashboard',
    inventory: 'Parts Stock',
    workers: 'Mechanics',
    production: 'Workshop',
    invoices: 'Work Orders',
    parties: 'Customers & Vendors',
    ledger: 'Accounts',
    payroll: 'Wages',
    dispatch: 'Delivery',
    reports: 'Reports',
    purchase: 'Parts Purchase',
  },
  features: {
    pieceRateWages: true,
    peshgiAdvances: true,
    batchTracking: false,
    expiryManagement: false,
    yieldTracking: false,
    variantTracking: false,
    vinTracking: true,
    coldChainLogging: false,
    qualityGrading: false,
    prescriptionMode: false,
    weightBasedUnits: false,
    laborLawCompliance: true,
    cctvSentinel: true,
  },
  defaultUnits: ['pcs', 'sets', 'pairs', 'liters', 'kg'],
  defaultPayTypes: ['piece_rate', 'daily', 'monthly'],
}

// ─────────────────────────────────────
// GARMENT FACTORY
// ─────────────────────────────────────
const garment: IndustryConfig = {
  key: 'garment',
  displayName: 'Garment Factory',
  emoji: '👔',
  description: 'Stitching, size/color variants, piece-rate workers',
  defaultLandingRoute: '/production/grid',
  accentColor: '#8B5CF6',
  accentColorDim: 'rgba(139,92,246,0.1)',
  terms: {
    worker: 'Karigar',
    workers: 'Karigars',
    advance: 'Peshgi',
    item: 'Garment / Fabric',
    items: 'Garments',
    itemCode: 'Style Code',
    production: 'Stitching',
    productionUnit: 'Pieces',
    invoice: 'Invoice',
    invoices: 'Invoices',
    dispatch: 'Shipment',
    ledger: 'Khata',
    supplier: 'Fabric Supplier',
    customer: 'Buyer / Brand',
    batch: 'Style Batch',
    qualityGrade: 'Quality Class',
    warehouseAction: 'Fabric Received',
    reportTitle: 'Stitching Report',
  },
  sidebar: {
    dashboard: 'Dashboard',
    inventory: 'Fabric / Stock',
    workers: 'Karigars',
    production: 'Stitching',
    invoices: 'Invoices',
    parties: 'Buyers & Suppliers',
    ledger: 'Khata',
    payroll: 'Wages',
    dispatch: 'Shipment',
    reports: 'Reports',
    purchase: 'Fabric Purchase',
  },
  features: {
    pieceRateWages: true,
    peshgiAdvances: true,
    batchTracking: true,
    expiryManagement: false,
    yieldTracking: false,
    variantTracking: true,
    vinTracking: false,
    coldChainLogging: false,
    qualityGrading: true,
    prescriptionMode: false,
    weightBasedUnits: false,
    laborLawCompliance: true,
    cctvSentinel: true,
  },
  defaultUnits: ['pieces', 'meters', 'yards', 'dozens'],
  defaultPayTypes: ['piece_rate', 'daily'],
}

// ─────────────────────────────────────
// FOOD PROCESSING
// ─────────────────────────────────────
const food: IndustryConfig = {
  key: 'food',
  displayName: 'Food Processing',
  emoji: '🏭',
  description: 'Shelf life tracking, weight-based stock, FIFO management',
  defaultLandingRoute: '/dashboard',
  accentColor: '#EF4444',
  accentColorDim: 'rgba(239,68,68,0.1)',
  terms: {
    worker: 'Worker',
    workers: 'Workers',
    advance: 'Advance',
    item: 'Ingredient / Product',
    items: 'Ingredients',
    itemCode: 'Batch No',
    production: 'Processing',
    productionUnit: 'Kg / Units',
    invoice: 'Invoice',
    invoices: 'Invoices',
    dispatch: 'Dispatch',
    ledger: 'Account',
    supplier: 'Supplier',
    customer: 'Distributor / Retailer',
    batch: 'Production Batch',
    qualityGrade: 'Grade',
    warehouseAction: 'Raw Material Received',
    reportTitle: 'Production Log',
  },
  sidebar: {
    dashboard: 'Dashboard',
    inventory: 'Ingredients / Stock',
    workers: 'Workers',
    production: 'Processing',
    invoices: 'Invoices',
    parties: 'Customers & Suppliers',
    ledger: 'Accounts',
    payroll: 'Wages',
    dispatch: 'Dispatch',
    reports: 'Reports',
    purchase: 'Raw Material Purchase',
  },
  features: {
    pieceRateWages: false,
    peshgiAdvances: true,
    batchTracking: true,
    expiryManagement: true,
    yieldTracking: true,
    variantTracking: false,
    vinTracking: false,
    coldChainLogging: true,
    qualityGrading: true,
    prescriptionMode: false,
    weightBasedUnits: true,
    laborLawCompliance: true,
    cctvSentinel: true,
  },
  defaultUnits: ['kg', 'liters', 'units', 'packs', 'tons'],
  defaultPayTypes: ['daily', 'monthly'],
}

// ─────────────────────────────────────
// GENERAL / WHOLESALE
// ─────────────────────────────────────
const general: IndustryConfig = {
  key: 'general',
  displayName: 'General / Wholesale',
  emoji: '🏪',
  description: 'General trading, wholesale, retail operations',
  defaultLandingRoute: '/pos',
  accentColor: '#60A5FA',
  accentColorDim: 'rgba(96,165,250,0.1)',
  terms: {
    worker: 'Employee',
    workers: 'Employees',
    advance: 'Advance',
    item: 'Item',
    items: 'Items',
    itemCode: 'Item Code',
    production: 'Operations',
    productionUnit: 'Units',
    invoice: 'Invoice',
    invoices: 'Invoices',
    dispatch: 'Dispatch',
    ledger: 'Ledger',
    supplier: 'Supplier',
    customer: 'Customer',
    batch: 'Batch',
    qualityGrade: 'Grade',
    warehouseAction: 'Received',
    reportTitle: 'Operations Report',
  },
  sidebar: {
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    workers: 'Employees',
    production: 'Operations',
    invoices: 'Invoices',
    parties: 'Parties',
    ledger: 'Ledger',
    payroll: 'Payroll',
    dispatch: 'Dispatch',
    reports: 'Reports',
    purchase: 'Purchase',
  },
  features: {
    pieceRateWages: false,
    peshgiAdvances: false,
    batchTracking: false,
    expiryManagement: false,
    yieldTracking: false,
    variantTracking: false,
    vinTracking: false,
    coldChainLogging: false,
    qualityGrading: false,
    prescriptionMode: false,
    weightBasedUnits: false,
    laborLawCompliance: true,
    cctvSentinel: true,
  },
  defaultUnits: ['pcs', 'kg', 'liters', 'meters', 'boxes'],
  defaultPayTypes: ['monthly', 'daily'],
}

export const INDUSTRY_CONFIGS: Record<IndustryKey, IndustryConfig> = {
  textile,
  rice,
  medical,
  auto,
  garment,
  food,
  general,
}

export function getIndustryConfig(
  industry: string | null | undefined
): IndustryConfig {
  return INDUSTRY_CONFIGS[
    (industry as IndustryKey) || 'general'
  ] || INDUSTRY_CONFIGS.general
}
