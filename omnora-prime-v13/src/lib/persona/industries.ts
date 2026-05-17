export type Region = 'south_asian' | 'international'

export type IndustryId =
  // South Asian
  | 'textile' | 'garment' | 'pharma' | 'rice_mill'
  | 'flour_mill' | 'sugar_mill' | 'cotton_gin'
  | 'leather' | 'surgical' | 'sports_goods'
  | 'auto_parts' | 'steel' | 'plastic' | 'printing'
  | 'furniture' | 'construction' | 'kiryana'
  | 'wholesale' | 'restaurant' | 'bakery'
  | 'dairy' | 'poultry' | 'agriculture'
  // International
  | 'apparel_intl' | 'electronics' | 'automotive'
  | 'food_processing' | 'chemical' | 'pharmaceutical'
  | 'logistics' | 'retail_chain' | 'e_commerce'
  | 'mining' | 'oil_gas' | 'printing_intl'
  | 'furniture_intl' | 'jewelry' | 'cosmetics'
  | 'medical_devices' | 'renewable' | 'cold_chain'
  | 'shipbuilding' | 'aerospace'

export type IndustryProfile = {
  id: IndustryId
  name: string          // Display name
  nameLocal?: string    // Local language name
  category: 'Textile' | 'Manufacturing' | 'Food' | 'Retail' | 'Agriculture' | 'Services' | 'Healthcare'
  region: Region
  icon: string          // lucide icon name
  
  // TERMINOLOGY — every key label in the system
  terms: {
    worker: string      // Karigar / Operator / Staff
    workers: string
    advance: string     // Peshgi / Advance / Loan
    inventory: string   // Maal / Stock / Inventory
    inventoryItem: string // SKU / Product / Medicine
    production: string  // Piece Entry / Batch / Output
    productionLog: string
    customer: string    // Party / Customer / Client
    supplier: string    // Supplier / Vendor
    order: string       // Order / PO / Work Order
    dispatch: string    // Dispatch / Shipment / Delivery
    batch: string       // Batch / Run / Lot
    quality: string     // Grade / Quality / Purity
    unit: string        // Meter / Kg / Unit / Strip
    payroll: string     // Payroll / Wages / Salary
    attendance: string  // Haazri / Attendance
    parties?: string     // Parties / Contacts / Accounts
    sales?: string
    purchase?: string
  }
  
  // MODULES — which sidebar items show
  modules: string[]
  
  // CALCULATORS — which calculators are relevant
  calculators: string[]
  
  // CONVERTERS — which converters to show
  converters: string[]
  
  // THEME — auto-suggested theme
  suggestedTheme: string
  
  // DOCUMENT GENERATORS — which to show
  generators: string[]
  
  // REPORTS — industry-specific reports
  specialReports: string[]
  
  // Empty state messages per page
  emptyStates: Partial<Record<string, {
    title: string
    body: string
    action: string
  }>>
}

export const INDUSTRIES: IndustryProfile[] = [

  // ═══════════════════════════════
  // TEXTILE (South Asian flagship)
  // ═══════════════════════════════
  {
    id: 'textile',
    name: 'Textile Manufacturing',
    nameLocal: 'کپڑا / Kapra',
    category: 'Textile',
    region: 'south_asian',
    icon: 'Layers',
    terms: {
      worker: 'Karigar',
      workers: 'Karigars',
      advance: 'Peshgi',
      inventory: 'Stock',
      inventoryItem: 'Fabric / Material',
      production: 'Piece Entry',
      productionLog: 'Production Log',
      customer: 'Party',
      supplier: 'Supplier',
      order: 'Order',
      dispatch: 'Dispatch',
      batch: 'Production Run',
      quality: 'Grade',
      unit: 'Thaan / Meter',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: [
      'dashboard', 'inventory', 'khata', 'karigars',
      'production', 'payroll', 'invoices', 'parties',
      'purchase', 'dispatch', 'audit', 'cctv',
      'cashflow', 'reports', 'lens', 'generators',
      'calculators', 'converters', 'file-morph', 'messaging',
      'pairing', 'settings'
    ],
    calculators: [
      'fabric_consumption', 'wastage_shrinkage',
      'oee_tracker', 'piece_rate', 'gsm_calculator',
      'container_load', 'export_costing',
      'delivery_planner', 'margin_markup'
    ],
    converters: [
      'currency', 'weight', 'fabric_length',
      'gsm', 'margin', 'piece_rate_calc',
      'container', 'emi'
    ],
    suggestedTheme: 'textile-gold',
    generators: [
      'invoice', 'challan', 'qr', 'payslip',
      'peshgi_receipt', 'stock_label', 'barcode',
      'purchase_order', 'export_docs'
    ],
    specialReports: [
      'production_efficiency', 'karigar_productivity',
      'fabric_consumption_report', 'grade_analysis'
    ],
    emptyStates: {
      '/inventory': {
        title: 'No fabric or materials added yet',
        body: 'Start by adding your main fabrics, threads, and accessories. Most textile units have 50-200 SKUs.',
        action: 'Add First Material'
      },
      '/karigars': {
        title: 'No Karigars registered',
        body: 'Register your workers with their wage type — piece rate, daily, or monthly. Attendance and payroll are automated after.',
        action: 'Register First Karigar'
      },
      '/production': {
        title: 'No production logged today',
        body: 'Log piece entries for each Karigar to track daily output and calculate wages.',
        action: 'Log Production'
      }
    }
  },

  // ═══════════════════════════════
  // GARMENT
  // ═══════════════════════════════
  {
    id: 'garment',
    name: 'Garment Manufacturing',
    nameLocal: 'گارمنٹس',
    category: 'Textile',
    region: 'south_asian',
    icon: 'Shirt',
    terms: {
      worker: 'Karigar',
      workers: 'Karigars',
      advance: 'Peshgi',
      inventory: 'Stock',
      inventoryItem: 'Garment / Trim',
      production: 'Stitching Log',
      productionLog: 'Production Entry',
      customer: 'Party / Retailer',
      supplier: 'Fabric Supplier',
      order: 'Order',
      dispatch: 'Dispatch',
      batch: 'PO / Lot',
      quality: 'Grade',
      unit: 'Piece / Dozen',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: [
      'dashboard', 'inventory', 'khata', 'karigars',
      'production', 'payroll', 'invoices', 'parties',
      'purchase', 'dispatch', 'audit', 'cashflow',
      'reports', 'lens', 'generators', 'calculators',
      'converters', 'file-morph', 'messaging', 'pairing', 'settings'
    ],
    calculators: ['fabric_consumption', 'piece_rate', 'margin_markup', 'oee_tracker'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'textile-gold',
    generators: ['invoice', 'challan', 'qr', 'payslip', 'stock_label'],
    specialReports: ['karigar_productivity', 'production_efficiency'],
    emptyStates: {
      '/inventory': {
        title: 'No garments or trims added',
        body: 'Add your finished goods and raw materials like thread, buttons, and zippers.',
        action: 'Add First Item'
      }
    }
  },

  // ═══════════════════════════════
  // PHARMA (South Asian)
  // ═══════════════════════════════
  {
    id: 'pharma',
    name: 'Medicine / Dawapharma',
    nameLocal: 'دوا فارما',
    category: 'Healthcare',
    region: 'south_asian',
    icon: 'Pill',
    terms: {
      worker: 'Staff',
      workers: 'Staff Members',
      advance: 'Advance',
      inventory: 'Medicine Inventory',
      inventoryItem: 'Medicine / Product',
      production: 'Batch Manufacturing',
      productionLog: 'Batch Log',
      customer: 'Chemist / Hospital',
      supplier: 'Pharma Distributor',
      order: 'Supply Order',
      dispatch: 'Delivery',
      batch: 'Batch',
      quality: 'Purity / Grade',
      unit: 'Strips / Vials / Units',
      payroll: 'Salary',
      attendance: 'Attendance',
    },
    modules: [
      'dashboard', 'inventory', 'khata',
      'production', 'payroll', 'invoices', 'parties',
      'purchase', 'dispatch', 'audit', 'cashflow',
      'reports', 'lens', 'generators', 'calculators',
      'converters', 'file-morph', 'messaging', 'pairing', 'settings'
    ],
    calculators: [
      'batch_yield', 'expiry_tracker',
      'margin_markup', 'container_load',
      'emi', 'delivery_planner'
    ],
    converters: [
      'currency', 'weight', 'margin',
      'volume_liquid', 'temperature', 'emi'
    ],
    suggestedTheme: 'pharma-clean',
    generators: [
      'invoice', 'challan', 'qr',
      'stock_label', 'barcode', 'purchase_order'
    ],
    specialReports: [
      'expiry_report', 'batch_traceability',
      'distributor_sales', 'drug_schedule_report'
    ],
    emptyStates: {
      '/inventory': {
        title: 'No medicines or products added',
        body: 'Add your medicine SKUs with batch numbers, expiry dates, and reorder levels for automatic alerts.',
        action: 'Add First Medicine'
      },
      '/production': {
        title: 'No batch manufacturing logged',
        body: 'Log each production batch with batch number, quantity, and expiry date for full traceability.',
        action: 'Log First Batch'
      }
    }
  },

  // ═══════════════════════════════
  // RICE MILL
  // ═══════════════════════════════
  {
    id: 'rice_mill',
    name: 'Rice Mill / Chawal',
    nameLocal: 'چاول مل',
    category: 'Food',
    region: 'south_asian',
    icon: 'Wheat',
    terms: {
      worker: 'Mazdoor',
      workers: 'Mazdoor',
      advance: 'Peshgi',
      inventory: 'Stock',
      inventoryItem: 'Rice Variety / Product',
      production: 'Milling Output',
      productionLog: 'Milling Log',
      customer: 'Dealer / Buyer',
      supplier: 'Farmer / Arthti',
      order: 'Order',
      dispatch: 'Bori Dispatch',
      batch: 'Milling Batch',
      quality: 'Grade / Quality',
      unit: 'Maund / Kg / Bori (50kg)',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: [
      'dashboard', 'inventory', 'khata', 'karigars',
      'production', 'payroll', 'invoices', 'parties',
      'purchase', 'dispatch', 'audit', 'mandi',
      'cashflow', 'reports', 'lens', 'generators',
      'calculators', 'converters', 'file-morph', 'messaging',
      'pairing', 'settings'
    ],
    calculators: [
      'milling_yield', 'wastage_shrinkage',
      'weight_conversion', 'margin_markup',
      'container_load', 'delivery_planner',
      'piece_rate', 'emi'
    ],
    converters: [
      'currency', 'weight', 'margin',
      'container', 'emi'
    ],
    suggestedTheme: 'saffron-bazaar',
    generators: [
      'invoice', 'challan', 'qr',
      'stock_label', 'purchase_order'
    ],
    specialReports: [
      'milling_efficiency', 'mandi_rate_analysis',
      'paddy_procurement', 'bori_inventory'
    ],
    emptyStates: {
      '/inventory': {
        title: 'No rice varieties added',
        body: 'Add your rice varieties — Basmati, Super Kernel, IRRI — with maund rates and current stock.',
        action: 'Add First Variety'
      }
    }
  },

  // ═══════════════════════════════
  // FLOUR MILL
  // ═══════════════════════════════
  {
    id: 'flour_mill',
    name: 'Flour Mill / Atta',
    nameLocal: 'آٹا مل',
    category: 'Food',
    region: 'south_asian',
    icon: 'Wind',
    terms: {
      worker: 'Mazdoor',
      workers: 'Mazdoor',
      advance: 'Peshgi',
      inventory: 'Stock',
      inventoryItem: 'Flour Type',
      production: 'Grinding Output',
      productionLog: 'Grinding Log',
      customer: 'Dealer',
      supplier: 'Wheat Supplier',
      order: 'Order',
      dispatch: 'Dispatch',
      batch: 'Grinding Run',
      quality: 'Purity',
      unit: 'Maund / Kg / Bag',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['wastage_shrinkage', 'margin_markup', 'emi'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'saffron-bazaar',
    generators: ['invoice', 'challan', 'qr'],
    specialReports: ['production_efficiency'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // SUGAR MILL
  // ═══════════════════════════════
  {
    id: 'sugar_mill',
    name: 'Sugar Mill',
    nameLocal: 'شوگر مل',
    category: 'Food',
    region: 'south_asian',
    icon: 'Candy',
    terms: {
      worker: 'Worker',
      workers: 'Workers',
      advance: 'Peshgi',
      inventory: 'Stock',
      inventoryItem: 'Sugar / Molasses',
      production: 'Crushing Output',
      productionLog: 'Crushing Log',
      customer: 'Dealer',
      supplier: 'Cane Farmer',
      order: 'Order',
      dispatch: 'Dispatch',
      batch: 'Crushing Season',
      quality: 'Grade',
      unit: 'Bag / Maund',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['wastage_shrinkage', 'margin_markup'],
    converters: ['currency', 'weight', 'margin'],
    suggestedTheme: 'saffron-bazaar',
    generators: ['invoice', 'challan'],
    specialReports: ['crushing_report'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // COTTON GIN
  // ═══════════════════════════════
  {
    id: 'cotton_gin',
    name: 'Cotton Ginning',
    nameLocal: 'کپاس جننگ',
    category: 'Textile',
    region: 'south_asian',
    icon: 'Cloud',
    terms: {
      worker: 'Mazdoor',
      workers: 'Mazdoor',
      advance: 'Peshgi',
      inventory: 'Stock',
      inventoryItem: 'Cotton Bale / Seed',
      production: 'Ginning Output',
      productionLog: 'Ginning Log',
      customer: 'Textile Mill',
      supplier: 'Farmer',
      order: 'Order',
      dispatch: 'Bale Dispatch',
      batch: 'Lot',
      quality: 'Mic / Grade',
      unit: 'Maund / Bale',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['wastage_shrinkage', 'margin_markup'],
    converters: ['currency', 'weight', 'margin'],
    suggestedTheme: 'saffron-bazaar',
    generators: ['invoice', 'challan'],
    specialReports: ['ginning_efficiency'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // LEATHER
  // ═══════════════════════════════
  {
    id: 'leather',
    name: 'Leather Tannery',
    nameLocal: 'چمڑا',
    category: 'Manufacturing',
    region: 'south_asian',
    icon: 'Umbrella',
    terms: {
      worker: 'Karigar',
      workers: 'Karigars',
      advance: 'Peshgi',
      inventory: 'Stock',
      inventoryItem: 'Hide / Leather',
      production: 'Tanning Log',
      productionLog: 'Production Entry',
      customer: 'Exporter / Brand',
      supplier: 'Raw Hide Supplier',
      order: 'Order',
      dispatch: 'Dispatch',
      batch: 'Batch',
      quality: 'Grade / Selection',
      unit: 'Sqft / Piece',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: ['dashboard', 'inventory', 'khata', 'karigars', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['wastage_shrinkage', 'margin_markup'],
    converters: ['currency', 'weight', 'length_area', 'margin'],
    suggestedTheme: 'steel-industrial',
    generators: ['invoice', 'challan'],
    specialReports: ['grade_analysis'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // SURGICAL
  // ═══════════════════════════════
  {
    id: 'surgical',
    name: 'Surgical Instruments',
    nameLocal: 'سرجیکل',
    category: 'Healthcare',
    region: 'south_asian',
    icon: 'Stethoscope',
    terms: {
      worker: 'Karigar',
      workers: 'Karigars',
      advance: 'Peshgi',
      inventory: 'Stock',
      inventoryItem: 'Instrument / Steel',
      production: 'Forging / Filing',
      productionLog: 'Production Log',
      customer: 'Exporter / Hospital',
      supplier: 'Steel Supplier',
      order: 'Order',
      dispatch: 'Dispatch',
      batch: 'Lot',
      quality: 'Finish / Grade',
      unit: 'Piece / Dozen',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: ['dashboard', 'inventory', 'khata', 'karigars', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['piece_rate', 'margin_markup'],
    converters: ['currency', 'weight', 'margin'],
    suggestedTheme: 'steel-industrial',
    generators: ['invoice', 'challan', 'qr'],
    specialReports: ['karigar_productivity'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // SPORTS GOODS
  // ═══════════════════════════════
  {
    id: 'sports_goods',
    name: 'Sports Goods',
    nameLocal: 'کھیلوں کا سامان',
    category: 'Manufacturing',
    region: 'south_asian',
    icon: 'Trophy',
    terms: {
      worker: 'Karigar',
      workers: 'Karigars',
      advance: 'Peshgi',
      inventory: 'Stock',
      inventoryItem: 'Product / Material',
      production: 'Stitching / Assembly',
      productionLog: 'Production Log',
      customer: 'Exporter / Retailer',
      supplier: 'Material Supplier',
      order: 'Order',
      dispatch: 'Dispatch',
      batch: 'Lot',
      quality: 'Grade',
      unit: 'Piece / Pair',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: ['dashboard', 'inventory', 'khata', 'karigars', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['piece_rate', 'margin_markup'],
    converters: ['currency', 'weight', 'margin'],
    suggestedTheme: 'textile-gold',
    generators: ['invoice', 'challan', 'qr'],
    specialReports: ['karigar_productivity'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // AUTO PARTS
  // ═══════════════════════════════
  {
    id: 'auto_parts',
    name: 'Auto Parts Manufacturing',
    nameLocal: 'آٹو پارٹس',
    category: 'Manufacturing',
    region: 'south_asian',
    icon: 'Cog',
    terms: {
      worker: 'Technician',
      workers: 'Technicians',
      advance: 'Advance',
      inventory: 'Parts Inventory',
      inventoryItem: 'Part / Component',
      production: 'Assembly Log',
      productionLog: 'Production Order',
      customer: 'Dealer / Workshop',
      supplier: 'Parts Supplier',
      order: 'Work Order',
      dispatch: 'Shipment',
      batch: 'Production Order',
      quality: 'Specification',
      unit: 'Pieces / Sets',
      payroll: 'Wages',
      attendance: 'Attendance',
    },
    modules: [
      'dashboard', 'inventory', 'khata',
      'production', 'payroll', 'invoices', 'parties',
      'purchase', 'dispatch', 'audit', 'cctv',
      'cashflow', 'reports', 'lens', 'generators',
      'calculators', 'converters', 'file-morph', 'messaging',
      'pairing', 'settings'
    ],
    calculators: [
      'oee_tracker', 'wastage_shrinkage',
      'margin_markup', 'container_load',
      'delivery_planner', 'piece_rate', 'emi'
    ],
    converters: [
      'currency', 'weight', 'margin',
      'container', 'emi'
    ],
    suggestedTheme: 'steel-industrial',
    generators: [
      'invoice', 'challan', 'qr',
      'stock_label', 'barcode', 'purchase_order'
    ],
    specialReports: [
      'production_efficiency', 'part_wise_output',
      'dealer_sales', 'quality_rejection'
    ],
    emptyStates: {
      '/inventory': {
        title: 'No parts or components added',
        body: 'Add your manufactured parts with part numbers, specifications, and reorder levels.',
        action: 'Add First Part'
      }
    }
  },

  // ═══════════════════════════════
  // STEEL
  // ═══════════════════════════════
  {
    id: 'steel',
    name: 'Steel Mill / Furnace',
    nameLocal: 'سٹیل مل',
    category: 'Manufacturing',
    region: 'south_asian',
    icon: 'Anvil',
    terms: {
      worker: 'Worker',
      workers: 'Workers',
      advance: 'Peshgi',
      inventory: 'Stock',
      inventoryItem: 'Billet / Girder / Scrap',
      production: 'Heat Log',
      productionLog: 'Melt Log',
      customer: 'Dealer / Builder',
      supplier: 'Scrap Supplier',
      order: 'Order',
      dispatch: 'Dispatch',
      batch: 'Heat No',
      quality: 'Grade',
      unit: 'Ton / Kg',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['wastage_shrinkage', 'margin_markup'],
    converters: ['currency', 'weight', 'margin'],
    suggestedTheme: 'steel-industrial',
    generators: ['invoice', 'challan'],
    specialReports: ['production_efficiency'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // PLASTIC
  // ═══════════════════════════════
  {
    id: 'plastic',
    name: 'Plastic / Molding',
    nameLocal: 'پلاسٹک',
    category: 'Manufacturing',
    region: 'south_asian',
    icon: 'FlaskRound',
    terms: {
      worker: 'Operator',
      workers: 'Operators',
      advance: 'Advance',
      inventory: 'Stock',
      inventoryItem: 'Product / Resin',
      production: 'Molding Log',
      productionLog: 'Production Entry',
      customer: 'Wholesaler',
      supplier: 'Resin Supplier',
      order: 'Order',
      dispatch: 'Dispatch',
      batch: 'Batch',
      quality: 'Finish',
      unit: 'Piece / Kg',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['wastage_shrinkage', 'margin_markup'],
    converters: ['currency', 'weight', 'margin'],
    suggestedTheme: 'electric-slate',
    generators: ['invoice', 'challan', 'qr'],
    specialReports: ['production_efficiency'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // PRINTING
  // ═══════════════════════════════
  {
    id: 'printing',
    name: 'Printing & Packaging',
    nameLocal: 'پرنٹنگ',
    category: 'Manufacturing',
    region: 'south_asian',
    icon: 'Printer',
    terms: {
      worker: 'Karigar',
      workers: 'Karigars',
      advance: 'Peshgi',
      inventory: 'Stock',
      inventoryItem: 'Paper / Ink / Product',
      production: 'Print Run',
      productionLog: 'Job Log',
      customer: 'Party',
      supplier: 'Paper Merchant',
      order: 'Job Order',
      dispatch: 'Dispatch',
      batch: 'Job No',
      quality: 'Print Quality',
      unit: 'Sheet / Ream / Piece',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['wastage_shrinkage', 'margin_markup'],
    converters: ['currency', 'weight', 'margin'],
    suggestedTheme: 'electric-slate',
    generators: ['invoice', 'challan', 'qr'],
    specialReports: ['karigar_productivity'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // FURNITURE
  // ═══════════════════════════════
  {
    id: 'furniture',
    name: 'Furniture Manufacturing',
    nameLocal: 'فرنیچر',
    category: 'Manufacturing',
    region: 'south_asian',
    icon: 'Armchair',
    terms: {
      worker: 'Karigar',
      workers: 'Karigars',
      advance: 'Peshgi',
      inventory: 'Stock',
      inventoryItem: 'Item / Wood / Hardware',
      production: 'Carpentry Log',
      productionLog: 'Job Entry',
      customer: 'Customer',
      supplier: 'Wood Vendor',
      order: 'Order',
      dispatch: 'Delivery',
      batch: 'Set',
      quality: 'Finish',
      unit: 'Piece / Set',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: ['dashboard', 'inventory', 'khata', 'karigars', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['piece_rate', 'margin_markup'],
    converters: ['currency', 'weight', 'length_area', 'margin'],
    suggestedTheme: 'textile-gold',
    generators: ['invoice', 'challan'],
    specialReports: ['karigar_productivity'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // CONSTRUCTION
  // ═══════════════════════════════
  {
    id: 'construction',
    name: 'Construction / Contractor',
    nameLocal: 'تعمیرات / ٹھیکہ',
    category: 'Services',
    region: 'south_asian',
    icon: 'HardHat',
    terms: {
      worker: 'Labour / Mistri',
      workers: 'Labour',
      advance: 'Peshgi',
      inventory: 'Material Stock',
      inventoryItem: 'Material / Item',
      production: 'Daily Work Log',
      productionLog: 'Site Log',
      customer: 'Client',
      supplier: 'Supplier / Vendor',
      order: 'Contract / Work Order',
      dispatch: 'Delivery to Site',
      batch: 'Phase / Stage',
      quality: 'Grade',
      unit: 'Bag / CFT / Sq ft / Running ft',
      payroll: 'Labour Wages',
      attendance: 'Daily Muster Roll',
    },
    modules: [
      'dashboard', 'inventory', 'khata', 'karigars',
      'payroll', 'invoices', 'parties', 'purchase',
      'dispatch', 'audit', 'cashflow', 'reports',
      'lens', 'generators', 'calculators', 'converters',
      'messaging', 'pairing', 'settings'
    ],
    calculators: [
      'material_estimation', 'margin_markup',
      'labour_cost', 'emi', 'delivery_planner'
    ],
    converters: [
      'currency', 'weight', 'length_area',
      'margin', 'emi'
    ],
    suggestedTheme: 'logistics-amber',
    generators: [
      'invoice', 'challan', 'qr', 'payslip',
      'purchase_order'
    ],
    specialReports: [
      'site_progress', 'material_consumption',
      'labour_daily_report', 'project_costing'
    ],
    emptyStates: {
      '/inventory': {
        title: 'No materials added',
        body: 'Add cement, steel, bricks, sand and other materials with quantities and supplier rates.',
        action: 'Add First Material'
      },
      '/karigars': {
        title: 'No labour registered',
        body: 'Register your masons, labourers, and contractors for daily muster and wage calculation.',
        action: 'Register Labour'
      }
    }
  },

  // ═══════════════════════════════
  // KIRYANA
  // ═══════════════════════════════
  {
    id: 'kiryana',
    name: 'Kiryana Store',
    nameLocal: 'کریانہ سٹور',
    category: 'Retail',
    region: 'south_asian',
    icon: 'ShoppingBasket',
    terms: {
      worker: 'Staff',
      workers: 'Staff',
      advance: 'Advance',
      inventory: 'Store Stock',
      inventoryItem: 'Item',
      production: 'Restock Log',
      productionLog: 'Inward Log',
      customer: 'Customer',
      supplier: 'Vendor / Wholesale',
      order: 'Order',
      dispatch: 'Delivery',
      batch: 'Batch / Lot',
      quality: 'Grade',
      unit: 'Piece / Kg / Pack',
      payroll: 'Salary',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'pos', 'payroll', 'invoices', 'parties', 'purchase', 'cashflow', 'reports', 'settings'],
    calculators: ['margin_markup', 'emi'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'electric-slate',
    generators: ['invoice', 'qr'],
    specialReports: ['fast_moving_items'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // WHOLESALE / KIRYANA
  // ═══════════════════════════════
  {
    id: 'wholesale',
    name: 'Wholesale / Distribution',
    nameLocal: 'تھوک / منڈی',
    category: 'Retail',
    region: 'south_asian',
    icon: 'Store',
    terms: {
      worker: 'Staff',
      workers: 'Staff',
      advance: 'Advance',
      inventory: 'Stock',
      inventoryItem: 'Product / Item',
      production: 'Receiving Log',
      productionLog: 'Inward Log',
      customer: 'Retailer / Dealer',
      supplier: 'Manufacturer / Importer',
      order: 'Order',
      dispatch: 'Delivery',
      batch: 'Lot / Shipment',
      quality: 'Grade',
      unit: 'Carton / Dozen / Piece',
      payroll: 'Staff Salary',
      attendance: 'Attendance',
    },
    modules: [
      'dashboard', 'inventory', 'khata', 'pos',
      'payroll', 'invoices', 'parties', 'purchase',
      'dispatch', 'audit', 'mandi', 'cashflow',
      'reports', 'lens', 'generators', 'calculators',
      'converters', 'messaging', 'pairing', 'settings'
    ],
    calculators: [
      'margin_markup', 'container_load',
      'emi', 'delivery_planner', 'bulk_discount'
    ],
    converters: [
      'currency', 'weight', 'margin',
      'container', 'emi'
    ],
    suggestedTheme: 'electric-slate',
    generators: [
      'invoice', 'challan', 'qr',
      'stock_label', 'barcode', 'purchase_order'
    ],
    specialReports: [
      'fast_moving_items', 'dealer_wise_sales',
      'purchase_analysis', 'margin_report'
    ],
    emptyStates: {
      '/inventory': {
        title: 'No products in stock registry',
        body: 'Add your wholesale products with carton rates, retail prices, and reorder levels.',
        action: 'Add First Product'
      }
    }
  },

  // ═══════════════════════════════
  // RESTAURANT / DHABA
  // ═══════════════════════════════
  {
    id: 'restaurant',
    name: 'Restaurant / Dhaba',
    nameLocal: 'ڈھابہ / ریستوران',
    category: 'Services',
    region: 'south_asian',
    icon: 'UtensilsCrossed',
    terms: {
      worker: 'Staff',
      workers: 'Staff',
      advance: 'Advance',
      inventory: 'Kitchen Inventory',
      inventoryItem: 'Ingredient / Item',
      production: 'Daily Output',
      productionLog: 'Kitchen Log',
      customer: 'Customer',
      supplier: 'Vendor / Sabzi Mandi',
      order: 'Order',
      dispatch: 'Delivery / Home Delivery',
      batch: 'Daily Prep',
      quality: 'Quality',
      unit: 'Kg / Liter / Portion',
      payroll: 'Staff Wages',
      attendance: 'Attendance',
    },
    modules: [
      'dashboard', 'inventory', 'pos', 'khata',
      'payroll', 'invoices', 'parties', 'purchase',
      'cashflow', 'reports', 'generators',
      'calculators', 'converters', 'messaging',
      'pairing', 'settings'
    ],
    calculators: [
      'food_cost', 'recipe_costing',
      'margin_markup', 'daily_revenue',
      'emi', 'wastage_food'
    ],
    converters: [
      'currency', 'weight', 'volume_liquid',
      'temperature', 'margin', 'emi'
    ],
    suggestedTheme: 'desert-sand',
    generators: [
      'invoice', 'qr', 'stock_label',
      'purchase_order'
    ],
    specialReports: [
      'daily_sales', 'menu_performance',
      'food_cost_report', 'staff_hours'
    ],
    emptyStates: {
      '/inventory': {
        title: 'No kitchen inventory added',
        body: 'Add your ingredients, beverages, and supplies with daily reorder levels to avoid running out.',
        action: 'Add First Item'
      }
    }
  },

  // ═══════════════════════════════
  // BAKERY
  // ═══════════════════════════════
  {
    id: 'bakery',
    name: 'Bakery',
    nameLocal: 'بیکری',
    category: 'Food',
    region: 'south_asian',
    icon: 'Cookie',
    terms: {
      worker: 'Staff',
      workers: 'Staff',
      advance: 'Advance',
      inventory: 'Stock',
      inventoryItem: 'Item / Ingredient',
      production: 'Baking Log',
      productionLog: 'Baking Entry',
      customer: 'Customer',
      supplier: 'Vendor',
      order: 'Order',
      dispatch: 'Delivery',
      batch: 'Batch',
      quality: 'Freshness',
      unit: 'Piece / Kg',
      payroll: 'Salary',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'pos', 'khata', 'payroll', 'invoices', 'parties', 'purchase', 'cashflow', 'reports', 'settings'],
    calculators: ['food_cost', 'margin_markup', 'emi'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'desert-sand',
    generators: ['invoice', 'qr'],
    specialReports: ['daily_sales'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // DAIRY
  // ═══════════════════════════════
  {
    id: 'dairy',
    name: 'Dairy Farm',
    nameLocal: 'ڈیری فارم',
    category: 'Food',
    region: 'south_asian',
    icon: 'Milk',
    terms: {
      worker: 'Worker',
      workers: 'Workers',
      advance: 'Peshgi',
      inventory: 'Feed / Stock',
      inventoryItem: 'Product / Feed',
      production: 'Milk Yield',
      productionLog: 'Yield Log',
      customer: 'Customer / Milkman',
      supplier: 'Feed Supplier',
      order: 'Order',
      dispatch: 'Delivery',
      batch: 'Daily Yield',
      quality: 'Fat Content / Purity',
      unit: 'Liter / Kg',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'reports', 'settings'],
    calculators: ['margin_markup', 'emi'],
    converters: ['currency', 'weight', 'volume_liquid', 'margin', 'emi'],
    suggestedTheme: 'pharma-clean',
    generators: ['invoice', 'challan'],
    specialReports: ['yield_analysis'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // POULTRY
  // ═══════════════════════════════
  {
    id: 'poultry',
    name: 'Poultry Farm',
    nameLocal: 'پولٹری فارم',
    category: 'Agriculture',
    region: 'south_asian',
    icon: 'Bird',
    terms: {
      worker: 'Worker',
      workers: 'Workers',
      advance: 'Peshgi',
      inventory: 'Feed / Stock',
      inventoryItem: 'Feed / Bird',
      production: 'Egg / Bird Count',
      productionLog: 'Farm Log',
      customer: 'Dealer',
      supplier: 'Feed Supplier',
      order: 'Order',
      dispatch: 'Dispatch',
      batch: 'Flock',
      quality: 'Grade / Weight',
      unit: 'Piece / Kg',
      payroll: 'Payroll',
      attendance: 'Haazri',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'reports', 'settings'],
    calculators: ['margin_markup', 'emi'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'saffron-bazaar',
    generators: ['invoice', 'challan'],
    specialReports: ['mortality_report'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // AGRICULTURE
  // ═══════════════════════════════
  {
    id: 'agriculture',
    name: 'Agriculture / Farming',
    nameLocal: 'زراعت',
    category: 'Agriculture',
    region: 'south_asian',
    icon: 'Sprout',
    terms: {
      worker: 'Mazdoor',
      workers: 'Mazdoor',
      advance: 'Peshgi',
      inventory: 'Seeds / Fertilizer',
      inventoryItem: 'Material / Crop',
      production: 'Harvest Log',
      productionLog: 'Yield Log',
      customer: 'Arhti / Buyer',
      supplier: 'Seed / Fertilizer Shop',
      order: 'Contract',
      dispatch: 'Dispatch to Mandi',
      batch: 'Season / Crop',
      quality: 'Grade',
      unit: 'Maund / Kg / Bag',
      payroll: 'Wages',
      attendance: 'Muster Roll',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'mandi', 'reports', 'settings'],
    calculators: ['material_estimation', 'margin_markup', 'emi'],
    converters: ['currency', 'weight', 'length_area', 'margin', 'emi'],
    suggestedTheme: 'saffron-bazaar',
    generators: ['invoice', 'challan'],
    specialReports: ['yield_analysis'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // APPAREL (International)
  // ═══════════════════════════════
  {
    id: 'apparel_intl',
    name: 'Apparel Manufacturing',
    category: 'Textile',
    region: 'international',
    icon: 'Shirt',
    terms: {
      worker: 'Operator',
      workers: 'Operators',
      advance: 'Advance',
      inventory: 'Stock',
      inventoryItem: 'SKU / Material',
      production: 'Production Entry',
      productionLog: 'Production Log',
      customer: 'Client',
      supplier: 'Vendor',
      order: 'Work Order',
      dispatch: 'Shipment',
      batch: 'Batch',
      quality: 'Grade',
      unit: 'Unit / Meter',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['fabric_consumption', 'oee_tracker', 'margin_markup', 'container_load'],
    converters: ['currency', 'weight', 'fabric_length', 'margin', 'container', 'emi'],
    suggestedTheme: 'textile-gold',
    generators: ['invoice', 'qr', 'stock_label', 'purchase_order', 'export_docs'],
    specialReports: ['production_efficiency'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // ELECTRONICS
  // ═══════════════════════════════
  {
    id: 'electronics',
    name: 'Electronics Manufacturing',
    category: 'Manufacturing',
    region: 'international',
    icon: 'Cpu',
    terms: {
      worker: 'Technician',
      workers: 'Technicians',
      advance: 'Advance',
      inventory: 'Component Inventory',
      inventoryItem: 'Part / SKU',
      production: 'Assembly Log',
      productionLog: 'Production Order',
      customer: 'Distributor',
      supplier: 'Part Supplier',
      order: 'Order',
      dispatch: 'Shipment',
      batch: 'Batch / Lot',
      quality: 'Spec / Tolerance',
      unit: 'Piece / Set',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['oee_tracker', 'margin_markup', 'container_load'],
    converters: ['currency', 'weight', 'margin', 'container', 'emi'],
    suggestedTheme: 'electric-slate',
    generators: ['invoice', 'qr', 'barcode', 'purchase_order'],
    specialReports: ['quality_rejection'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // AUTOMOTIVE
  // ═══════════════════════════════
  {
    id: 'automotive',
    name: 'Automotive / Vehicles',
    category: 'Manufacturing',
    region: 'international',
    icon: 'Car',
    terms: {
      worker: 'Technician',
      workers: 'Technicians',
      advance: 'Advance',
      inventory: 'Parts Stock',
      inventoryItem: 'Part / Component',
      production: 'Assembly Entry',
      productionLog: 'Production Record',
      customer: 'Dealer',
      supplier: 'OEM Supplier',
      order: 'Work Order',
      dispatch: 'Delivery',
      batch: 'Production Run',
      quality: 'Specification',
      unit: 'Unit / Piece',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['oee_tracker', 'margin_markup', 'container_load'],
    converters: ['currency', 'weight', 'margin', 'container', 'emi'],
    suggestedTheme: 'steel-industrial',
    generators: ['invoice', 'qr', 'barcode', 'purchase_order'],
    specialReports: ['production_efficiency'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // FOOD PROCESSING
  // ═══════════════════════════════
  {
    id: 'food_processing',
    name: 'Food Processing',
    category: 'Food',
    region: 'international',
    icon: 'Beef',
    terms: {
      worker: 'Operator',
      workers: 'Operators',
      advance: 'Advance',
      inventory: 'Ingredients & FG',
      inventoryItem: 'Item / Material',
      production: 'Batch Entry',
      productionLog: 'Batch Record',
      customer: 'Distributor',
      supplier: 'Raw Material Vendor',
      order: 'Order',
      dispatch: 'Distribution',
      batch: 'Batch',
      quality: 'HACCP / Grade',
      unit: 'Kg / Liter / Unit',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['batch_yield', 'wastage_shrinkage', 'margin_markup', 'container_load'],
    converters: ['currency', 'weight', 'volume_liquid', 'margin', 'container', 'emi'],
    suggestedTheme: 'pharma-clean',
    generators: ['invoice', 'qr', 'stock_label', 'barcode', 'purchase_order'],
    specialReports: ['batch_traceability', 'expiry_report'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // CHEMICAL
  // ═══════════════════════════════
  {
    id: 'chemical',
    name: 'Chemical Manufacturing',
    category: 'Manufacturing',
    region: 'international',
    icon: 'TestTube',
    terms: {
      worker: 'Operator',
      workers: 'Operators',
      advance: 'Advance',
      inventory: 'Material Stock',
      inventoryItem: 'Chemical / Raw Material',
      production: 'Batch Synthesis',
      productionLog: 'Batch Log',
      customer: 'Industrial Client',
      supplier: 'Feedstock Supplier',
      order: 'Order',
      dispatch: 'Shipment',
      batch: 'Batch',
      quality: 'Purity / Grade',
      unit: 'Kg / Liter / Ton',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['batch_yield', 'margin_markup', 'container_load'],
    converters: ['currency', 'weight', 'volume_liquid', 'margin', 'container', 'emi'],
    suggestedTheme: 'electric-slate',
    generators: ['invoice', 'qr', 'barcode', 'purchase_order', 'export_docs'],
    specialReports: ['batch_traceability'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // LOGISTICS (International)
  // ═══════════════════════════════
  {
    id: 'logistics',
    name: 'Logistics & Warehousing',
    category: 'Services',
    region: 'international',
    icon: 'Truck',
    terms: {
      worker: 'Operator',
      workers: 'Operators',
      advance: 'Advance',
      inventory: 'Warehouse Inventory',
      inventoryItem: 'SKU / Product',
      production: 'Fulfillment Log',
      productionLog: 'Fulfillment Log',
      customer: 'Client',
      supplier: 'Vendor',
      order: 'Shipment Order',
      dispatch: 'Dispatch',
      batch: 'Shipment Batch',
      quality: 'Condition',
      unit: 'Carton / Pallet / Unit',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: [
      'dashboard', 'inventory', 'khata',
      'payroll', 'invoices', 'parties', 'purchase',
      'dispatch', 'fleet', 'audit', 'cctv',
      'cashflow', 'reports', 'lens', 'generators',
      'calculators', 'converters', 'messaging',
      'pairing', 'settings'
    ],
    calculators: [
      'container_load', 'volumetric_weight',
      'margin_markup', 'emi', 'delivery_planner',
      'fuel_cost'
    ],
    converters: [
      'currency', 'weight', 'volume',
      'distance', 'margin', 'container', 'emi'
    ],
    suggestedTheme: 'logistics-amber',
    generators: [
      'invoice', 'challan', 'qr',
      'barcode', 'purchase_order', 'export_docs'
    ],
    specialReports: [
      'fleet_utilization', 'delivery_performance',
      'warehouse_occupancy', 'client_sla'
    ],
    emptyStates: {
      '/inventory': {
        title: 'No SKUs in warehouse',
        body: 'Add products you store and fulfill for your clients.',
        action: 'Add First SKU'
      }
    }
  },

  // ═══════════════════════════════
  // PHARMACEUTICAL (International)
  // ═══════════════════════════════
  {
    id: 'pharmaceutical',
    name: 'Pharmaceutical Manufacturing',
    category: 'Healthcare',
    region: 'international',
    icon: 'FlaskConical',
    terms: {
      worker: 'Operator',
      workers: 'Operators',
      advance: 'Advance',
      inventory: 'Raw Material & FG Inventory',
      inventoryItem: 'Product / API / Material',
      production: 'Batch Manufacturing',
      productionLog: 'Batch Record',
      customer: 'Distributor / Hospital',
      supplier: 'API Supplier',
      order: 'Production Order',
      dispatch: 'Distribution',
      batch: 'Batch',
      quality: 'Purity / Potency',
      unit: 'Strips / Vials / Kg / L',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: [
      'dashboard', 'inventory', 'khata',
      'production', 'payroll', 'invoices', 'parties',
      'purchase', 'dispatch', 'audit', 'cashflow',
      'reports', 'lens', 'generators', 'calculators',
      'converters', 'messaging', 'pairing', 'settings'
    ],
    calculators: [
      'batch_yield', 'dissolution_rate',
      'margin_markup', 'emi', 'delivery_planner'
    ],
    converters: [
      'currency', 'weight', 'volume_liquid',
      'temperature', 'margin', 'emi'
    ],
    suggestedTheme: 'pharma-clean',
    generators: [
      'invoice', 'qr', 'stock_label',
      'barcode', 'purchase_order', 'export_docs'
    ],
    specialReports: [
      'batch_traceability', 'expiry_management',
      'pharmacovigilance', 'regulatory_compliance'
    ],
    emptyStates: {
      '/inventory': {
        title: 'No materials or products added',
        body: 'Add raw materials, APIs, and finished goods with batch numbers and expiry dates.',
        action: 'Add First Product'
      }
    }
  },

  // ═══════════════════════════════
  // RETAIL CHAIN
  // ═══════════════════════════════
  {
    id: 'retail_chain',
    name: 'Retail Chain / Supermarket',
    category: 'Retail',
    region: 'international',
    icon: 'Store',
    terms: {
      worker: 'Staff',
      workers: 'Staff',
      advance: 'Advance',
      inventory: 'Stock',
      inventoryItem: 'Product / SKU',
      production: 'Inward Entry',
      productionLog: 'Inventory Log',
      customer: 'Customer',
      supplier: 'Vendor',
      order: 'Order',
      dispatch: 'Delivery',
      batch: 'Batch',
      quality: 'Grade',
      unit: 'Unit / Pack',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'pos', 'khata', 'payroll', 'invoices', 'parties', 'purchase', 'cashflow', 'reports', 'settings'],
    calculators: ['margin_markup', 'bulk_discount', 'emi'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'electric-slate',
    generators: ['invoice', 'qr', 'barcode'],
    specialReports: ['fast_moving_items', 'daily_sales'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // E-COMMERCE
  // ═══════════════════════════════
  {
    id: 'e_commerce',
    name: 'E-Commerce / Online Store',
    category: 'Retail',
    region: 'international',
    icon: 'Globe',
    terms: {
      worker: 'Staff',
      workers: 'Staff',
      advance: 'Advance',
      inventory: 'Stock',
      inventoryItem: 'Product / SKU',
      production: 'Order Processing',
      productionLog: 'Fulfillment Log',
      customer: 'Customer',
      supplier: 'Vendor',
      order: 'Online Order',
      dispatch: 'Shipment',
      batch: 'Fulfillment Batch',
      quality: 'Grade',
      unit: 'Unit',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'pos', 'khata', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['margin_markup', 'shipping_cost', 'emi'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'electric-slate',
    generators: ['invoice', 'qr', 'barcode'],
    specialReports: ['order_analysis', 'daily_sales'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // MINING
  // ═══════════════════════════════
  {
    id: 'mining',
    name: 'Mining & Extraction',
    category: 'Manufacturing',
    region: 'international',
    icon: 'Pickaxe',
    terms: {
      worker: 'Operator',
      workers: 'Operators',
      advance: 'Advance',
      inventory: 'Ore Stock',
      inventoryItem: 'Material / Mineral',
      production: 'Extraction Log',
      productionLog: 'Mine Log',
      customer: 'Industrial Buyer',
      supplier: 'Equipment Vendor',
      order: 'Contract',
      dispatch: 'Dispatch',
      batch: 'Haul',
      quality: 'Purity / Grade',
      unit: 'Ton',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'reports', 'settings'],
    calculators: ['margin_markup', 'oee_tracker', 'emi'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'steel-industrial',
    generators: ['invoice', 'challan'],
    specialReports: ['extraction_efficiency'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // OIL & GAS
  // ═══════════════════════════════
  {
    id: 'oil_gas',
    name: 'Oil & Gas',
    category: 'Manufacturing',
    region: 'international',
    icon: 'Droplet',
    terms: {
      worker: 'Operator',
      workers: 'Operators',
      advance: 'Advance',
      inventory: 'Stock',
      inventoryItem: 'Product / Crude',
      production: 'Refining Output',
      productionLog: 'Plant Log',
      customer: 'Industrial Buyer',
      supplier: 'Service Provider',
      order: 'Order',
      dispatch: 'Shipment',
      batch: 'Batch',
      quality: 'API Gravity / Grade',
      unit: 'Barrel / Liter / Ton',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['margin_markup', 'oee_tracker', 'emi'],
    converters: ['currency', 'weight', 'volume_liquid', 'margin', 'emi'],
    suggestedTheme: 'steel-industrial',
    generators: ['invoice', 'challan'],
    specialReports: ['production_efficiency'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // PRINTING (International)
  // ═══════════════════════════════
  {
    id: 'printing_intl',
    name: 'Printing & Publishing',
    category: 'Manufacturing',
    region: 'international',
    icon: 'Printer',
    terms: {
      worker: 'Operator',
      workers: 'Operators',
      advance: 'Advance',
      inventory: 'Stock',
      inventoryItem: 'Paper / Ink / Product',
      production: 'Print Run',
      productionLog: 'Job Log',
      customer: 'Client',
      supplier: 'Paper Merchant',
      order: 'Job Order',
      dispatch: 'Shipment',
      batch: 'Job No',
      quality: 'Print Quality',
      unit: 'Unit / Sheet',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['wastage_shrinkage', 'margin_markup', 'emi'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'electric-slate',
    generators: ['invoice', 'qr', 'barcode'],
    specialReports: ['production_efficiency'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // FURNITURE (International)
  // ═══════════════════════════════
  {
    id: 'furniture_intl',
    name: 'Furniture Manufacturing',
    category: 'Manufacturing',
    region: 'international',
    icon: 'Armchair',
    terms: {
      worker: 'Craftsman',
      workers: 'Craftsmen',
      advance: 'Advance',
      inventory: 'Stock',
      inventoryItem: 'Product / Material',
      production: 'Manufacturing Log',
      productionLog: 'Job Entry',
      customer: 'Client',
      supplier: 'Material Vendor',
      order: 'Order',
      dispatch: 'Shipment',
      batch: 'Batch',
      quality: 'Finish',
      unit: 'Unit / Piece',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['margin_markup', 'oee_tracker', 'emi'],
    converters: ['currency', 'weight', 'length_area', 'margin', 'emi'],
    suggestedTheme: 'textile-gold',
    generators: ['invoice', 'qr', 'purchase_order'],
    specialReports: ['production_efficiency'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // JEWELRY
  // ═══════════════════════════════
  {
    id: 'jewelry',
    name: 'Jewelry / Luxury Goods',
    category: 'Retail',
    region: 'international',
    icon: 'Gem',
    terms: {
      worker: 'Artisan',
      workers: 'Artisans',
      advance: 'Advance',
      inventory: 'Stock',
      inventoryItem: 'Item / Metal / Stone',
      production: 'Crafting Log',
      productionLog: 'Job Order',
      customer: 'Customer',
      supplier: 'Bullion Dealer',
      order: 'Design Order',
      dispatch: 'Delivery',
      batch: 'Job No',
      quality: 'Karat / Purity',
      unit: 'Gram / Carat / Piece',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'reports', 'settings'],
    calculators: ['margin_markup', 'emi'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'textile-gold',
    generators: ['invoice', 'qr', 'stock_label'],
    specialReports: ['material_loss_report'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // COSMETICS
  // ═══════════════════════════════
  {
    id: 'cosmetics',
    name: 'Cosmetics / Beauty',
    category: 'Retail',
    region: 'international',
    icon: 'Sparkles',
    terms: {
      worker: 'Operator',
      workers: 'Operators',
      advance: 'Advance',
      inventory: 'Stock',
      inventoryItem: 'Product / Ingredient',
      production: 'Batch Entry',
      productionLog: 'Batch Record',
      customer: 'Distributor',
      supplier: 'Raw Material Vendor',
      order: 'Order',
      dispatch: 'Shipment',
      batch: 'Batch',
      quality: 'Purity / Specification',
      unit: 'Unit / Kg / Liter',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['batch_yield', 'margin_markup', 'emi'],
    converters: ['currency', 'weight', 'volume_liquid', 'margin', 'emi'],
    suggestedTheme: 'pharma-clean',
    generators: ['invoice', 'qr', 'barcode'],
    specialReports: ['expiry_report'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // MEDICAL DEVICES
  // ═══════════════════════════════
  {
    id: 'medical_devices',
    name: 'Medical Devices',
    category: 'Healthcare',
    region: 'international',
    icon: 'Activity',
    terms: {
      worker: 'Technician',
      workers: 'Technicians',
      advance: 'Advance',
      inventory: 'Component Stock',
      inventoryItem: 'Device / Part',
      production: 'Assembly Log',
      productionLog: 'Device Record',
      customer: 'Hospital / Dealer',
      supplier: 'Component Vendor',
      order: 'Order',
      dispatch: 'Shipment',
      batch: 'Batch',
      quality: 'Compliance / Spec',
      unit: 'Unit',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['oee_tracker', 'margin_markup', 'emi'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'pharma-clean',
    generators: ['invoice', 'qr', 'barcode'],
    specialReports: ['quality_compliance'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // RENEWABLE ENERGY
  // ═══════════════════════════════
  {
    id: 'renewable',
    name: 'Renewable Energy',
    category: 'Services',
    region: 'international',
    icon: 'Sun',
    terms: {
      worker: 'Technician',
      workers: 'Technicians',
      advance: 'Advance',
      inventory: 'Component Stock',
      inventoryItem: 'Panel / Part',
      production: 'Installation Log',
      productionLog: 'Project Log',
      customer: 'Client',
      supplier: 'Manufacturer',
      order: 'Project Order',
      dispatch: 'Site Delivery',
      batch: 'Phase',
      quality: 'Efficiency',
      unit: 'Unit / kW',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'payroll', 'invoices', 'parties', 'purchase', 'reports', 'settings'],
    calculators: ['margin_markup', 'emi'],
    converters: ['currency', 'margin', 'emi'],
    suggestedTheme: 'electric-slate',
    generators: ['invoice', 'qr', 'purchase_order'],
    specialReports: ['project_costing'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // COLD CHAIN
  // ═══════════════════════════════
  {
    id: 'cold_chain',
    name: 'Cold Chain Logistics',
    category: 'Services',
    region: 'international',
    icon: 'ThermometerSnowflake',
    terms: {
      worker: 'Operator',
      workers: 'Operators',
      advance: 'Advance',
      inventory: 'Stored Goods',
      inventoryItem: 'SKU / Product',
      production: 'Storage Log',
      productionLog: 'Temp Log',
      customer: 'Client',
      supplier: 'Utility Provider',
      order: 'Order',
      dispatch: 'Dispatch',
      batch: 'Lot',
      quality: 'Temp Stability',
      unit: 'Carton / Pallet',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'payroll', 'invoices', 'parties', 'purchase', 'dispatch', 'reports', 'settings'],
    calculators: ['margin_markup', 'emi'],
    converters: ['currency', 'weight', 'temperature', 'margin', 'emi'],
    suggestedTheme: 'pharma-clean',
    generators: ['invoice', 'qr'],
    specialReports: ['temp_history'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // SHIPBUILDING
  // ═══════════════════════════════
  {
    id: 'shipbuilding',
    name: 'Shipbuilding / Marine',
    category: 'Manufacturing',
    region: 'international',
    icon: 'Anchor',
    terms: {
      worker: 'Operator',
      workers: 'Operators',
      advance: 'Advance',
      inventory: 'Material Stock',
      inventoryItem: 'Component / Metal',
      production: 'Assembly Log',
      productionLog: 'Hull Record',
      customer: 'Owner / Client',
      supplier: 'Steel / Part Vendor',
      order: 'Vessel Order',
      dispatch: 'Launch',
      batch: 'Project Phase',
      quality: 'Class / Spec',
      unit: 'Unit / Ton',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'reports', 'settings'],
    calculators: ['margin_markup', 'emi'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'steel-industrial',
    generators: ['invoice', 'purchase_order'],
    specialReports: ['project_progress'],
    emptyStates: {}
  },

  // ═══════════════════════════════
  // AEROSPACE
  // ═══════════════════════════════
  {
    id: 'aerospace',
    name: 'Aerospace / Aviation',
    category: 'Manufacturing',
    region: 'international',
    icon: 'Plane',
    terms: {
      worker: 'Engineer / Tech',
      workers: 'Engineers',
      advance: 'Advance',
      inventory: 'Parts Stock',
      inventoryItem: 'Component',
      production: 'Assembly Entry',
      productionLog: 'Manufacturing Record',
      customer: 'Operator / Defense',
      supplier: 'Material Vendor',
      order: 'Contract',
      dispatch: 'Delivery',
      batch: 'Serial No',
      quality: 'AS9100 / Spec',
      unit: 'Unit',
      payroll: 'Payroll',
      attendance: 'Attendance',
    },
    modules: ['dashboard', 'inventory', 'khata', 'production', 'payroll', 'invoices', 'parties', 'purchase', 'reports', 'settings'],
    calculators: ['oee_tracker', 'margin_markup', 'emi'],
    converters: ['currency', 'weight', 'margin', 'emi'],
    suggestedTheme: 'steel-industrial',
    generators: ['invoice', 'qr', 'purchase_order'],
    specialReports: ['quality_traceability'],
    emptyStates: {}
  }

]
