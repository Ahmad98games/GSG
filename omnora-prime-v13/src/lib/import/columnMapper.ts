import Fuse from 'fuse.js'

// Our canonical field names for each entity
export const FIELD_ALIASES: Record<string,
  Record<string, string[]>> = {
  
  skus: {
    // Our field: [possible user column names]
    sku_code: [
      'sku', 'sku_code', 'item_code', 'product_code',
      'code', 'barcode', 'item id', 'product id',
      'article', 'article no', 'article number',
      'part number', 'part no', 'ref', 'reference',
      'item no', 'style no', 'style number',
    ],
    name: [
      'name', 'product_name', 'item_name',
      'description', 'product description',
      'item description', 'title', 'product',
      'item', 'material', 'fabric name',
      'maal name', 'product title',
    ],
    category: [
      'category', 'type', 'product type',
      'item type', 'group', 'department',
      'section', 'classification', 'qism',
    ],
    unit: [
      'unit', 'uom', 'unit of measure',
      'unit of measurement', 'measuring unit',
      'qty unit', 'quantity unit', 'piece type',
    ],
    qty_on_hand: [
      'qty', 'quantity', 'stock', 'on hand',
      'available', 'current stock', 'balance',
      'opening stock', 'opening balance',
      'inventory', 'units', 'pieces',
    ],
    cost_price: [
      'cost', 'cost price', 'purchase price',
      'buy price', 'cost_price', 'unit cost',
      'buying price', 'landed cost', 'pp',
    ],
    sale_price: [
      'price', 'sale price', 'selling price',
      'sell price', 'mrp', 'retail price',
      'unit price', 'rate', 'sp',
    ],
    reorder_level: [
      'reorder', 'reorder level', 'minimum stock',
      'min stock', 'reorder point', 'min qty',
      'minimum quantity', 'safety stock',
    ],
  },
  
  parties: {
    name: [
      'name', 'party name', 'customer name',
      'supplier name', 'vendor name', 'company',
      'company name', 'business name', 'client',
      'account name', 'firm name',
    ],
    party_type: [
      'type', 'party type', 'account type',
      'customer or supplier', 'relation',
    ],
    phone: [
      'phone', 'mobile', 'contact', 'tel',
      'telephone', 'mobile number', 'phone number',
      'cell', 'contact number', 'whatsapp',
    ],
    email: [
      'email', 'email address', 'e-mail',
      'mail', 'email id',
    ],
    address: [
      'address', 'location', 'city', 'area',
      'billing address', 'shipping address',
    ],
    current_balance: [
      'balance', 'outstanding', 'amount due',
      'opening balance', 'credit', 'debit',
      'amount', 'dues',
    ],
  },
  
  karigars: {
    name: [
      'name', 'karigar name', 'worker name',
      'employee name', 'staff name', 'operator',
    ],
    karigar_code: [
      'code', 'id', 'employee id', 'worker id',
      'karigar code', 'emp code', 'staff id',
    ],
    phone: [
      'phone', 'mobile', 'contact', 'number',
    ],
    wage_type: [
      'wage type', 'salary type', 'pay type',
      'type', 'payment type',
    ],
    piece_rate: [
      'piece rate', 'rate per piece', 'rate',
      'per piece', 'pcs rate',
    ],
    daily_rate: [
      'daily rate', 'daily wage', 'per day',
      'day rate', 'daily',
    ],
    monthly_salary: [
      'salary', 'monthly salary', 'monthly',
      'fixed salary', 'basic salary', 'tankhwa',
    ],
  },
}

// Fuzzy match a user's column to our field names
export function matchColumn(
  userColumn: string,
  entityType: keyof typeof FIELD_ALIASES
): { field: string | null, confidence: number } {
  const aliases = FIELD_ALIASES[entityType]
  if (!aliases) return { field: null, confidence: 0 }
  
  const userColLower = userColumn.toLowerCase()
    .trim()
    .replace(/[_\-]/g, ' ')
  
  let bestMatch = { field: null as string | null,
    confidence: 0 }
  
  for (const [field, aliasList] of
    Object.entries(aliases)) {
    
    // Try exact match first (100% confidence)
    if (aliasList.some(
      a => a.toLowerCase() === userColLower
    )) {
      return { field, confidence: 1.0 }
    }
    
    // Fuzzy match using Fuse.js
    const fuse = new Fuse(aliasList, {
      threshold: 0.4,
      includeScore: true,
    })
    
    const results = fuse.search(userColLower)
    if (results.length > 0) {
      const score = 1 - (results[0].score || 0)
      if (score > bestMatch.confidence) {
        bestMatch = { field, confidence: score }
      }
    }
  }
  
  return bestMatch
}

// Auto-map all columns from a file
export function autoMapColumns(
  userColumns: string[],
  entityType: keyof typeof FIELD_ALIASES
): Record<string, string | null> {
  const mapping: Record<string, string | null> = {}
  
  for (const col of userColumns) {
    const { field, confidence } = matchColumn(
      col, entityType
    )
    // Only auto-map if confidence > 60%
    mapping[col] = confidence > 0.6 ? field : null
  }
  
  return mapping
}

// Transform raw row data using the mapping
export function transformRow(
  row: Record<string, unknown>,
  mapping: Record<string, string | null>,
  entityType: string
): Record<string, unknown> {
  const transformed: Record<string, unknown> = {}
  
  for (const [userCol, ourField] of
    Object.entries(mapping)) {
    if (!ourField) continue
    
    const value = row[userCol]
    if (value === undefined || value === null
      || value === '') continue
    
    // Type coercion by field type
    const numberFields = [
      'qty_on_hand', 'cost_price', 'sale_price',
      'reorder_level', 'current_balance',
      'piece_rate', 'daily_rate', 'monthly_salary'
    ]
    
    if (numberFields.includes(ourField)) {
      const num = parseFloat(
        String(value).replace(/[^0-9.-]/g, '')
      )
      transformed[ourField] = isNaN(num) ? 0 : num
    } else {
      transformed[ourField] = String(value).trim()
    }
  }
  
  return transformed
}
