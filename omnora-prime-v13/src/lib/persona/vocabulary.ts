const vocabularyMap = {
  textile: {
    sku: 'Fabric/Material',
    stock: 'Stock',
    worker: 'Karigar',
    advance: 'Peshgi',
    quantity_unit: 'Thaan',
    production_log: 'Production Entry',
    batch: 'Production Run',
    customer: 'Party',
    purchase: 'Raw Material Purchase',
    invoices: 'Bills/Invoices',
    khata: 'Ledger/Khata',
  },
  pharma: {
    sku: 'Medicine/Product',
    stock: 'Inventory',
    worker: 'Staff',
    advance: 'Advance',
    quantity_unit: 'Units/Strips',
    production_log: 'Batch Manufacturing',
    batch: 'Batch',
    customer: 'Chemist/Hospital',
    purchase: 'Material Procurement',
    invoices: 'Invoices',
    khata: 'Account Ledger',
  },
  restaurant: {
    sku: 'Menu Item',
    stock: 'Ingredients',
    worker: 'Staff',
    advance: 'Advance',
    quantity_unit: 'Portion',
    production_log: 'Kitchen Output',
    batch: 'Daily Production',
    customer: 'Customer',
    purchase: 'Grocery Purchase',
    invoices: 'KOT/Bills',
    khata: 'Expenses Ledger',
  },
  wholesale: {
    sku: 'Product',
    stock: 'Stock',
    worker: 'Staff',
    advance: 'Advance',
    quantity_unit: 'Units/Cartons',
    production_log: 'Dispatch Log',
    batch: 'Shipment',
    customer: 'Retailer/Dealer',
    purchase: 'Purchase',
    invoices: 'Sales Invoices',
    khata: 'Party Ledger',
  },
  auto_parts: {
    sku: 'Part',
    stock: 'Parts Inventory',
    worker: 'Technician',
    advance: 'Advance',
    quantity_unit: 'Pieces',
    production_log: 'Assembly Log',
    batch: 'Production Order',
    customer: 'Workshop/Dealer',
    purchase: 'Parts Purchase',
    invoices: 'Tax Invoices',
    khata: 'Financial Ledger',
  }
};

export type VocabularyKey = keyof typeof vocabularyMap.textile;

export function vocab(
  key: VocabularyKey,
  industry: string = 'wholesale'
): string {
  const map = vocabularyMap[industry as keyof typeof vocabularyMap] || vocabularyMap.wholesale;
  return map[key] || key;
}
