export interface CurrencyConfig {
  code: string
  symbol: string
  name: string
  locale: string
  decimalPlaces: number
  symbolPosition: 'before' | 'after'
  thousandsSeparator: string
  decimalSeparator: string
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  PKR: {
    code: 'PKR',
    symbol: 'Rs.',
    name: 'Pakistani Rupee',
    locale: 'en-PK',
    decimalPlaces: 0,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    locale: 'en-AE',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  SAR: {
    code: 'SAR',
    symbol: 'SAR',
    name: 'Saudi Riyal',
    locale: 'en-SA',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'en-EU',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  BDT: {
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    locale: 'bn-BD',
    decimalPlaces: 0,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
}

export function formatCurrency(
  amount: number,
  currencyCode: string = 'PKR',
  options?: {
    showCode?: boolean
    compact?: boolean
  }
): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES.PKR

  if (options?.compact) {
    if (amount >= 10_000_000)
      return `${config.symbol} ${(amount / 10_000_000).toFixed(1)}Cr`
    if (amount >= 100_000)
      return `${config.symbol} ${(amount / 100_000).toFixed(1)}L`
    if (amount >= 1_000)
      return `${config.symbol} ${(amount / 1_000).toFixed(0)}K`
  }

  const formatted = new Intl.NumberFormat(
    config.locale,
    {
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
    }
  ).format(Math.abs(amount))

  const sign = amount < 0 ? '-' : ''
  const display = options?.showCode ? currencyCode : config.symbol

  return `${sign}${display} ${formatted}`
}

// Tax system configuration
export interface TaxConfig {
  system: 'GST' | 'VAT' | 'NONE'
  rate: number
  label: string
  description: string
  requiresNumber: boolean
  numberLabel: string
}

export const TAX_SYSTEMS: Record<string, TaxConfig> = {
  GST: {
    system: 'GST',
    rate: 17,
    label: 'GST',
    description: 'General Sales Tax (Pakistan)',
    requiresNumber: true,
    numberLabel: 'STRN',
  },
  VAT_UAE: {
    system: 'VAT',
    rate: 5,
    label: 'VAT',
    description: 'Value Added Tax (UAE)',
    requiresNumber: true,
    numberLabel: 'TRN',
  },
  VAT_UK: {
    system: 'VAT',
    rate: 20,
    label: 'VAT',
    description: 'Value Added Tax (UK)',
    requiresNumber: true,
    numberLabel: 'VAT Number',
  },
  NONE: {
    system: 'NONE',
    rate: 0,
    label: '',
    description: 'No tax',
    requiresNumber: false,
    numberLabel: '',
  },
}

export function getCountryTaxSystem(
  countryCode: string,
  customRate?: number
): TaxConfig {
  switch (countryCode) {
    case 'PK':
      return {
        ...TAX_SYSTEMS.GST,
        rate: customRate || 17,
      }
    case 'AE':
      return {
        ...TAX_SYSTEMS.VAT_UAE,
        rate: customRate || 5,
      }
    case 'GB':
      return {
        ...TAX_SYSTEMS.VAT_UK,
        rate: customRate || 20,
      }
    case 'SA':
      return {
        ...TAX_SYSTEMS.VAT_UAE,
        rate: customRate || 15,
        label: 'VAT',
        description: 'Value Added Tax (Saudi)',
        numberLabel: 'VAT Registration',
      }
    default:
      return customRate
        ? { ...TAX_SYSTEMS.NONE, rate: customRate }
        : TAX_SYSTEMS.NONE
  }
}
