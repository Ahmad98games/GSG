import { createClient }
  from '@/lib/supabase/client'

export interface IntelligenceInsight {
  type: string
  title: string
  summary: string
  value?: number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  trendPercent?: number
  benchmark?: number
  benchmarkLabel?: string
  action?: string
  urgency: 'info' | 'warning' | 'critical'
}

export async function generateInsights(
  profile: {
    id: string
    industry: string
    city: string
    country_code: string
    currency: string
  }
): Promise<IntelligenceInsight[]> {
  const supabase = createClient()
  const insights: IntelligenceInsight[] = []
  
  const lastWeek = getWeekBucket(-7)
  const fourWeeksAgo = getWeekBucket(-28)
  
  // 1. Price trend for your industry
  const { data: priceSignals } = await supabase
    .from('industry_signals')
    .select('metric_value, metric_value_usd, week_bucket, currency')
    .eq('signal_type', 'sku_price')
    .eq('industry', profile.industry)
    .eq('country_code', profile.country_code)
    .gte('week_bucket', fourWeeksAgo)
    .order('week_bucket', { ascending: false })
  
  if (priceSignals && priceSignals.length >= 2) {
    const recent = priceSignals
      .filter((s: any) => s.week_bucket >= lastWeek)
    const older = priceSignals
      .filter((s: any) => s.week_bucket < lastWeek)
    
    if (recent.length && older.length) {
      const recentAvg = avg(
        recent.map((s: any) => Number(s.metric_value_usd) || 0)
      )
      const olderAvg = avg(
        older.map((s: any) => Number(s.metric_value_usd) || 0)
      )
      const changePct = ((recentAvg - olderAvg)
        / (olderAvg || 1)) * 100
      
      if (Math.abs(changePct) > 5) {
        insights.push({
          type: 'price_trend',
          title: changePct > 0
            ? 'Input costs rising in your industry'
            : 'Input costs falling in your industry',
          summary: `${profile.industry.replace('_', ' ')} material prices are ${changePct > 0 ? 'up' : 'down'} ${Math.abs(changePct).toFixed(1)}% vs last month across factories in ${profile.country_code}.`,
          trend: changePct > 0 ? 'up' : 'down',
          trendPercent: Math.abs(changePct),
          urgency: Math.abs(changePct) > 15
            ? 'warning' : 'info',
          action: changePct > 0
            ? 'Consider buying more stock now before prices rise further.'
            : 'Good time to restock at lower prices.',
        })
      }
    }
  }
  
  // 2. Wage rate comparison
  const { data: wageSignals } = await supabase
    .from('industry_signals')
    .select('metric_value, metric_name')
    .eq('signal_type', 'wage_rate')
    .eq('industry', profile.industry)
    .eq('country_code', profile.country_code)
    .gte('week_bucket', fourWeeksAgo)
  
  if (wageSignals && wageSignals.length >= 3) {
    const pieceRates = wageSignals
      .filter((s: any) => s.metric_name && s.metric_name.includes('piece_rate'))
      .map((s: any) => Number(s.metric_value))
    
    if (pieceRates.length) {
      const marketAvg = avg(pieceRates)
      insights.push({
        type: 'wage_benchmark',
        title: 'Market wage rate in your industry',
        summary: `Average piece rate in your industry is ${profile.currency} ${marketAvg.toFixed(0)}/piece based on ${pieceRates.length} factories.`,
        value: marketAvg,
        unit: `${profile.currency}/piece`,
        benchmarkLabel: 'Market average',
        urgency: 'info',
      })
    }
  }
  
  return insights
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0)
    / nums.length
}

function getWeekBucket(daysOffset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  const day = d.getDay()
  const diff = d.getDate() - day
    + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}
