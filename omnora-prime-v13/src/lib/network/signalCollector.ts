import { createClient }
  from '@/lib/supabase/client'

// Call these at key moments in the app
// They collect anonymous signals for
// the industry intelligence layer

export async function emitSkuPriceSignal(
  industry: string,
  city: string,
  countryCode: string,
  category: string,
  pricePerUnit: number,
  unit: string
) {
  const supabase = createClient()
  const weekBucket = getWeekBucket()
  
  await supabase.from('industry_signals').insert({
    signal_type: 'sku_price',
    industry,
    city,
    country_code: countryCode,
    metric_name: `${category}_price_${unit}`,
    metric_value: pricePerUnit,
    metric_unit: unit,
    week_bucket: weekBucket,
  })
}

export async function emitProductionSignal(
  industry: string,
  city: string,
  countryCode: string,
  unitsProduced: number,
  gradeAPercent: number
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
    week_bucket: weekBucket,
  })
}

export async function emitWageSignal(
  industry: string,
  city: string,
  countryCode: string,
  wageType: string,
  rateValue: number
) {
  const supabase = createClient()
  const weekBucket = getWeekBucket()
  
  await supabase.from('industry_signals').insert({
    signal_type: 'wage_rate',
    industry,
    city,
    country_code: countryCode,
    metric_name: `${wageType}_rate`,
    metric_value: rateValue,
    metric_unit: 'PKR',
    week_bucket: weekBucket,
  })
}

export async function emitInvoiceVolumeSignal(
  industry: string,
  city: string,
  countryCode: string,
  weeklyInvoiceCount: number,
  weeklyRevenue: number
) {
  const supabase = createClient()
  const weekBucket = getWeekBucket()
  
  await supabase.from('industry_signals').insert({
    signal_type: 'invoice_volume',
    industry,
    city,
    country_code: countryCode,
    metric_name: 'weekly_invoices',
    metric_value: weeklyInvoiceCount,
    metric_unit: 'count',
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
