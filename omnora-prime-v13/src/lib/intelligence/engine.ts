import { createClient } from '@/lib/supabase/client'

export interface BusinessInsight {
  id: string
  type: 'opportunity' | 'warning' | 'critical' | 'positive'
  category: 'cash_flow' | 'inventory' | 'production' | 'receivables' | 'payroll' | 'customers'
  title: string
  detail: string
  metric: string
  action: string
  actionRoute?: string
  urgency: 1 | 2 | 3 // 1=high, 2=medium, 3=low
  generatedAt: string
}

export type IntelligenceInsight = BusinessInsight

export async function generateInsights(
  businessIdOrConfig: string | { id: string; currency?: string; [key: string]: any },
  currency: string = 'PKR'
): Promise<BusinessInsight[]> {
  let businessId: string
  let activeCurrency = currency

  if (typeof businessIdOrConfig === 'string') {
    businessId = businessIdOrConfig
  } else {
    businessId = businessIdOrConfig.id
    activeCurrency = businessIdOrConfig.currency || currency
  }

  const supabase = createClient()
  const insights: BusinessInsight[] = []
  const now = new Date()
  const fmt = (n: number) =>
    `${activeCurrency} ${n.toLocaleString('en-PK')}`

  const today = now.toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 86400000
  ).toISOString().split('T')[0]
  const sixtyDaysAgo = new Date(
    now.getTime() - 60 * 86400000
  ).toISOString().split('T')[0]
  const monthStart = `${today.slice(0, 7)}-01`

  // Run all queries in parallel
  const [
    invoicesRes,
    prevInvoicesRes,
    receivablesRes,
    stockRes,
    productionRes,
    prevProductionRes,
    karigarRes,
    attendanceRes,
    payrollRes,
    expiryRes,
  ] = await Promise.allSettled([
    // This month invoices
    supabase.from('invoices')
      .select('total_amount, subtotal, created_at, status')
      .eq('business_id', businessId)
      .eq('status', 'posted')
      .gte('created_at', monthStart),

    // Last month invoices (for trend)
    supabase.from('invoices')
      .select('total_amount, subtotal')
      .eq('business_id', businessId)
      .eq('status', 'posted')
      .gte('created_at', sixtyDaysAgo)
      .lt('created_at', thirtyDaysAgo),

    // Outstanding receivables
    supabase.from('invoices')
      .select('balance_due, due_date, party_id')
      .eq('business_id', businessId)
      .gt('balance_due', 0),

    // Inventory with reorder levels
    supabase.from('skus')
      .select('name, qty_on_hand, reorder_level, cost_price, unit')
      .eq('business_id', businessId)
      .eq('is_active', true),

    // This month production
    supabase.from('karigar_production_logs')
      .select('qty_produced, piece_rate_used, quality_grade, karigar_id')
      .eq('business_id', businessId)
      .gte('created_at', thirtyDaysAgo),

    // Last month production
    supabase.from('karigar_production_logs')
      .select('qty_produced')
      .eq('business_id', businessId)
      .gte('created_at', sixtyDaysAgo)
      .lt('created_at', thirtyDaysAgo),

    // Active karigars
    supabase.from('karigars')
      .select('id, name, current_advance, wage_type')
      .eq('business_id', businessId)
      .eq('status', 'active'),

    // Today attendance
    supabase.from('attendance_logs')
      .select('status')
      .eq('business_id', businessId)
      .eq('log_date', today),

    // This month payroll
    supabase.from('payroll_runs')
      .select('total_gross, total_net')
      .eq('business_id', businessId)
      .gte('period_start', monthStart),

    // Expiring items
    supabase.from('skus')
      .select('name, expiry_date, qty_on_hand')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .not('expiry_date', 'is', null)
      .lte('expiry_date',
        new Date(now.getTime() + 30 * 86400000)
          .toISOString().split('T')[0]
      )
      .gt('qty_on_hand', 0),
  ])

  const invoices = invoicesRes.status === 'fulfilled'
    ? invoicesRes.value.data || [] : []
  const prevInvoices = prevInvoicesRes.status === 'fulfilled'
    ? prevInvoicesRes.value.data || [] : []
  const receivables = receivablesRes.status === 'fulfilled'
    ? receivablesRes.value.data || [] : []
  const stock = stockRes.status === 'fulfilled'
    ? stockRes.value.data || [] : []
  const production = productionRes.status === 'fulfilled'
    ? productionRes.value.data || [] : []
  const prevProduction = prevProductionRes.status === 'fulfilled'
    ? prevProductionRes.value.data || [] : []
  const karigars = karigarRes.status === 'fulfilled'
    ? karigarRes.value.data || [] : []
  const attendance = attendanceRes.status === 'fulfilled'
    ? attendanceRes.value.data || [] : []
  const expiring = expiryRes.status === 'fulfilled'
    ? expiryRes.value.data || [] : []

  // ── INSIGHT 1: Revenue trend ──
  const thisMonthRevenue = invoices
    .reduce((s: number, i: any) => s + (i.subtotal || 0), 0)
  const lastMonthRevenue = prevInvoices
    .reduce((s: number, i: any) => s + (i.subtotal || 0), 0)

  if (lastMonthRevenue > 0) {
    const growth = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100

    if (growth >= 20) {
      insights.push({
        id: 'revenue-growth',
        type: 'positive',
        category: 'cash_flow',
        title: `Revenue up ${growth.toFixed(0)}% this month`,
        detail: `You made ${fmt(thisMonthRevenue)} this month vs ${fmt(lastMonthRevenue)} last month. Strong growth.`,
        metric: `+${growth.toFixed(0)}%`,
        action: 'View detailed P&L report',
        actionRoute: '/reports',
        urgency: 3,
        generatedAt: now.toISOString(),
      })
    } else if (growth <= -15) {
      insights.push({
        id: 'revenue-decline',
        type: 'warning',
        category: 'cash_flow',
        title: `Revenue down ${Math.abs(growth).toFixed(0)}% from last month`,
        detail: `${fmt(thisMonthRevenue)} this month vs ${fmt(lastMonthRevenue)} last month. Investigate the cause.`,
        metric: `${growth.toFixed(0)}%`,
        action: 'Review invoices for gaps',
        actionRoute: '/invoices',
        urgency: 1,
        generatedAt: now.toISOString(),
      })
    }
  }

  // ── INSIGHT 2: Overdue receivables ──
  const overdueItems = receivables.filter(
    (i: any) => i.due_date && new Date(i.due_date) < now
  )
  const overdueTotal = overdueItems
    .reduce((s: number, i: any) => s + (i.balance_due || 0), 0)
  const totalReceivable = receivables
    .reduce((s: number, i: any) => s + (i.balance_due || 0), 0)

  if (overdueTotal > 0) {
    const overduePercent =
      totalReceivable > 0
        ? (overdueTotal / totalReceivable * 100)
        : 0

    insights.push({
      id: 'overdue-receivables',
      type: overduePercent > 40 ? 'critical' : 'warning',
      category: 'receivables',
      title: `${fmt(overdueTotal)} overdue from ${overdueItems.length} customers`,
      detail: `${overduePercent.toFixed(0)}% of your receivables are past due date. Send reminders now to protect cash flow.`,
      metric: fmt(overdueTotal),
      action: 'Send WhatsApp reminders',
      actionRoute: '/parties',
      urgency: overduePercent > 40 ? 1 : 2,
      generatedAt: now.toISOString(),
    })
  }

  // ── INSIGHT 3: Stock alerts ──
  const criticalStock = stock.filter(
    (s: any) => s.reorder_level > 0 &&
      s.qty_on_hand <= s.reorder_level
  )

  if (criticalStock.length > 0) {
    insights.push({
      id: 'critical-stock',
      type: criticalStock.some((s: any) => s.qty_on_hand <= 0) ? 'critical' : 'warning',
      category: 'inventory',
      title: `${criticalStock.length} items need restocking`,
      detail: `${criticalStock.map((s: any) => s.name).slice(0, 3).join(', ')}${criticalStock.length > 3 ? ` and ${criticalStock.length - 3} more` : ''} are at or below reorder level.`,
      metric: `${criticalStock.length} items`,
      action: 'Create purchase order',
      actionRoute: '/purchase',
      urgency: criticalStock.some((s: any) => s.qty_on_hand <= 0) ? 1 : 2,
      generatedAt: now.toISOString(),
    })
  }

  // ── INSIGHT 4: Production efficiency ──
  const thisMonthUnits = production
    .reduce((s: number, p: any) => s + (p.qty_produced || 0), 0)
  const lastMonthUnits = prevProduction
    .reduce((s: number, p: any) => s + (p.qty_produced || 0), 0)
  const rejectedPct = production.length > 0
    ? (production.filter((p: any) => p.quality_grade === 'rejected' || p.quality_grade === 'C').length / production.length) * 100
    : 0

  if (rejectedPct > 10) {
    insights.push({
      id: 'high-rejection-rate',
      type: 'warning',
      category: 'production',
      title: `${rejectedPct.toFixed(0)}% rejection rate this month`,
      detail: `${rejectedPct.toFixed(1)}% of logged production is graded "Rejected" or "C". Industry standard is under 5%. Review karigar quality.`,
      metric: `${rejectedPct.toFixed(0)}% rejected`,
      action: 'View production report',
      actionRoute: '/reports',
      urgency: rejectedPct > 20 ? 1 : 2,
      generatedAt: now.toISOString(),
    })
  }

  if (lastMonthUnits > 0 && thisMonthUnits > 0) {
    const productionGrowth = ((thisMonthUnits - lastMonthUnits) / lastMonthUnits) * 105
    if (productionGrowth >= 15) {
      insights.push({
        id: 'production-growth',
        type: 'positive',
        category: 'production',
        title: `Production up ${productionGrowth.toFixed(0)}% this month`,
        detail: `${thisMonthUnits.toLocaleString()} units this month vs ${lastMonthUnits.toLocaleString()} last month. Your karigars are performing well.`,
        metric: `+${productionGrowth.toFixed(0)}%`,
        action: 'View top performers',
        actionRoute: '/karigars',
        urgency: 3,
        generatedAt: now.toISOString(),
      })
    }
  }

  // ── INSIGHT 5: Attendance alert ──
  const presentCount = attendance.filter(
    (a: any) => a.status === 'present'
  ).length
  const totalKarigars = karigars.length
  const attendanceRate = totalKarigars > 0
    ? (presentCount / totalKarigars) * 100
    : 100

  if (attendanceRate < 70 && totalKarigars > 3) {
    insights.push({
      id: 'low-attendance',
      type: 'warning',
      category: 'payroll',
      title: `Only ${attendanceRate.toFixed(0)}% attendance today`,
      detail: `${presentCount} of ${totalKarigars} karigars are present. Low attendance will impact production output and delivery deadlines.`,
      metric: `${attendanceRate.toFixed(0)}% present`,
      action: 'Mark attendance',
      actionRoute: '/karigars',
      urgency: 2,
      generatedAt: now.toISOString(),
    })
  }

  // ── INSIGHT 6: High peshgi balance ──
  const totalPeshgi = karigars.reduce(
    (s: number, k: any) => s + (k.current_advance || 0), 0
  )
  const highPeshgiKarigars = karigars.filter(
    (k: any) => (k.current_advance || 0) > 5000
  )

  if (highPeshgiKarigars.length > 0) {
    insights.push({
      id: 'high-peshgi',
      type: 'warning',
      category: 'payroll',
      title: `${fmt(totalPeshgi)} in outstanding advances`,
      detail: `${highPeshgiKarigars.length} karigar${highPeshgiKarigars.length > 1 ? 's have' : ' has'} advances over PKR 5,000. Ensure deductions are planned in next payroll.`,
      metric: fmt(totalPeshgi),
      action: 'Review payroll plan',
      actionRoute: '/payroll',
      urgency: 2,
      generatedAt: now.toISOString(),
    })
  }

  // ── INSIGHT 7: Expiry alerts ──
  if (expiring.length > 0) {
    const expiredNow = expiring.filter(
      (e: any) => new Date(e.expiry_date) < now
    )
    insights.push({
      id: 'expiry-alert',
      type: expiredNow.length > 0 ? 'critical' : 'warning',
      category: 'inventory',
      title: `${expiring.length} item${expiring.length > 1 ? 's' : ''} expiring within 30 days`,
      detail: expiredNow.length > 0
        ? `${expiredNow.length} item${expiredNow.length > 1 ? 's have' : ' has'} already expired and should be removed from inventory immediately.`
        : `${expiring.map((e: any) => e.name).slice(0, 3).join(', ')} will expire soon. Take action before stock becomes unsellable.`,
      metric: `${expiring.length} items`,
      action: 'View expiry alerts',
      actionRoute: '/inventory/expiry',
      urgency: expiredNow.length > 0 ? 1 : 2,
      generatedAt: now.toISOString(),
    })
  }

  // Sort by urgency then type
  return insights.sort((a, b) => {
    if (a.urgency !== b.urgency)
      return a.urgency - b.urgency
    const typeOrder = {
      critical: 0,
      warning: 1,
      opportunity: 2,
      positive: 3
    }
    return typeOrder[a.type] - typeOrder[b.type]
  })
}
