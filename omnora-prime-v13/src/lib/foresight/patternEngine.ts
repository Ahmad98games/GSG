import { createClient } from '@/lib/supabase/client'

interface PatternResult {
  patternType: string
  entityId: string
  entityLabel: string
  data: Record<string, any>
  confidence: number
  dataPointsUsed: number
}

export async function analyzeBusinessPatterns(
  businessId: string
): Promise<PatternResult[]> {
  const supabase = createClient()
  const patterns: PatternResult[] = []
  const now = new Date()

  // Fetch 6 months of history
  const sixMonthsAgo = new Date(
    now.getTime() - 180 * 86400000
  ).toISOString()

  const [
    invoicesRes,
    paymentsRes,
    productionRes,
    stockMovementsRes,
    attendanceRes,
    purchaseOrdersRes,
  ] = await Promise.allSettled([
    supabase.from('invoices')
      .select(`
        id, party_id, total_amount,
        created_at, due_date, status,
        paid_amount,
        party:parties(name)
      `)
      .eq('business_id', businessId)
      .gte('created_at', sixMonthsAgo)
      .eq('status', 'posted'),

    supabase.from('payments')
      .select('party_id, amount, payment_date')
      .eq('business_id', businessId)
      .gte('payment_date', sixMonthsAgo),

    supabase.from('karigar_production_logs')
      .select(`
        karigar_id, units_produced,
        grade, log_date, earnings,
        karigar:karigars(name, piece_rate)
      `)
      .eq('business_id', businessId)
      .gte('log_date', sixMonthsAgo.split('T')[0]),

    supabase.from('skus')
      .select(`
        id, name, qty_on_hand,
        reorder_level, unit, cost_price
      `)
      .eq('business_id', businessId)
      .eq('is_active', true),

    supabase.from('attendance_logs')
      .select('karigar_id, status, attendance_date')
      .eq('business_id', businessId)
      .gte('attendance_date',
        sixMonthsAgo.split('T')[0]
      ),

    supabase.from('purchase_orders')
      .select(`
        id, supplier_id, created_at,
        received_at, status,
        supplier:parties(name)
      `)
      .eq('business_id', businessId)
      .gte('created_at', sixMonthsAgo),
  ])

  const invoices = invoicesRes.status === 'fulfilled'
    ? invoicesRes.value.data || [] : []
  const payments = paymentsRes.status === 'fulfilled'
    ? paymentsRes.value.data || [] : []
  const production = productionRes.status === 'fulfilled'
    ? productionRes.value.data || [] : []
  const stock = stockMovementsRes.status === 'fulfilled'
    ? stockMovementsRes.value.data || [] : []
  const attendance = attendanceRes.status === 'fulfilled'
    ? attendanceRes.value.data || [] : []
  const purchaseOrders = purchaseOrdersRes.status === 'fulfilled'
    ? purchaseOrdersRes.value.data || [] : []

  // ── PATTERN 1: Customer payment cycles ──
  const customerInvoices = invoices.reduce(
    (acc: Record<string, any[]>, inv: any) => {
      if (!acc[inv.party_id]) acc[inv.party_id] = []
      acc[inv.party_id].push(inv)
      return acc
    }, {}
  )

  for (const [partyId, custInvoices] of Object.entries(customerInvoices) as [string, any[]][]) {
    if (custInvoices.length < 2) continue

    const paymentDays: number[] = []

    for (const inv of custInvoices) {
      const relatedPayments = payments.filter(
        (p: any) => p.party_id === partyId &&
          new Date(p.payment_date) >= new Date(inv.created_at)
      )

      if (relatedPayments.length > 0) {
        const firstPayment = relatedPayments
          .sort((a: any, b: any) =>
            new Date(a.payment_date).getTime() -
            new Date(b.payment_date).getTime()
          )[0]

        const days = Math.round(
          (new Date(firstPayment.payment_date).getTime() -
            new Date(inv.created_at).getTime()
          ) / 86400000
        )

        if (days >= 0 && days <= 365) {
          paymentDays.push(days)
        }
      }
    }

    if (paymentDays.length >= 2) {
      const avgDays = paymentDays.reduce((s, d) => s + d, 0) / paymentDays.length
      const variance = paymentDays.reduce((s, d) => s + Math.pow(d - avgDays, 2), 0) / paymentDays.length
      const stdDev = Math.sqrt(variance)
      const isReliable = stdDev < avgDays * 0.3

      const monthlyAvg: Record<number, number[]> = {}
      custInvoices.forEach((inv, i) => {
        const month = new Date(inv.created_at).getMonth()
        if (!monthlyAvg[month]) monthlyAvg[month] = []
        if (paymentDays[i] !== undefined) {
          monthlyAvg[month].push(paymentDays[i])
        }
      })

      const slowMonths = Object.entries(monthlyAvg)
        .filter(([_, days]) => {
          const avg = days.reduce((s, d) => s + d, 0) / days.length
          return avg > avgDays * 1.5
        })
        .map(([month]) => parseInt(month))

      const partyName = custInvoices[0]?.party
        ? (custInvoices[0].party as any).name
        : 'Unknown'

      patterns.push({
        patternType: 'customer_payment_cycle',
        entityId: partyId,
        entityLabel: partyName,
        data: {
          avgPaymentDays: Math.round(avgDays),
          stdDevDays: Math.round(stdDev),
          isReliablePayer: isReliable,
          slowPaymentMonths: slowMonths,
          sampleInvoices: paymentDays.length,
          lastPaymentDays: paymentDays[paymentDays.length - 1],
          trend: paymentDays.length >= 3
            ? paymentDays[paymentDays.length - 1] > paymentDays[0]
              ? 'getting_slower'
              : paymentDays[paymentDays.length - 1] < paymentDays[0]
              ? 'getting_faster'
              : 'stable'
            : 'unknown',
        },
        confidence: Math.min(
          0.95,
          (paymentDays.length / 10) * (isReliable ? 1 : 0.6)
        ),
        dataPointsUsed: paymentDays.length,
      })
    }
  }

  // ── PATTERN 2: Stock consumption rate ──
  for (const sku of stock) {
    if (sku.reorder_level > 0 && sku.qty_on_hand > 0) {
      const estimatedDailyUsage = (sku.reorder_level * 2) / 30

      if (estimatedDailyUsage > 0) {
        const daysUntilReorder = Math.round(
          (sku.qty_on_hand - sku.reorder_level) / estimatedDailyUsage
        )

        if (daysUntilReorder >= 0 && daysUntilReorder <= 60) {
          patterns.push({
            patternType: 'stock_consumption_rate',
            entityId: sku.id,
            entityLabel: sku.name,
            data: {
              currentQty: sku.qty_on_hand,
              reorderLevel: sku.reorder_level,
              estimatedDailyUsage: Math.round(estimatedDailyUsage * 10) / 10,
              daysUntilReorder,
              daysUntilStockout: Math.round(sku.qty_on_hand / estimatedDailyUsage),
              unit: sku.unit,
            },
            confidence: 0.5,
            dataPointsUsed: 1,
          })
        }
      }
    }
  }

  // ── PATTERN 3: Supplier lead time ──
  const supplierOrders = purchaseOrders.reduce(
    (acc: Record<string, any[]>, po: any) => {
      if (!po.supplier_id) return acc
      if (!acc[po.supplier_id]) acc[po.supplier_id] = []
      acc[po.supplier_id].push(po)
      return acc
    }, {}
  )

  for (const [supplierId, orders] of Object.entries(supplierOrders) as [string, any[]][]) {
    const completedOrders = orders.filter((o: any) => o.received_at && o.created_at)

    if (completedOrders.length < 2) continue

    const leadTimes = completedOrders.map((o: any) =>
      Math.round(
        (new Date(o.received_at).getTime() - new Date(o.created_at).getTime()) / 86400000
      )
    ).filter((d: number) => d >= 0 && d <= 90)

    if (leadTimes.length < 2) continue

    const avgLeadTime = leadTimes.reduce((s: number, d: number) => s + d, 0) / leadTimes.length
    const maxLeadTime = Math.max(...leadTimes)
    const supplierName = orders[0]?.supplier
      ? (orders[0].supplier as any).name
      : 'Unknown'

    patterns.push({
      patternType: 'supplier_lead_time',
      entityId: supplierId,
      entityLabel: supplierName,
      data: {
        avgLeadTimeDays: Math.round(avgLeadTime),
        maxLeadTimeDays: maxLeadTime,
        minLeadTimeDays: Math.min(...leadTimes),
        safeLeadTimeDays: maxLeadTime + 2,
        totalOrders: completedOrders.length,
        isReliable: maxLeadTime < avgLeadTime * 1.5,
      },
      confidence: Math.min(0.9, completedOrders.length / 8),
      dataPointsUsed: completedOrders.length,
    })
  }

  // ── PATTERN 4: Karigar performance pattern ──
  const karigarLogs = production.reduce(
    (acc: Record<string, any[]>, log: any) => {
      if (!acc[log.karigar_id]) {
        acc[log.karigar_id] = []
      }
      acc[log.karigar_id].push(log)
      return acc
    }, {}
  )

  for (const [karigarId, logs] of Object.entries(karigarLogs) as [string, any[]][]) {
    if (logs.length < 5) continue

    const rejectedCount = logs.filter(l => l.grade === 'Rejected').length
    const rejectionRate = rejectedCount / logs.length

    const dayOutput: Record<number, number[]> = {}
    logs.forEach((log: any) => {
      const day = new Date(log.log_date).getDay()
      if (!dayOutput[day]) dayOutput[day] = []
      dayOutput[day].push(log.units_produced || 0)
    })

    const avgByDay = Object.fromEntries(
      Object.entries(dayOutput).map(
        ([day, units]: [string, number[]]) => [
          day,
          units.reduce((s: number, u: number) => s + u, 0) / units.length,
        ]
      )
    )

    const overallAvg = logs.reduce((s: number, l: any) => s + (l.units_produced || 0), 0) / logs.length

    const firstHalf = logs.slice(0, logs.length / 2)
    const secondHalf = logs.slice(logs.length / 2)
    const firstAvg = firstHalf.reduce((s: number, l: any) => s + (l.units_produced || 0), 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((s: number, l: any) => s + (l.units_produced || 0), 0) / secondHalf.length
    const trend = secondAvg > firstAvg * 1.05
      ? 'improving'
      : secondAvg < firstAvg * 0.9
      ? 'declining'
      : 'stable'

    const karigarName = logs[0]?.karigar
      ? (logs[0].karigar as any).name
      : 'Unknown'

    patterns.push({
      patternType: 'karigar_performance',
      entityId: karigarId,
      entityLabel: karigarName,
      data: {
        avgUnitsPerDay: Math.round(overallAvg),
        rejectionRate: Math.round(rejectionRate * 100),
        trend,
        bestDayOfWeek: (Object.entries(avgByDay) as [string, number][])
          .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)[0]?.[0],
        worstDayOfWeek: (Object.entries(avgByDay) as [string, number][])
          .sort(([, a]: [string, number], [, b]: [string, number]) => a - b)[0]?.[0],
        totalLogsAnalyzed: logs.length,
      },
      confidence: Math.min(0.9, logs.length / 20),
      dataPointsUsed: logs.length,
    })
  }

  // ── PATTERN 5: Revenue seasonality ──
  if (invoices.length >= 12) {
    const monthlyRevenue: Record<number, number[]> = {}
    invoices.forEach((inv: any) => {
      const month = new Date(inv.created_at).getMonth()
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = []
      }
      monthlyRevenue[month].push(inv.total_amount || 0)
    })

    const monthlyAvg = Object.fromEntries(
      Object.entries(monthlyRevenue).map(
        ([month, amounts]: [string, number[]]) => [
          month,
          amounts.reduce((s: number, a: number) => s + a, 0) / amounts.length,
        ]
      )
    )

    const allAvg = Object.values(monthlyAvg).reduce((s: number, a: any) => s + a, 0) / Object.values(monthlyAvg).length

    const strongMonths = Object.entries(monthlyAvg)
      .filter(([, avg]: any) => avg > allAvg * 1.2)
      .map(([month]) => parseInt(month))

    const weakMonths = Object.entries(monthlyAvg)
      .filter(([, avg]: any) => avg < allAvg * 0.8)
      .map(([month]) => parseInt(month))

    if (strongMonths.length > 0 || weakMonths.length > 0) {
      patterns.push({
        patternType: 'revenue_seasonality',
        entityId: businessId,
        entityLabel: 'Revenue Pattern',
        data: {
          strongMonths,
          weakMonths,
          monthlyAverages: monthlyAvg,
          overallAverage: Math.round(allAvg),
        },
        confidence: Math.min(0.85, invoices.length / 50),
        dataPointsUsed: invoices.length,
      })
    }
  }

  return patterns
}

export async function savePatterns(
  businessId: string,
  patterns: PatternResult[]
): Promise<void> {
  const supabase = createClient()

  for (const pattern of patterns) {
    await supabase
      .from('business_patterns')
      .upsert({
        business_id: businessId,
        pattern_type: pattern.patternType,
        entity_id: pattern.entityId || businessId,
        entity_label: pattern.entityLabel,
        pattern_data: pattern.data,
        confidence_score: pattern.confidence,
        data_points_used: pattern.dataPointsUsed,
        last_calculated_at: new Date().toISOString(),
        next_recalculate_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, {
        onConflict: 'business_id,pattern_type,entity_id',
      })
  }
}
