import { Decimal } from 'decimal.js';

export type CurrencyCode =
  'PKR' | 'USD' | 'EUR' | 'GBP' | 'AED' |
  'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' |
  'BDT' | 'INR' | 'LKR' | 'NPR' |
  'TRY' | 'IDR' | 'VND' | 'MYR' | 'THB' |
  'MAD' | 'EGP' | 'NGN' | 'ETB' | 'KES' |
  'MXN' | 'BRL' | 'COP' | 'PEN' |
  'CAD' | 'AUD' | 'SGD' | 'HKD' | 'JPY' |
  'CNY' | 'KRW' | 'ZAR' | 'GHS';

export type Currency = {
  code: CurrencyCode
  name: string
  symbol: string
  symbolPosition: 'before' | 'after'
  decimalPlaces: number
  thousandSeparator: string
  decimalSeparator: string
  // South Asian Lakh/Crore system
  useLakhSystem: boolean
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  PKR: {
    code: 'PKR', name: 'Pakistani Rupee',
    symbol: 'Rs.', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: true,
  },
  USD: {
    code: 'USD', name: 'US Dollar',
    symbol: '$', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  AED: {
    code: 'AED', name: 'UAE Dirham',
    symbol: 'AED', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  EUR: {
    code: 'EUR', name: 'Euro',
    symbol: '€', symbolPosition: 'after',
    decimalPlaces: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    useLakhSystem: false,
  },
  GBP: {
    code: 'GBP', name: 'British Pound',
    symbol: '£', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  BDT: {
    code: 'BDT', name: 'Bangladeshi Taka',
    symbol: '৳', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: true,
  },
  INR: {
    code: 'INR', name: 'Indian Rupee',
    symbol: '₹', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: true,
  },
  LKR: {
    code: 'LKR', name: 'Sri Lankan Rupee',
    symbol: 'Rs.', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: true,
  },
  NPR: {
    code: 'NPR', name: 'Nepalese Rupee',
    symbol: 'Rs.', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: true,
  },
  TRY: {
    code: 'TRY', name: 'Turkish Lira',
    symbol: '₺', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    useLakhSystem: false,
  },
  IDR: {
    code: 'IDR', name: 'Indonesian Rupiah',
    symbol: 'Rp', symbolPosition: 'before',
    decimalPlaces: 0,
    thousandSeparator: '.',
    decimalSeparator: ',',
    useLakhSystem: false,
  },
  VND: {
    code: 'VND', name: 'Vietnamese Dong',
    symbol: '₫', symbolPosition: 'after',
    decimalPlaces: 0,
    thousandSeparator: '.',
    decimalSeparator: ',',
    useLakhSystem: false,
  },
  SAR: {
    code: 'SAR', name: 'Saudi Riyal',
    symbol: 'SAR', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  QAR: {
    code: 'QAR', name: 'Qatari Riyal',
    symbol: 'QR', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  KWD: {
    code: 'KWD', name: 'Kuwaiti Dinar',
    symbol: 'KD', symbolPosition: 'before',
    decimalPlaces: 3,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  BHD: {
    code: 'BHD', name: 'Bahraini Dinar',
    symbol: 'BD', symbolPosition: 'before',
    decimalPlaces: 3,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  OMR: {
    code: 'OMR', name: 'Omani Rial',
    symbol: 'RO', symbolPosition: 'before',
    decimalPlaces: 3,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  MYR: {
    code: 'MYR', name: 'Malaysian Ringgit',
    symbol: 'RM', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  THB: {
    code: 'THB', name: 'Thai Baht',
    symbol: '฿', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  MAD: {
    code: 'MAD', name: 'Moroccan Dirham',
    symbol: 'MAD', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  EGP: {
    code: 'EGP', name: 'Egyptian Pound',
    symbol: 'EGP', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  NGN: {
    code: 'NGN', name: 'Nigerian Naira',
    symbol: '₦', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  ETB: {
    code: 'ETB', name: 'Ethiopian Birr',
    symbol: 'Br', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  KES: {
    code: 'KES', name: 'Kenyan Shilling',
    symbol: 'KSh', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  MXN: {
    code: 'MXN', name: 'Mexican Peso',
    symbol: '$', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  BRL: {
    code: 'BRL', name: 'Brazilian Real',
    symbol: 'R$', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    useLakhSystem: false,
  },
  COP: {
    code: 'COP', name: 'Colombian Peso',
    symbol: '$', symbolPosition: 'before',
    decimalPlaces: 0,
    thousandSeparator: '.',
    decimalSeparator: ',',
    useLakhSystem: false,
  },
  PEN: {
    code: 'PEN', name: 'Peruvian Sol',
    symbol: 'S/', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  CAD: {
    code: 'CAD', name: 'Canadian Dollar',
    symbol: '$', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  AUD: {
    code: 'AUD', name: 'Australian Dollar',
    symbol: '$', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  SGD: {
    code: 'SGD', name: 'Singapore Dollar',
    symbol: '$', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  HKD: {
    code: 'HKD', name: 'Hong Kong Dollar',
    symbol: 'HK$', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  JPY: {
    code: 'JPY', name: 'Japanese Yen',
    symbol: '¥', symbolPosition: 'before',
    decimalPlaces: 0,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  CNY: {
    code: 'CNY', name: 'Chinese Yuan',
    symbol: '¥', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  KRW: {
    code: 'KRW', name: 'Korean Won',
    symbol: '₩', symbolPosition: 'before',
    decimalPlaces: 0,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  ZAR: {
    code: 'ZAR', name: 'South African Rand',
    symbol: 'R', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
  GHS: {
    code: 'GHS', name: 'Ghanaian Cedi',
    symbol: 'GH₵', symbolPosition: 'before',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    useLakhSystem: false,
  },
};

export function formatCurrency(
  amount: Decimal | number | string,
  currencyCode: CurrencyCode,
  options: {
    compact?: boolean
    showCode?: boolean
  } = {}
): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const decimal = new Decimal(amount || 0);
  const value = decimal.abs();
  const isNegative = decimal.isNegative();
  
  let formatted: string;
  
  if (options.compact && currency.useLakhSystem) {
    // South Asian compact
    if (value.gte(10000000)) {
      formatted = value.div(10000000).toDecimalPlaces(2).toString() + ' Cr';
    } else if (value.gte(100000)) {
      formatted = value.div(100000).toDecimalPlaces(2).toString() + ' Lac';
    } else if (value.gte(1000)) {
      formatted = value.div(1000).toDecimalPlaces(1).toString() + 'K';
    } else {
      formatted = value.toDecimalPlaces(currency.decimalPlaces).toString();
    }
  } else if (options.compact && !currency.useLakhSystem) {
    // International compact
    if (value.gte(1000000000)) {
      formatted = value.div(1000000000).toDecimalPlaces(1).toString() + 'B';
    } else if (value.gte(1000000)) {
      formatted = value.div(1000000).toDecimalPlaces(1).toString() + 'M';
    } else if (value.gte(1000)) {
      formatted = value.div(1000).toDecimalPlaces(1).toString() + 'K';
    } else {
      formatted = value.toDecimalPlaces(currency.decimalPlaces).toString();
    }
  } else {
    // Full format with separators
    const parts = value.toDecimalPlaces(currency.decimalPlaces).toFixed(currency.decimalPlaces).split('.');
    
    let intPart = parts[0];
    
    if (currency.useLakhSystem && intPart.length > 3) {
      const last3 = intPart.slice(-3);
      const rest = intPart.slice(0, -3);
      const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, currency.thousandSeparator);
      intPart = restFormatted + currency.thousandSeparator + last3;
    } else {
      intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandSeparator);
    }
    
    formatted = currency.decimalPlaces > 0
      ? intPart + currency.decimalSeparator + parts[1]
      : intPart;
  }
  
  // Add symbol
  const prefix = isNegative ? '-' : '';
  const display = currency.symbolPosition === 'before'
    ? `${prefix}${currency.symbol} ${formatted}`
    : `${prefix}${formatted} ${currency.symbol}`;
  
  if (options.showCode) {
    return `${display} ${currencyCode}`;
  }
  return display;
}
