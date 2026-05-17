export const currencySymbols: Record<string, string> = {
  PKR: 'Rs.', USD: '$', EUR: '€', GBP: '£',
  AED: 'AED', BDT: '৳', TRY: '₺', VND: '₫',
  IDR: 'Rp', MAD: 'MAD', ETB: 'Br',
  MXN: '$', INR: '₹', SAR: 'SAR',
  QAR: 'QAR', KWD: 'KD', OMR: 'OMR',
  CAD: 'CA$', AUD: 'A$', SGD: 'S$',
  MYR: 'RM', THB: '฿', PHP: '₱',
};

export function getCurrencySymbol(code: string): string {
  return currencySymbols[code] || code;
}
