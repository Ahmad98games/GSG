export type IndustryType = 
  | 'kapra' 
  | 'chamra' 
  | 'medical' 
  | 'auto_parts' 
  | 'chawal' 
  | 'kiryana' 
  | 'marble';

export interface IndustryBlueprint {
  id: IndustryType;
  displayName: string;
  terminology: {
    primaryUnit: string;
    secondaryUnit?: string;
    personaName: string; // Karigar, Doctor, etc.
    stockLabel: string;
    customerLabel: string;
  };
  activeModules: string[]; // List of module IDs to show in sidebar
  dashboardWidgets: string[];
  currency: string;
}

export const CENTRAL_INDUSTRY_REGISTRY: Record<IndustryType, IndustryBlueprint> = {
  kapra: {
    id: 'kapra',
    displayName: 'Kapra (Textile)',
    terminology: {
      primaryUnit: 'Meter',
      secondaryUnit: 'Thaan',
      personaName: 'Karigar',
      stockLabel: 'Fabric Stock',
      customerLabel: 'Wholesaler',
    },
    activeModules: ['inventory', 'payroll', 'production', 'dyeing', 'weaving'],
    dashboardWidgets: ['batch_status', 'karigar_efficiency', 'revenue'],
    currency: 'PKR',
  },
  chamra: {
    id: 'chamra',
    displayName: 'Chamra (Leather)',
    terminology: {
      primaryUnit: 'SQFT',
      secondaryUnit: 'Skin',
      personaName: 'Artisan',
      stockLabel: 'Hide Inventory',
      customerLabel: 'Buyer',
    },
    activeModules: ['inventory', 'production', 'tanning', 'quality_control'],
    dashboardWidgets: ['batch_status', 'grade_distribution'],
    currency: 'PKR',
  },
  medical: {
    id: 'medical',
    displayName: 'Medical (Pharma)',
    terminology: {
      primaryUnit: 'Unit',
      secondaryUnit: 'Pack',
      personaName: 'Doctor / Chemist',
      stockLabel: 'Medicine Stock',
      customerLabel: 'Patient / Retailer',
    },
    activeModules: ['inventory', 'expiry_tracker', 'invoices', 'compliance'],
    dashboardWidgets: ['expiry_alerts', 'batch_tracking', 'sales_flow'],
    currency: 'PKR',
  },
  auto_parts: {
    id: 'auto_parts',
    displayName: 'Auto Parts',
    terminology: {
      primaryUnit: 'Piece',
      secondaryUnit: 'Box',
      personaName: 'Technician',
      stockLabel: 'Spare Parts',
      customerLabel: 'Garage / Owner',
    },
    activeModules: ['inventory', 'compatibility_map', 'orders', 'workshop'],
    dashboardWidgets: ['low_stock_alerts', 'order_pipeline'],
    currency: 'PKR',
  },
  chawal: {
    id: 'chawal',
    displayName: 'Chawal (Rice)',
    terminology: {
      primaryUnit: 'Sack',
      secondaryUnit: 'KG',
      personaName: 'Farmer / Mill Operator',
      stockLabel: 'Grain Silo',
      customerLabel: 'Distributor',
    },
    activeModules: ['inventory', 'milling', 'moisture_lab', 'procurement'],
    dashboardWidgets: ['moisture_levels', 'milling_yield', 'stock_valuation'],
    currency: 'PKR',
  },
  kiryana: {
    id: 'kiryana',
    displayName: 'Kiryana (Wholesale)',
    terminology: {
      primaryUnit: 'Carton',
      secondaryUnit: 'Piece',
      personaName: 'Store Keeper',
      stockLabel: 'Bulk Stock',
      customerLabel: 'Retailer',
    },
    activeModules: ['inventory', 'invoices', 'bulk_orders', 'ledger'],
    dashboardWidgets: ['fast_moving_items', 'credit_aging', 'revenue'],
    currency: 'PKR',
  },
  marble: {
    id: 'marble',
    displayName: 'Marble (Stone)',
    terminology: {
      primaryUnit: 'SQFT',
      secondaryUnit: 'Slab',
      personaName: 'Stone Cutter',
      stockLabel: 'Block Inventory',
      customerLabel: 'Contractor',
    },
    activeModules: ['inventory', 'cutting', 'polishing', 'wastage_track'],
    dashboardWidgets: ['yield_analysis', 'block_utilization'],
    currency: 'PKR',
  },
};
