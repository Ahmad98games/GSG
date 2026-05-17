import { Decimal } from 'decimal.js';

// Configure Decimal.js for industrial financial standards
Decimal.set({ 
  precision: 20, 
  rounding: Decimal.ROUND_HALF_UP 
});

export const IndustrialMath = {
  add: (a: number | string, b: number | string) => new Decimal(a).plus(b).toNumber(),
  subtract: (a: number | string, b: number | string) => new Decimal(a).minus(b).toNumber(),
  multiply: (a: number | string, b: number | string) => new Decimal(a).times(b).toNumber(),
  divide: (a: number | string, b: number | string) => new Decimal(a).div(b).toNumber(),
  
  // Minor units conversion (paisas to rupees)
  toMajor: (minor: number) => new Decimal(minor).div(100).toNumber(),
  toMinor: (major: number) => new Decimal(major).times(100).toNumber(),
  
  // Totals calculation
  calculateInvoiceTotals: (items: { qty: number; price: number }[], discountPct = 0, taxPct = 0) => {
    const subtotal = items.reduce((acc: Decimal, item: any) => {
      return acc.plus(new Decimal(item.qty).times(item.price));
    }, new Decimal(0));
    
    const discount = subtotal.times(new Decimal(discountPct).div(100));
    const subtotalAfterDiscount = subtotal.minus(discount);
    const tax = subtotalAfterDiscount.times(new Decimal(taxPct).div(100));
    const total = subtotalAfterDiscount.plus(tax);
    
    return {
      subtotal: subtotal.toNumber(),
      discountAmount: discount.toNumber(),
      taxAmount: tax.toNumber(),
      total: total.toNumber()
    };
  }
};

