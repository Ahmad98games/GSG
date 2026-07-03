export interface RegionConfig {
  countryCode: string
  currency: string
  currencySymbol: string
  dateFormat: string
  taxLabel: string
  taxRate: number
  callingCode: string
  rtl: boolean
  defaultLanguage: string
}

export const REGION_CONFIGS: Record<string, RegionConfig> = {
  PK: {
    countryCode: 'PK',
    currency: 'PKR',
    currencySymbol: 'Rs.',
    dateFormat: 'DD/MM/YYYY',
    taxLabel: 'GST',
    taxRate: 17,
    callingCode: '+92',
    rtl: false,
    defaultLanguage: 'en-PK',
  },
  AE: {
    countryCode: 'AE',
    currency: 'AED',
    currencySymbol: 'AED',
    dateFormat: 'DD/MM/YYYY',
    taxLabel: 'VAT',
    taxRate: 5,
    callingCode: '+971',
    rtl: false,
    defaultLanguage: 'en-AE',
  },
  SA: {
    countryCode: 'SA',
    currency: 'SAR',
    currencySymbol: 'SAR',
    dateFormat: 'DD/MM/YYYY',
    taxLabel: 'VAT',
    taxRate: 15,
    callingCode: '+966',
    rtl: false,
    defaultLanguage: 'en-SA',
  },
  BD: {
    countryCode: 'BD',
    currency: 'BDT',
    currencySymbol: '৳',
    dateFormat: 'DD/MM/YYYY',
    taxLabel: 'VAT',
    taxRate: 15,
    callingCode: '+880',
    rtl: false,
    defaultLanguage: 'en-BD',
  },
  IN: {
    countryCode: 'IN',
    currency: 'INR',
    currencySymbol: '₹',
    dateFormat: 'DD/MM/YYYY',
    taxLabel: 'GST',
    taxRate: 18,
    callingCode: '+91',
    rtl: false,
    defaultLanguage: 'en-IN',
  },
  GB: {
    countryCode: 'GB',
    currency: 'GBP',
    currencySymbol: '£',
    dateFormat: 'DD/MM/YYYY',
    taxLabel: 'VAT',
    taxRate: 20,
    callingCode: '+44',
    rtl: false,
    defaultLanguage: 'en-GB',
  },
  US: {
    countryCode: 'US',
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/DD/YYYY',
    taxLabel: 'Tax',
    taxRate: 0,
    callingCode: '+1',
    rtl: false,
    defaultLanguage: 'en-US',
  },
}

export function getRegionConfig(
  countryCode: string | null | undefined
): RegionConfig {
  return REGION_CONFIGS[countryCode || 'PK'] ||
    REGION_CONFIGS.PK
}
