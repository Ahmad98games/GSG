import Decimal from 'decimal.js'

export type TaxProfile = {
  country: string
  taxName: string      // GST, VAT, KDV, PPN, TVA
  defaultRate: number  // percentage
  taxId: string        // NTN, KDV No, VAT Reg No
  invoiceLabel: string // "GST Registration No"
  hasHSN: boolean      // India requires HSN codes
  format: 'percentage' | 'inclusive'
}

export const taxProfiles: Record<string, TaxProfile> = {
  PK: {
    country: 'Pakistan',
    taxName: 'GST',
    defaultRate: 17,
    taxId: 'NTN',
    invoiceLabel: 'NTN / STRN',
    hasHSN: false,
    format: 'percentage'
  },
  AE: {
    country: 'UAE',
    taxName: 'VAT',
    defaultRate: 5,
    taxId: 'TRN',
    invoiceLabel: 'VAT Registration No',
    hasHSN: false,
    format: 'percentage'
  },
  GB: {
    country: 'United Kingdom',
    taxName: 'VAT',
    defaultRate: 20,
    taxId: 'VAT',
    invoiceLabel: 'VAT Registration No',
    hasHSN: false,
    format: 'percentage'
  },
  TR: {
    country: 'Turkey',
    taxName: 'KDV',
    defaultRate: 18,
    taxId: 'VKN',
    invoiceLabel: 'Vergi Kimlik Numarası',
    hasHSN: false,
    format: 'percentage'
  },
  BD: {
    country: 'Bangladesh',
    taxName: 'VAT',
    defaultRate: 15,
    taxId: 'BIN',
    invoiceLabel: 'Business ID No',
    hasHSN: false,
    format: 'percentage'
  },
  IN: {
    country: 'India',
    taxName: 'GST',
    defaultRate: 18,
    taxId: 'GSTIN',
    invoiceLabel: 'GSTIN',
    hasHSN: true,
    format: 'percentage'
  },
  ID: {
    country: 'Indonesia',
    taxName: 'PPN',
    defaultRate: 11,
    taxId: 'NPWP',
    invoiceLabel: 'NPWP',
    hasHSN: false,
    format: 'percentage'
  },
  MA: {
    country: 'Morocco',
    taxName: 'TVA',
    defaultRate: 20,
    taxId: 'IF',
    invoiceLabel: 'Identifiant Fiscal',
    hasHSN: false,
    format: 'percentage'
  },
  DE: {
    country: 'Germany',
    taxName: 'MwSt',
    defaultRate: 19,
    taxId: 'USt-IdNr',
    invoiceLabel: 'USt-IdNr',
    hasHSN: false,
    format: 'percentage'
  },
  US: {
    country: 'United States',
    taxName: 'Sales Tax',
    defaultRate: 0,  // varies by state
    taxId: 'EIN',
    invoiceLabel: 'EIN',
    hasHSN: false,
    format: 'percentage'
  },
  VN: {
    country: 'Vietnam',
    taxName: 'VAT',
    defaultRate: 10,
    taxId: 'MST',
    invoiceLabel: 'Mã số thuế',
    hasHSN: false,
    format: 'percentage'
  },
  SA: {
    country: 'Saudi Arabia',
    taxName: 'VAT',
    defaultRate: 15,
    taxId: 'VAT',
    invoiceLabel: 'VAT Registration No',
    hasHSN: false,
    format: 'percentage'
  },
  GLOBAL: {
    country: 'Global / Other',
    taxName: 'Tax',
    defaultRate: 0,
    taxId: 'Tax ID',
    invoiceLabel: 'Tax Registration No',
    hasHSN: false,
    format: 'percentage'
  }
}

export function getTaxProfile(
  countryCode: string
): TaxProfile {
  return taxProfiles[countryCode] || taxProfiles.GLOBAL
}

export function calculateTax(
  subtotal: Decimal,
  rate: number
): Decimal {
  return subtotal.times(rate).div(100)
    .toDecimalPlaces(2)
}
