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
  calculateInvoiceTotals: (items: { qty: number; price: number }[], discountPct: number | string = 0, taxPct: number | string = 0) => {
    const validDiscount = Math.max(0, Math.min(100, Number(discountPct) || 0));
    const validTax = Math.max(0, Number(taxPct) || 0);

    const subtotal = (items || []).reduce((acc: Decimal, item: any) => {
      const q = Math.max(0, Number(item?.qty) || 0);
      const p = Math.max(0, Number(item?.price) || 0);
      return acc.plus(new Decimal(q).times(p));
    }, new Decimal(0));
    
    const discount = subtotal.times(new Decimal(validDiscount).div(100));
    const subtotalAfterDiscount = subtotal.minus(discount);
    const tax = subtotalAfterDiscount.times(new Decimal(validTax).div(100));
    const total = subtotalAfterDiscount.plus(tax);
    
    return {
      subtotal: subtotal.toNumber(),
      discountAmount: discount.toNumber(),
      taxAmount: tax.toNumber(),
      total: total.toNumber()
    };
  }
};

