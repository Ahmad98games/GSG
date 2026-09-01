import { createClient }
  from '@/lib/supabase/client'
import { parseScannedPayload, ParsedScanResult }
  from '@/lib/barcode/barcodeEngine'

export type DiscountType =
  'percent' | 'fixed'

export type PaymentMethod =
  'cash' | 'bank' | 'jazzcash' |
  'easypaisa' | 'credit' | 'split'

export interface CartItem {
  id: string
  skuId: string
  name: string
  unit: string
  quantity: number
  unitPrice: number
  originalPrice: number
  discountType: DiscountType
  discountValue: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  lineTotal: number
  stockAvailable: number
  barcode?: string
  priceTier?: string
}

export interface PaymentAllocation {
  method: PaymentMethod
  amount: number
  reference?: string
}

export interface POSCart {
  items: CartItem[]
  partyId: string | null
  partyName: string | null
  partyPhone: string | null
  partyBalance: number
  discountType: DiscountType
  discountValue: number
  discountAmount: number
  subtotal: number
  taxAmount: number
  grandTotal: number
  payments: PaymentAllocation[]
  totalPaid: number
  balanceDue: number
  change: number
  notes: string
  clientTransactionId?: string
}

export function createEmptyCart(): POSCart {
  return {
    items: [],
    partyId: null,
    partyName: null,
    partyPhone: null,
    partyBalance: 0,
    discountType: 'percent',
    discountValue: 0,
    discountAmount: 0,
    subtotal: 0,
    taxAmount: 0,
    grandTotal: 0,
    payments: [],
    totalPaid: 0,
    balanceDue: 0,
    change: 0,
    notes: '',
    clientTransactionId: undefined,
  }
}

export function addItemToCart(
  cart: POSCart,
  sku: {
    id: string
    name: string
    sale_price: number
    unit: string
    tax_rate: number
    qty_on_hand: number
    barcode?: string
  },
  quantity: number = 1,
  priceTier?: string
): POSCart {
  const existing = cart.items.findIndex(
    i => i.skuId === sku.id
  )

  if (existing >= 0) {
    // Increase quantity
    const updated = [...cart.items]
    updated[existing] = recalcLine({
      ...updated[existing],
      quantity:
        updated[existing].quantity + quantity,
    })
    return recalcCart({
      ...cart, items: updated
    })
  }

  const newItem: CartItem = recalcLine({
    id: crypto.randomUUID(),
    skuId: sku.id,
    name: sku.name,
    unit: sku.unit,
    quantity,
    unitPrice: sku.sale_price,
    originalPrice: sku.sale_price,
    discountType: 'percent',
    discountValue: 0,
    discountAmount: 0,
    taxRate: sku.tax_rate || 0,
    taxAmount: 0,
    lineTotal: 0,
    stockAvailable: sku.qty_on_hand,
    barcode: sku.barcode,
    priceTier,
  })

  return recalcCart({
    ...cart,
    items: [...cart.items, newItem],
  })
}

export function removeItemFromCart(
  cart: POSCart,
  itemId: string
): POSCart {
  return recalcCart({
    ...cart,
    items: cart.items.filter(
      i => i.id !== itemId
    ),
  })
}

export function updateItemQuantity(
  cart: POSCart,
  itemId: string,
  quantity: number
): POSCart {
  if (quantity <= 0) {
    return removeItemFromCart(cart, itemId)
  }
  const items = cart.items.map(i =>
    i.id === itemId
      ? recalcLine({ ...i, quantity })
      : i
  )
  return recalcCart({ ...cart, items })
}

export function updateItemPrice(
  cart: POSCart,
  itemId: string,
  unitPrice: number
): POSCart {
  const items = cart.items.map(i =>
    i.id === itemId
      ? recalcLine({ ...i, unitPrice })
      : i
  )
  return recalcCart({ ...cart, items })
}

export function updateItemDiscount(
  cart: POSCart,
  itemId: string,
  discountType: DiscountType,
  discountValue: number
): POSCart {
  const items = cart.items.map(i =>
    i.id === itemId
      ? recalcLine({
          ...i, discountType, discountValue
        })
      : i
  )
  return recalcCart({ ...cart, items })
}

export function applyOrderDiscount(
  cart: POSCart,
  discountType: DiscountType,
  discountValue: number
): POSCart {
  return recalcCart({
    ...cart, discountType, discountValue
  })
}

export function addPayment(
  cart: POSCart,
  method: PaymentMethod,
  amount: number,
  reference?: string
): POSCart {
  const payments = [
    ...cart.payments,
    { method, amount, reference },
  ]
  return recalcPayments({ ...cart, payments })
}

export function removePayment(
  cart: POSCart,
  index: number
): POSCart {
  const payments = cart.payments.filter(
    (_, i) => i !== index
  )
  return recalcPayments({ ...cart, payments })
}

export function setParty(
  cart: POSCart,
  party: {
    id: string
    name: string
    phone?: string
    current_balance: number
  } | null
): POSCart {
  if (!party) {
    return recalcCart({
      ...cart,
      partyId: null,
      partyName: null,
      partyPhone: null,
      partyBalance: 0,
    })
  }
  return recalcCart({
    ...cart,
    partyId: party.id,
    partyName: party.name,
    partyPhone: party.phone || null,
    partyBalance: party.current_balance,
  })
}

// ── CALCULATION FUNCTIONS ──

function recalcLine(
  item: CartItem
): CartItem {
  const gross = item.unitPrice * item.quantity
  let discountAmount = 0
  if (item.discountType === 'percent') {
    discountAmount =
      gross * (item.discountValue / 100)
  } else {
    discountAmount = Math.min(
      item.discountValue, gross
    )
  }
  const afterDiscount = gross - discountAmount
  const taxAmount =
    afterDiscount * (item.taxRate / 100)
  const lineTotal = afterDiscount + taxAmount

  return {
    ...item,
    discountAmount:
      Math.round(discountAmount * 100) / 100,
    taxAmount:
      Math.round(taxAmount * 100) / 100,
    lineTotal:
      Math.round(lineTotal * 100) / 100,
  }
}

function recalcCart(cart: POSCart): POSCart {
  const subtotal = cart.items.reduce(
    (s, i) =>
      s + (i.unitPrice * i.quantity -
        i.discountAmount),
    0
  )
  const itemTax = cart.items.reduce(
    (s, i) => s + i.taxAmount, 0
  )

  let orderDiscountAmount = 0
  if (cart.discountType === 'percent') {
    orderDiscountAmount =
      subtotal * (cart.discountValue / 100)
  } else {
    orderDiscountAmount =
      Math.min(cart.discountValue, subtotal)
  }

  const afterOrderDiscount =
    subtotal - orderDiscountAmount
  const grandTotal =
    afterOrderDiscount + itemTax

  return recalcPayments({
    ...cart,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(itemTax * 100) / 100,
    discountAmount:
      Math.round(orderDiscountAmount * 100) / 100,
    grandTotal:
      Math.round(grandTotal * 100) / 100,
  })
}

export function recalcPayments(
  cart: POSCart
): POSCart {
  const totalPaid = cart.payments.reduce(
    (s, p) => s + p.amount, 0
  )
  const balanceDue = Math.max(
    0, cart.grandTotal - totalPaid
  )
  const change = Math.max(
    0, totalPaid - cart.grandTotal
  )
  return {
    ...cart,
    totalPaid:
      Math.round(totalPaid * 100) / 100,
    balanceDue:
      Math.round(balanceDue * 100) / 100,
    change:
      Math.round(change * 100) / 100,
  }
}

// ── STOCK VALIDATION ──

export function validateCartStock(
  cart: POSCart
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  for (const item of cart.items) {
    if (item.quantity > item.stockAvailable) {
      errors.push(
        `${item.name}: Only ${
          item.stockAvailable
        } ${item.unit} available`
      )
    }
  }
  return { valid: errors.length === 0, errors }
}

// ── FAST SCANNER HELPER ──

export function processScannedCode(rawCode: string): ParsedScanResult {
  return parseScannedPayload(rawCode)
}
