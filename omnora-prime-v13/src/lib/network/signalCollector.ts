import { createClient }
  from '@/lib/supabase/client'

// Call these at key moments in the app
// They collect anonymous signals for
// the industry intelligence layer

// Approximate rates updated quarterly
const USD_RATES: Record<string, number> = {
  PKR: 0.0036,   // 1 PKR = 0.0036 USD
  AED: 0.272,    // 1 AED = 0.272 USD
  BDT: 0.0091,   // 1 BDT = 0.0091 USD
  TRY: 0.031,    // 1 TRY = 0.031 USD
  IDR: 0.000063, // 1 IDR = 0.000063 USD
  VND: 0.000040, // 1 VND = 0.000040 USD
  MAD: 0.099,    // 1 MAD = 0.099 USD
  ETB: 0.018,    // 1 ETB = 0.018 USD
  GBP: 1.27,     // 1 GBP = 1.27 USD
  CAD: 0.74,     // 1 CAD = 0.74 USD
  USD: 1.0,
  EUR: 1.08,
}

export async function emitSkuPriceSignal(
  industry: string,
  city: string,
  countryCode: string,
  category: string,
  pricePerUnit: number,
  unit: string,
  currency: string = 'PKR'
) {
  const supabase = createClient()
  const weekBucket = getWeekBucket()
  
  const usdRate = USD_RATES[currency] || 1
  const priceUsd = pricePerUnit * usdRate
  
  await supabase.from('industry_signals').insert({
    signal_type: 'sku_price',
    industry,
    city,
    country_code: countryCode,
    metric_name: `${category}_price_${unit}`,
    metric_value: pricePerUnit,
    metric_unit: unit,
    currency,
    metric_value_usd: priceUsd,
    week_bucket: weekBucket,
  })
}

export async function emitProductionSignal(
  industry: string,
  city: string,
  countryCode: string,
  unitsProduced: number,
  gradeAPercent: number,
  currency: string = 'PKR'
) {
  const supabase = createClient()
  const weekBucket = getWeekBucket()
  
  await supabase.from('industry_signals').insert({
    signal_type: 'production_output',
    industry,
    city,
    country_code: countryCode,
    metric_name: 'units_per_day',
    metric_value: unitsProduced,
    metric_unit: 'units',
    currency,
    metric_value_usd: null, // Production units are not monetary
    week_bucket: weekBucket,
  })
}

export async function emitWageSignal(
  industry: string,
  city: string,
  countryCode: string,
  wageType: string,
  rateValue: number,
  currency: string = 'PKR'
) {
  const supabase = createClient()
  const weekBucket = getWeekBucket()
  
  const usdRate = USD_RATES[currency] || 1
  const priceUsd = rateValue * usdRate
  
  await supabase.from('industry_signals').insert({
    signal_type: 'wage_rate',
    industry,
    city,
    country_code: countryCode,
    metric_name: `${wageType}_rate`,
    metric_value: rateValue,
    metric_unit: currency,
    currency,
    metric_value_usd: priceUsd,
    week_bucket: weekBucket,
  })
}

export async function emitInvoiceVolumeSignal(
  industry: string,
  city: string,
  countryCode: string,
  weeklyInvoiceCount: number,
  weeklyRevenue: number,
  currency: string = 'PKR'
) {
  const supabase = createClient()
  const weekBucket = getWeekBucket()
  
  const usdRate = USD_RATES[currency] || 1
  const revenueUsd = weeklyRevenue * usdRate
  
  await supabase.from('industry_signals').insert({
    signal_type: 'invoice_volume',
    industry,
    city,
    country_code: countryCode,
    metric_name: 'weekly_invoices',
    metric_value: weeklyInvoiceCount,
    metric_unit: 'count',
    currency,
    metric_value_usd: revenueUsd, // Save the converted revenue USD
    week_bucket: weekBucket,
  })
}

function getWeekBucket(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day
    + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}
